import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeId } from './youtube.ts';

const id = 'dQw4w9WgXcQ';

test('elfogadott YouTube formátumok', () => {
  for (const input of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?feature=share&v=${id}&t=42`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}?feature=share`,
    `  https://music.youtube.com/watch?v=${id}  `,
  ]) {
    assert.equal(parseYouTubeId(input), id, input);
  }
});

test('elutasított bemenetek', () => {
  for (const input of ['', 'hello', 'https://vimeo.com/123', 'https://youtube.com/watch?v=short', 'https://evil.com/watch?v=' + id]) {
    assert.equal(parseYouTubeId(input), null, input);
  }
});
