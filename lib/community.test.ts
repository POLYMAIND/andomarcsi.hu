import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initials, kindFromSlug, splitLinks, timeAgo, validImagePath } from './community.ts';

test('linkek felismerése a szövegben', () => {
  assert.deepEqual(splitLinks('Nézd: https://canva.com/design/abc. Szuper!'), [
    { text: 'Nézd: ' },
    { text: 'https://canva.com/design/abc', href: 'https://canva.com/design/abc' },
    { text: '. Szuper!' },
  ]);
  assert.deepEqual(splitLinks('javascript:alert(1)'), [{ text: 'javascript:alert(1)' }]);
  assert.deepEqual(splitLinks(''), []);
});

test('relatív idő', () => {
  const now = Date.parse('2026-11-15T12:00:00Z');
  assert.equal(timeAgo('2026-11-15T11:59:30Z', now), 'épp most');
  assert.equal(timeAgo('2026-11-15T11:55:00Z', now), '5 perce');
  assert.equal(timeAgo('2026-11-15T09:00:00Z', now), '3 órája');
  assert.equal(timeAgo('2026-11-13T12:00:00Z', now), '2 napja');
});

test('feltöltött kép útvonala csak a saját mappából', () => {
  const me = '11111111-2222-3333-4444-555555555555';
  assert.equal(validImagePath(`${me}/a1b2c3d4e5f6a7b8.jpg`, me), true);
  assert.equal(validImagePath(`${me}/../masik/a1b2c3d4e5f6.jpg`, me), false);
  assert.equal(validImagePath(`99999999-2222-3333-4444-555555555555/a1b2c3d4e5f6a7b8.jpg`, me), false);
  assert.equal(validImagePath(`${me}/a1b2c3d4e5f6a7b8.svg`, me), false);
});

test('típus az URL-ből és monogram', () => {
  assert.equal(kindFromSlug('kerdes'), 'question');
  assert.equal(kindFromSlug('munka'), 'showcase');
  assert.equal(kindFromSlug('x'), null);
  assert.equal(initials('Andor Marcsi'), 'AM');
  assert.equal(initials(''), '?');
});
