import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guideOutline, parseGuide, parseInline } from './guide.ts';

test('soron belüli jelölések', () => {
  assert.deepEqual(parseInline('a **b** `c` [d](https://pelda.hu)'), [
    { t: 'text', v: 'a ' }, { t: 'b', v: 'b' }, { t: 'text', v: ' ' }, { t: 'code', v: 'c' }, { t: 'text', v: ' ' }, { t: 'link', v: 'd', href: 'https://pelda.hu' },
  ]);
});

test('nem https link és HTML: sima szöveg marad', () => {
  assert.deepEqual(parseInline('[x](javascript:alert(1)) <b>y</b>'), [{ t: 'text', v: '[x](javascript:alert(1)) <b>y</b>' }]);
});

test('blokkok: cím, lista, prompt, tipp, táblázat', () => {
  const b = parseGuide([
    '## 1. lépés: Vedd fel',
    'Egy **dolgod** van.',
    'Második sor.',
    '',
    '1. egy',
    '2. kettő',
    '   folytatás',
    '',
    '```prompt Első videó',
    'Vágd meg.',
    '- szünetek ki',
    '```',
    '',
    '> **Tipp:** Írj egyszerre többet.',
    '',
    '| Mi történt | Mit csinálj |',
    '|---|---|',
    '| Rossz szó | Írd meg |',
  ].join('\n'));
  assert.deepEqual(b.map((x) => x.k), ['h', 'p', 'ol', 'prompt', 'tip', 'table']);
  assert.equal(b[0].k === 'h' && b[0].id, '1-lepes-vedd-fel');
  assert.deepEqual(b[2].k === 'ol' && b[2].items.map((it) => it.map((x) => x.v).join('')), ['egy', 'kettő folytatás']);
  assert.deepEqual(b[3].k === 'prompt' && [b[3].title, b[3].body], ['Első videó', 'Vágd meg.\n- szünetek ki']);
  assert.equal(b[4].k === 'tip' && b[4].label, 'Tipp');
  assert.equal(b[5].k === 'table' && b[5].rows.length, 1);
  assert.deepEqual(guideOutline(b), [{ id: '1-lepes-vedd-fel', text: '1. lépés: Vedd fel' }]);
});
