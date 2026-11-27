import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactCsvRow, filterContacts, mergeContacts, sanitizeSourceName, type Touch } from './contacts.ts';

const touches: Touch[] = [
  { email: 'Anna@Pelda.hu ', name: null, kind: 'newsletter', detail: null, at: '2026-10-01T10:00:00Z' },
  { email: 'anna@pelda.hu', name: 'Kiss Anna', kind: 'registered', detail: null, at: '2026-10-05T10:00:00Z' },
  { email: 'anna@pelda.hu', name: 'Anna', kind: 'download', detail: 'Canva checklist', at: '2026-10-07T10:00:00Z' },
  { email: 'anna@pelda.hu', name: null, kind: 'download', detail: 'Canva checklist', at: '2026-10-08T10:00:00Z' },
  { email: 'bela@pelda.hu', name: 'Béla', kind: 'external', detail: 'polysuli', at: '2026-09-01T10:00:00Z' },
  { email: '', name: 'üres', kind: 'newsletter', detail: null, at: '2026-09-01T10:00:00Z' },
];

test('e-mail szerint összefésül, kis-nagybetűtől függetlenül', () => {
  const list = mergeContacts(touches);
  assert.equal(list.length, 2);
  const anna = list.find((c) => c.email === 'anna@pelda.hu')!;
  assert.deepEqual(anna.kinds, ['registered', 'newsletter', 'download']);
  assert.equal(anna.name, 'Kiss Anna'); // a legkorábbi megadott név
  assert.equal(anna.first_at, '2026-10-01T10:00:00Z');
  assert.equal(anna.last_at, '2026-10-08T10:00:00Z');
  assert.deepEqual(anna.details.download, ['Canva checklist']);
  assert.equal(list[0].email, 'anna@pelda.hu'); // legutóbbi elöl
});

test('szűrés forrásra és külső forrás nevére', () => {
  const list = mergeContacts(touches);
  assert.equal(filterContacts(list, { forras: 'download' }).length, 1);
  assert.equal(filterContacts(list, { forras: 'external:polysuli' })[0].email, 'bela@pelda.hu');
  assert.equal(filterContacts(list, { forras: 'external:mas' }).length, 0);
  assert.equal(filterContacts(list, { q: 'béla' }).length, 1);
});

test('CSV sor', () => {
  const [anna] = mergeContacts(touches);
  const row = contactCsvRow(anna);
  assert.equal(row[0], 'anna@pelda.hu');
  assert.equal(row[5], true);
  assert.equal(row[9], 'Canva checklist');
});

test('külső forrás neve', () => {
  assert.equal(sanitizeSourceName(' Polysuli '), 'polysuli');
  assert.equal(sanitizeSourceName('poly suli'), null);
  assert.equal(sanitizeSourceName(''), null);
});

test('CSV-import: pontosvesszős magyar Excel, idézőjelek, ismétlődés, hibás sor', async () => {
  const { contactsFromCsv } = await import('./contacts.ts');
  const csv = '﻿E-mail cím;Vezetéknév;Keresztnév\r\nAnna@Pelda.hu;Kiss;Anna\r\n"bela@pelda.hu";"Nagy; Béla";\r\nnem-email;X;Y\r\nanna@pelda.hu;Kiss;Anna\r\n';
  const r = contactsFromCsv(csv);
  assert.deepEqual(r.rows, [
    { email: 'anna@pelda.hu', name: 'Kiss Anna' },
    { email: 'bela@pelda.hu', name: 'Nagy; Béla' },
  ]);
  assert.equal(r.invalid, 1);
});

test('CSV-import: vesszős, név oszloppal; fejléc nélkül az első oszlop az e-mail', async () => {
  const { contactsFromCsv } = await import('./contacts.ts');
  assert.deepEqual(contactsFromCsv('email,name\ncili@pelda.hu,"Cili, a nagy"\n').rows, [{ email: 'cili@pelda.hu', name: 'Cili, a nagy' }]);
  assert.deepEqual(contactsFromCsv('dora@pelda.hu\nede@pelda.hu\n').rows.map((r) => r.email), ['dora@pelda.hu', 'ede@pelda.hu']);
  assert.equal(contactsFromCsv('nev,telefon\nAnna,123\n').rows.length, 0, 'e-mail oszlop nélkül semmi');
});
