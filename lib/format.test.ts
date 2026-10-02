import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budapestLocalToIso, formatHuf, isoToBudapestLocal, slugify } from './format.ts';

test('forint formázás', () => {
  assert.equal(formatHuf(0), 'Ingyenes');
  assert.equal(formatHuf(20000), '20 000 Ft');
  assert.equal(formatHuf(4990), '4 990 Ft');
});

test('slug ékezetekkel', () => {
  assert.equal(slugify('Hirdetéskezelés AI eszközökkel!'), 'hirdeteskezeles-ai-eszkozokkel');
});

test('budapesti idő ↔ ISO, téli és nyári időben', () => {
  assert.equal(budapestLocalToIso('2026-01-15T10:00'), '2026-01-15T09:00:00.000Z');
  assert.equal(budapestLocalToIso('2026-07-15T10:00'), '2026-07-15T08:00:00.000Z');
  assert.equal(isoToBudapestLocal('2026-07-15T08:00:00.000Z'), '2026-07-15T10:00');
  assert.equal(isoToBudapestLocal('2026-01-15T09:00:00Z'), '2026-01-15T10:00');
  assert.equal(budapestLocalToIso('rossz'), null);
});
