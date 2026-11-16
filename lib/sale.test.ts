import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saleActive, saleInfo, withStart } from './types.ts';

const base = { coming_soon: false, starts_at: null, price_huf: 69900, sale_price_huf: 34950, sale_starts_at: null, sale_ends_at: '2026-12-31T22:59:59.000Z', sale_label: 'Bevezető ár', list_price_huf: null as number | null };
const before = Date.parse('2026-11-16T10:00:00Z');
const after = Date.parse('2027-01-01T00:00:00Z');

test('akció a lejáratig él, utána magától megszűnik', () => {
  assert.equal(saleActive(base, before), true);
  assert.equal(saleActive(base, after), false);
  const on = withStart(base, before);
  assert.equal(on.price_huf, 34950);
  assert.equal(on.list_price_huf, 69900);
  const off = withStart(base, after);
  assert.equal(off.price_huf, 69900);
  assert.equal(off.list_price_huf, null);
});

test('kétszer alkalmazva sem csökken tovább az ár', () => {
  const twice = withStart(withStart(base, before), before);
  assert.equal(twice.price_huf, 34950);
  assert.equal(twice.list_price_huf, 69900);
});

test('nem akció, ha nincs valódi kedvezmény vagy még nem kezdődött el', () => {
  assert.equal(saleActive({ ...base, sale_price_huf: 69900 }, before), false);
  assert.equal(saleActive({ ...base, sale_price_huf: null }, before), false);
  assert.equal(saleActive({ ...base, sale_starts_at: '2026-12-01T00:00:00Z' }, before), false);
  assert.equal(saleActive({ ...base, price_huf: null }, before), false);
});

test('akció a megjelenítéshez: százalék és lejárat', () => {
  const info = saleInfo(withStart(base, before));
  assert.deepEqual(info, { listPrice: 69900, pct: 50, until: 'dec. 31-ig', label: 'Bevezető ár' });
  assert.equal(saleInfo(withStart(base, after)), null);
});
