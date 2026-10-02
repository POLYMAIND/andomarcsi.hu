import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_FILL_MS, tooFastElapsed, tooFastSince } from './honeypot.ts';

test('szerver-renderelt űrlap: hiányzó vagy hibás időbélyeg = közvetlen POST (bot)', () => {
  assert.equal(tooFastSince(undefined), true);
  assert.equal(tooFastSince(''), true);
  assert.equal(tooFastSince('abc'), true);
});

test('szerver-renderelt űrlap: túl gyors = bot, ember sebessége átmegy', () => {
  const now = 1_790_000_000_000;
  assert.equal(tooFastSince(String(now - 500), now), true);
  assert.equal(tooFastSince(String(now - MIN_FILL_MS - 1), now), false);
  assert.equal(tooFastSince(String(now - 3 * 86_400_000), now), false, 'napokig nyitva hagyott fül is működik');
});

test('kliens-űrlap: eltelt idő', () => {
  assert.equal(tooFastElapsed(undefined), true);
  assert.equal(tooFastElapsed(300), true);
  assert.equal(tooFastElapsed(8000), false);
});
