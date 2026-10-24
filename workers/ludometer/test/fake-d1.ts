// A tiny stand-in for D1 that records SQL and answers from a handler.
export type Answer = { first?: unknown; all?: unknown[] };
export interface Call { sql: string; args: unknown[] }

export function fakeD1(answer: (sql: string, args: unknown[]) => Answer = () => ({})) {
  const calls: Call[] = [];
  const stmt = (sql: string, args: unknown[] = []): any => ({
    sql, args,
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => { calls.push({ sql, args }); return answer(sql, args).first ?? null; },
    all: async () => { calls.push({ sql, args }); return { results: answer(sql, args).all ?? [] }; },
    run: async () => { calls.push({ sql, args }); return { success: true }; },
  });
  const db = {
    prepare: (sql: string) => stmt(sql),
    batch: async (stmts: any[]) => { for (const s of stmts) calls.push({ sql: s.sql, args: s.args }); return []; },
  };
  return { db: db as unknown as D1Database, calls };
}
