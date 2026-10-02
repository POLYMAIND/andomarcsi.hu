import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HONEYPOT_FIELD, honeypotInputProps, honeypotTripped } from './honeypot.ts';

test('üres vagy hiányzó mező: nem bot', () => {
  assert.equal(honeypotTripped(''), false);
  assert.equal(honeypotTripped('   '), false);
  assert.equal(honeypotTripped(null), false);
  assert.equal(honeypotTripped(undefined), false);
});

test('kitöltött mező: bot', () => {
  assert.equal(honeypotTripped('http://spam.example'), true);
});

test('a mező neve nem kitöltési minta (a régi `website` név elnyelte a valódi feliratkozókat)', () => {
  assert.equal(honeypotInputProps.name, HONEYPOT_FIELD);
  assert.doesNotMatch(HONEYPOT_FIELD, /website|url|name|mail|phone|company|address|homepage/i);
  assert.equal(honeypotInputProps['data-1p-ignore'], 'true');
});
