// Tests for functions/api/guild-capstone.ts, the Guild of Game Guides
// capstone form. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FEEDBACK, RUBRIC, emailText, parseCapstone, totalScore } from '../functions/api/guild-capstone.ts';

function form(overrides: Record<string, string> = {}): FormData {
  const f = new FormData();
  const values: Record<string, string> = {
    name: 'Sam Rivera',
    email: 'sam@example.com',
    game: 'Ticket to Ride',
    relationship: 'Family member',
    fb_fun: 'Claiming the long route',
    fb_lost: 'Not really',
    fb_length: 'About right',
    fb_about: 'Trains across America',
    fb_again: 'Yes',
    change: 'Shorter setup',
    order: '#1234567',
    ...Object.fromEntries(RUBRIC.map((line) => [`rubric_${line.key}`, '4'])),
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

test('a complete submission parses and totals', () => {
  const c = parseCapstone(form());
  assert.ok(!('error' in c));
  assert.equal(totalScore(c), 40);
  assert.equal(c.certName, 'Sam Rivera');
  assert.equal(Object.keys(c.feedback).length, FEEDBACK.length);
});

test('the certificate name can differ from the contact name', () => {
  const c = parseCapstone(form({ cert_name: 'Samantha Rivera' }));
  assert.ok(!('error' in c));
  assert.equal(c.certName, 'Samantha Rivera');
});

test('scores must be whole numbers from 1 to 5', () => {
  assert.deepEqual(parseCapstone(form({ rubric_hook: '6' })), { error: 'scores' });
  assert.deepEqual(parseCapstone(form({ rubric_pace: '' })), { error: 'scores' });
});

test('choice answers must be one of the options', () => {
  assert.deepEqual(parseCapstone(form({ fb_again: 'Definitely' })), { error: 'feedback' });
});

test('missing details and bad email are refused', () => {
  assert.deepEqual(parseCapstone(form({ game: '' })), { error: 'missing' });
  assert.deepEqual(parseCapstone(form({ email: 'not-an-email' })), { error: 'email' });
  assert.deepEqual(parseCapstone(form({ relationship: 'Stranger' })), { error: 'missing' });
});

test('the email names the second-game answer and the next step', () => {
  const yes = parseCapstone(form());
  const no = parseCapstone(form({ fb_again: 'Maybe' }));
  assert.ok(!('error' in yes) && !('error' in no));
  assert.match(emailText(yes), /make the certificate/);
  assert.match(emailText(no), /no certificate yet/);
});

test('the review fee needs an order number unless the student joined early', () => {
  const paid = parseCapstone(form());
  assert.ok(!('error' in paid));
  assert.equal(paid.order, '1234567');
  assert.match(emailText(paid), /order #1234567/);
  assert.deepEqual(parseCapstone(form({ order: '' })), { error: 'order' });
  const early = parseCapstone(form({ order: '', early: 'yes' }));
  assert.ok(!('error' in early));
  assert.equal(early.order, '');
  assert.match(emailText(early), /joined the Guild before the fee/);
  assert.deepEqual(parseCapstone(form({ order: 'x'.repeat(41) })), { error: 'long' });
});

test('the register opt-in reaches the email', () => {
  const yes = parseCapstone(form({ register: 'yes' }));
  const no = parseCapstone(form());
  assert.ok(!('error' in yes) && !('error' in no));
  assert.match(emailText(yes), /On the register:  Yes/);
  assert.match(emailText(no), /On the register:  No/);
});
