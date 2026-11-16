import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, initials, memberFor, mentionedIds, mentionToken, plainText, richSegments, splitLinks, timeAgo, validAvatarPath, validImagePath, isVideoPath } from './community.ts';
import { parseOg, safePublicUrl } from './link-preview-parse.ts';
import { parseFrom } from './email.ts';

const ID = '11111111-2222-3333-4444-555555555555';

test('linkek felismerése a szövegben', () => {
  assert.deepEqual(splitLinks('Nézd: https://canva.com/design/abc. Szuper!'), [
    { text: 'Nézd: ' },
    { text: 'https://canva.com/design/abc', href: 'https://canva.com/design/abc' },
    { text: '. Szuper!' },
  ]);
  assert.deepEqual(splitLinks('javascript:alert(1)'), [{ text: 'javascript:alert(1)' }]);
  assert.deepEqual(splitLinks(''), []);
});

test('@említés, félkövér és link együtt', () => {
  const text = `Szia ${mentionToken('Kiss Anna', ID)}, **nagyon jó** lett: https://x.hu/a.`;
  assert.deepEqual(richSegments(text), [
    { type: 'text', text: 'Szia ' },
    { type: 'mention', text: '@Kiss Anna', href: `/kozosseg/tag/${ID}` },
    { type: 'text', text: ', ' },
    { type: 'bold', text: 'nagyon jó' },
    { type: 'text', text: ' lett: ' },
    { type: 'link', text: 'https://x.hu/a', href: 'https://x.hu/a' },
    { type: 'text', text: '.' },
  ]);
  assert.deepEqual(mentionedIds(text), [ID]);
  assert.equal(plainText(text), 'Szia @Kiss Anna, nagyon jó lett: https://x.hu/a.');
  // HTML nem kerülhet be: a < > sima szöveg marad
  assert.deepEqual(richSegments('<script>x</script>'), [{ type: 'text', text: '<script>x</script>' }]);
  // hamis token (nem azonosító) nem említés
  assert.deepEqual(mentionedIds('@[Valaki](nem-uuid)'), []);
});

test('relatív idő és tagság', () => {
  const now = Date.parse('2026-11-15T12:00:00Z');
  assert.equal(timeAgo('2026-11-15T11:59:30Z', now), 'épp most');
  assert.equal(timeAgo('2026-11-15T11:55:00Z', now), '5 perce');
  assert.equal(timeAgo('2026-11-13T12:00:00Z', now), '2 napja');
  assert.equal(memberFor('2026-10-25T12:00:00Z', now), 'Tag 3 hete');
  assert.equal(memberFor('2026-08-01T12:00:00Z', now), 'Tag 3 hónapja');
  assert.equal(memberFor('2026-11-15T10:00:00Z', now), 'Új tag');
});

test('feltöltött fájl útvonala csak a saját mappából', () => {
  assert.equal(validImagePath(`${ID}/a1b2c3d4e5f6a7b8.jpg`, ID), true);
  assert.equal(validImagePath(`${ID}/a1b2c3d4e5f6a7b8.mp4`, ID), true);
  assert.equal(validImagePath(`${ID}/../masik/a1b2c3d4e5f6.jpg`, ID), false);
  assert.equal(validImagePath(`99999999-2222-3333-4444-555555555555/a1b2c3d4e5f6a7b8.jpg`, ID), false);
  assert.equal(validImagePath(`${ID}/a1b2c3d4e5f6a7b8.svg`, ID), false);
  assert.equal(validAvatarPath(`${ID}/avatar-a1b2c3d4e5f6.jpg`, ID), true);
  assert.equal(validAvatarPath(`${ID}/a1b2c3d4e5f6.jpg`, ID), false);
  assert.equal(isVideoPath(`${ID}/x.mov`), true);
});

test('platform a linkből', () => {
  assert.equal(detectPlatform('https://www.instagram.com/p/abc/'), 'instagram');
  assert.equal(detectPlatform('https://youtu.be/xyz'), 'youtube');
  assert.equal(detectPlatform('https://m.facebook.com/x'), 'facebook');
  assert.equal(detectPlatform('https://vm.tiktok.com/x'), 'tiktok');
  assert.equal(detectPlatform('https://pelda.hu'), null);
  assert.equal(detectPlatform('nem link'), null);
  assert.equal(initials('Andor Marcsi'), 'AM');
});

test('link-előnézet: OG-adatok és biztonságos cím', () => {
  const html = `<html><head><title>Tartalék</title><meta content="Kész a karusszel &amp; más" property="og:title"><meta name="description" content="Leírás"><meta property="og:image" content="https://x.hu/k.jpg"></head></html>`;
  assert.deepEqual(parseOg(html), { title: 'Kész a karusszel & más', description: 'Leírás', image: 'https://x.hu/k.jpg' });
  assert.equal(parseOg('<title>Csak cím</title>').title, 'Csak cím');
  assert.ok(safePublicUrl('https://www.instagram.com/p/x'));
  assert.equal(safePublicUrl('http://localhost:3000/'), null);
  assert.equal(safePublicUrl('http://169.254.169.254/latest'), null);
  assert.equal(safePublicUrl('ftp://pelda.hu'), null);
  assert.equal(safePublicUrl('https://user:pw@pelda.hu'), null);
});

test('feladó név és cím', () => {
  assert.deepEqual(parseFrom('Andor Marcsi <kozosseg@andormarcsi.hu>'), { name: 'Andor Marcsi', email: 'kozosseg@andormarcsi.hu' });
  assert.deepEqual(parseFrom('hello@andormarcsi.hu'), { name: 'Andor Marcsi', email: 'hello@andormarcsi.hu' });
});
