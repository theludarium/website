// Lists the shirt ideas people sent from /store/suggest-a-shirt/ (D1 table shirt_ideas).
//   node scripts/shirt-ideas.mjs            newest first, every status
//   node scripts/shirt-ideas.mjs new        only one status: new, maybe, made, passed
//   node scripts/shirt-ideas.mjs --mark 12 made    set idea 12's status
// Needs `npx wrangler login` on this machine. Reads the production database.
import { execFileSync } from 'node:child_process';

const STATUSES = ['new', 'maybe', 'made', 'passed'];
const args = process.argv.slice(2);
const d1 = (sql) =>
  JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'ludarium-site', '--remote', '--json', '--command', sql], { encoding: 'utf8' }))[0].results;

if (args[0] === '--mark') {
  const id = Number(args[1]);
  const status = args[2];
  if (!Number.isInteger(id) || !STATUSES.includes(status)) throw new Error(`Usage: --mark <id> <${STATUSES.join('|')}>`);
  d1(`UPDATE shirt_ideas SET status = '${status}' WHERE id = ${id}`);
  console.log(`Idea ${id} is now ${status}.`);
} else {
  const status = args[0];
  if (status && !STATUSES.includes(status)) throw new Error(`Status must be one of ${STATUSES.join(', ')}`);
  const rows = d1(
    `SELECT id, created_at, status, game, idea, meaning, credit_name, email, notify_if_made FROM shirt_ideas${status ? ` WHERE status = '${status}'` : ''} ORDER BY id DESC`,
  );
  if (!rows.length) console.log('No shirt ideas yet.');
  for (const r of rows) {
    console.log(`#${r.id}  ${r.created_at.slice(0, 10)}  [${r.status}]  ${r.game}: ${r.idea}`);
    if (r.meaning) console.log(`      ${r.meaning}`);
    const who = [r.credit_name, r.email, r.notify_if_made ? 'wants to hear if made' : null].filter(Boolean).join(', ');
    if (who) console.log(`      ${who}`);
  }
}
