// Online tananyag (ingyenes anyagok, zsebcsomagok) egyszerű Markdown-szövegből.
// Szándékosan kicsi és szigorú: nincs nyers HTML, csak ezek a blokkok:
//   # / ## / ### cím · bekezdés · - lista · 1. számozott lista · > tipp (az első **félkövér** a címkéje)
//   ```prompt Cím … ``` másolható prompt · ``` … ``` kódblokk · | táblázat | · ---- elválasztó
// Soron belül: **félkövér**, `kód`, [szöveg](https://link).

export type Inline = { t: 'text' | 'b' | 'code'; v: string } | { t: 'link'; v: string; href: string };
export type Block =
  | { k: 'h'; level: 1 | 2 | 3; text: Inline[]; id: string }
  | { k: 'p'; text: Inline[] }
  | { k: 'ul' | 'ol'; items: Inline[][] }
  | { k: 'tip'; label: string; text: Inline[][] }
  | { k: 'prompt'; title: string; body: string }
  | { k: 'code'; body: string }
  | { k: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { k: 'hr' };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'b', v: m[1] });
    else if (m[2] !== undefined) out.push({ t: 'code', v: m[2] });
    else out.push({ t: 'link', v: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => parseInline(c.trim()));

export function parseGuide(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^```\s*(prompt)?\s*(.*)$/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++; // záró ```
      blocks.push(fence[1] ? { k: 'prompt', title: fence[2].trim() || 'Prompt', body: body.join('\n') } : { k: 'code', body: body.join('\n') });
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      blocks.push({ k: 'h', level: h[1].length as 1 | 2 | 3, text: parseInline(h[2].trim()), id: slugify(h[2]) });
      i++;
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) { blocks.push({ k: 'hr' }); i++; continue; }
    if (line.startsWith('>')) {
      const paras: string[][] = [[]];
      while (i < lines.length && lines[i].startsWith('>')) {
        const t = lines[i].replace(/^>\s?/, '');
        if (!t.trim()) paras.push([]);
        else paras[paras.length - 1].push(t);
        i++;
      }
      const joined = paras.filter((p) => p.length).map((p) => p.join(' '));
      const lab = joined[0]?.match(/^\*\*(.+?)\*\*\s*/);
      if (lab) joined[0] = joined[0].slice(lab[0].length);
      blocks.push({ k: 'tip', label: lab ? lab[1].replace(/:$/, '') : 'Tipp', text: joined.filter(Boolean).map(parseInline) });
      continue;
    }
    if (/^\|.*\|\s*$/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
      const body = rows.filter((r) => !/^\|[\s:|-]+\|\s*$/.test(r));
      const [head, ...rest] = body;
      blocks.push({ k: 'table', head: cells(head), rows: rest.map(cells) });
      continue;
    }
    const li = /^[-*]\s+/;
    const oli = /^\d+[.)]\s+/;
    if (li.test(line) || oli.test(line)) {
      const re = li.test(line) ? li : oli;
      const items: string[] = [];
      while (i < lines.length && (re.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (re.test(lines[i])) items.push(lines[i].replace(re, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      blocks.push({ k: re === li ? 'ul' : 'ol', items: items.map(parseInline) });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\||[-*]\s|\d+[.)]\s|-{3,}\s*$)/.test(lines[i])) para.push(lines[i++].trim());
    if (para.length) blocks.push({ k: 'p', text: parseInline(para.join(' ')) });
    else i++;
  }
  return blocks;
}

// Tartalomjegyzék a ## címekből (a nyilvános előnézethez és az oldalsó ugráshoz).
export const guideOutline = (blocks: Block[]) =>
  blocks.filter((b): b is Extract<Block, { k: 'h' }> => b.k === 'h' && b.level === 2).map((b) => ({ id: b.id, text: b.text.map((x) => x.v).join('') }));
