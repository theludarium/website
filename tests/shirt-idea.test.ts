// Tests for functions/api/shirt-idea.ts, the Suggest a shirt form. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LIMITS, emailText, parseIdea } from '../functions/api/shirt-idea.ts';

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

test('game and idea alone are enough', () => {
  const idea = parseIdea(form({ game: 'Catan', idea: 'I have wood for sheep' }));
  assert.ok(!('error' in idea));
  assert.equal(idea.email, null);
  assert.equal(idea.notifyIfMade, false);
});

test('a missing game or idea is refused', () => {
  assert.deepEqual(parseIdea(form({ idea: 'Wood for sheep' })), { error: 'missing' });
  assert.deepEqual(parseIdea(form({ game: 'Catan' })), { error: 'missing' });
});

test('asking to be told needs a real email', () => {
  assert.deepEqual(parseIdea(form({ game: 'Catan', idea: 'x', notify_if_made: 'yes' })), { error: 'email' });
  assert.deepEqual(parseIdea(form({ game: 'Catan', idea: 'x', email: 'not-an-email' })), { error: 'email' });
  const ok = parseIdea(form({ game: 'Catan', idea: 'x', email: 'sam@example.com', notify_if_made: 'yes' }));
  assert.ok(!('error' in ok) && ok.notifyIfMade);
});

test('long fields are refused and line breaks are flattened', () => {
  assert.deepEqual(parseIdea(form({ game: 'Catan', idea: 'x'.repeat(LIMITS.idea + 1) })), { error: 'long' });
  const idea = parseIdea(form({ game: 'Cat\nan', idea: 'two\nlines' }));
  assert.ok(!('error' in idea));
  assert.equal(idea.game, 'Cat an');
  assert.equal(idea.idea, 'two lines');
});

test('the email to Levi carries every field', () => {
  const idea = parseIdea(form({ game: 'Catan', idea: 'Wood for sheep', meaning: 'The classic trade', credit_name: 'Sam', email: 'sam@example.com', notify_if_made: 'yes' }));
  assert.ok(!('error' in idea));
  const text = emailText(idea, 7);
  for (const part of ['Catan', 'Wood for sheep', 'The classic trade', 'Sam', 'sam@example.com', 'idea #7', 'yes']) assert.ok(text.includes(part), part);
});
