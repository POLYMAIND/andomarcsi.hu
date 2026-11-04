import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACADEMY_QUIZ, academyLevelFrom, isAcademyLevel } from './polyakademia.ts';

const all = (v: number) => ACADEMY_QUIZ.map(() => v);

test('kvíz: csupa A → 1. szint, csupa B → 2. szint, csupa C → 3. szint', () => {
  assert.equal(academyLevelFrom(all(0)), 1);
  assert.equal(academyLevelFrom(all(1)), 2);
  assert.equal(academyLevelFrom(all(2)), 3);
});

test('kvíz: határesetek (átlag 1,7 és 2,4)', () => {
  // 6 válasz: összeg 10 → átlag 1,67 → 1. szint; összeg 11 → 1,83 → 2. szint
  assert.equal(academyLevelFrom([1, 1, 1, 1, 0, 0]), 1);
  assert.equal(academyLevelFrom([1, 1, 1, 1, 1, 0]), 2);
  // összeg 14 → 2,33 → 2. szint; összeg 15 → 2,5 → 3. szint
  assert.equal(academyLevelFrom([2, 2, 1, 1, 1, 1]), 2);
  assert.equal(academyLevelFrom([2, 2, 2, 1, 1, 1]), 3);
});

test('kvíz: üres válaszlista → 1. szint; szintellenőrzés', () => {
  assert.equal(academyLevelFrom([]), 1);
  assert.ok(isAcademyLevel(2));
  assert.ok(!isAcademyLevel(4));
  assert.ok(!isAcademyLevel('1'));
});
