// A stand-in for Cloudflare D1 in tests: Node's built-in SQLite behind the
// slice of the D1 API the site uses (src/server/where-we-play/env.ts). It loads
// the real migration files, so tests run the same SQL as production, with
// foreign keys on as D1 has them.
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1, D1Statement } from '../../src/server/where-we-play/env.ts';

const MIGRATIONS = new URL('../../migrations/', import.meta.url);

/** D1 stores true and false as 1 and 0 and refuses undefined. */
const toSql = (value: unknown) => {
  if (value === undefined) throw new Error('D1_TYPE_ERROR: undefined cannot be bound; use null');
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value as null | number | bigint | string;
};

const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

export type TestDb = D1 & {
  /** The SQLite database underneath, for setup and for checking rows directly. */
  raw: DatabaseSync;
  /** Runs SQL that may hold several statements. */
  exec(sql: string): void;
};

/**
 * A fresh in-memory database with the migrations applied in order.
 * By default every migration runs except the sample events (0009), which a
 * test can ask for with `{ samples: true }`. `only` picks files by their number.
 */
export function testDb(options: { samples?: boolean; only?: string[] } = {}): TestDb {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  const files = readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .filter((name) => (options.only ? options.only.some((n) => name.startsWith(n)) : options.samples || !name.startsWith('0009')));
  for (const name of files) raw.exec(readFileSync(new URL(name, MIGRATIONS), 'utf8'));

  const statement = (sql: string, values: unknown[] = []): D1Statement & { execute(): unknown } => ({
    bind: (...next: unknown[]) => statement(sql, next),
    async first<T>() {
      const row = raw.prepare(sql).get(...values.map(toSql));
      return row === undefined ? null : plain<T>(row);
    },
    async all<T>() {
      return { results: raw.prepare(sql).all(...values.map(toSql)).map((row) => plain<T>(row)) };
    },
    async run() {
      const result = raw.prepare(sql).run(...values.map(toSql));
      return { meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
    },
    execute() {
      const result = raw.prepare(sql).run(...values.map(toSql));
      return { success: true, meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
    },
  });

  return {
    raw,
    exec: (sql: string) => raw.exec(sql),
    prepare: (sql: string) => statement(sql),
    // D1 runs a batch as one transaction: all of it lands, or none of it.
    async batch(statements: D1Statement[]) {
      raw.exec('BEGIN');
      try {
        const results = statements.map((s) => (s as D1Statement & { execute(): unknown }).execute());
        raw.exec('COMMIT');
        return results;
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
