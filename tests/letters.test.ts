// Tests for the Ludarium Letters wiring in src/lib/config.ts: one Kit form per
// letter, each with its own address and copy, and the general letter kept as
// the site-wide default. (Which letter each article category joins lives in
// src/lib/site.ts; its `letters` values are checked by the LettersKey type at
// build time, and Node cannot import that file's extensionless imports here.)
// Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KIT_LETTERS_FORMS, KIT_NEWSLETTER_FORM, LETTERS_KEYS } from '../src/lib/config.ts';

const KIT_FORM_ACTION = /^https:\/\/app\.kit\.com\/forms\/\d+\/subscriptions$/;

test('there is a Kit form for each of the four letters', () => {
  assert.deepEqual([...LETTERS_KEYS].sort(), ['cube', 'general', 'industry', 'tabletop']);
  for (const key of LETTERS_KEYS) {
    const letter = KIT_LETTERS_FORMS[key];
    assert.match(letter.action, KIT_FORM_ACTION, `${key} action`);
    assert.equal(letter.name, `Ludarium Letters - ${key[0].toUpperCase()}${key.slice(1)}`);
    assert.ok(letter.buttonLabel.length > 0 && letter.note.length > 0 && letter.lede.length > 0, `${key} copy`);
  }
});

test('each letter posts to its own form', () => {
  const actions = LETTERS_KEYS.map((key) => KIT_LETTERS_FORMS[key].action);
  assert.equal(new Set(actions).size, actions.length);
});

test('the general letter is the site-wide default form', () => {
  assert.equal(KIT_NEWSLETTER_FORM.action, KIT_LETTERS_FORMS.general.action);
  assert.equal(KIT_NEWSLETTER_FORM.emailField, 'email_address');
});

test('no signup copy uses an em dash', () => {
  for (const key of LETTERS_KEYS) {
    const letter = KIT_LETTERS_FORMS[key];
    for (const text of [letter.name, letter.buttonLabel, letter.note, letter.lede]) {
      assert.ok(!text.includes('\u2014'), `${key}: ${text}`);
    }
  }
});
