import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budapestLocalToIso, currentPrice, formatHuf, isoToBudapestLocal, saleActive, slugify } from './format.ts';

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

test('akciós ár: áthúzott eredeti ár, lejárat után vissza', () => {
  const c = { price_huf: 34950, list_price_huf: 69900, sale_until: '2026-12-31T22:59:59Z' };
  const before = Date.parse('2026-11-16T10:00:00Z');
  const after = Date.parse('2027-01-01T00:00:00Z');
  assert.equal(saleActive(c, before), true);
  assert.equal(currentPrice(c, before), 34950);
  assert.equal(saleActive(c, after), false);
  assert.equal(currentPrice(c, after), 69900);
  assert.equal(currentPrice({ price_huf: 9990 }), 9990);
});
