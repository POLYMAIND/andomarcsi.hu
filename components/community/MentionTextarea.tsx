'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const TOKEN = /@\[([^\]\n]{1,60})\]\(([0-9a-f-]{36})\)/gi;
type Member = { id: string; name: string };

// Szövegmező @említéssel és **félkövér** gombbal. A felületen „@Név” látszik; a beküldött (rejtett) mezőben
// @[Név](azonosító) token megy, ebből lesz az értesítés és a profil-link.
export function MentionTextarea({
  name,
  defaultValue = '',
  placeholder,
  rows = 4,
  maxLength = 5000,
  required = false,
  autoFocus = false,
  onTextChange,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  autoFocus?: boolean;
  onTextChange?: (encoded: string) => void;
}) {
  const initial = useMemo(() => {
    const map = new Map<string, string>();
    const text = defaultValue.replace(TOKEN, (_, n: string, id: string) => {
      map.set(n, id);
      return `@${n}`;
    });
    return { text, map };
  }, [defaultValue]);
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState(initial.map);
  const [query, setQuery] = useState<string | null>(null);
  const [options, setOptions] = useState<Member[]>([]);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  // A beküldött érték: a megjelölt nevek tokenné alakítva (a hosszabb név előbb, hogy ne törjön szét)
  const encoded = useMemo(() => {
    let out = text;
    for (const [n, id] of [...mentions].sort((a, b) => b[0].length - a[0].length)) {
      out = out.split(`@${n}`).join(`@[${n}](${id})`);
    }
    return out;
  }, [text, mentions]);
  useEffect(() => onTextChange?.(encoded), [encoded, onTextChange]);

  useEffect(() => {
    if (query === null) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/kozosseg/tagok?q=${encodeURIComponent(query)}`).catch(() => null);
      setOptions(res?.ok ? await res.json() : []);
      setActive(0);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  function detect(value: string, caret: number) {
    const m = /(^|\s)@([\p{L}\p{N}.' -]{0,30})$/u.exec(value.slice(0, caret));
    setQuery(m && !m[2].includes('  ') ? m[2] : null);
  }

  function pick(member: Member) {
    const el = ref.current!;
    const caret = el.selectionStart;
    const before = text.slice(0, caret).replace(/@([\p{L}\p{N}.' -]{0,30})$/u, `@${member.name} `);
    const next = before + text.slice(caret);
    setText(next);
    setMentions((m) => new Map(m).set(member.name, member.id));
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  }

  function bold() {
    const el = ref.current!;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = text.slice(s, e) || 'félkövér';
    const next = `${text.slice(0, s)}**${sel}**${text.slice(e)}`;
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 2, s + 2 + sel.length);
    });
  }

  return (
    <div className="kz-mention-box">
      <div className="kz-toolbar">
        <button type="button" onClick={bold} title="Félkövér" aria-label="Félkövér"><b>B</b></button>
        <span className="muted">Tipp: írj @-ot, és megjelölhetsz valakit.</span>
      </div>
      <textarea
        ref={ref}
        className="input textarea"
        value={text}
        rows={rows}
        maxLength={maxLength}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          detect(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={(e) => {
          if (query === null || !options.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
          else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(options[active]); }
          else if (e.key === 'Escape') setQuery(null);
        }}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {query !== null && options.length > 0 && (
        <ul className="kz-mention-list" role="listbox">
          {options.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(m); }} className={i === active ? 'on' : ''}>@{m.name}</button>
            </li>
          ))}
        </ul>
      )}
      <input type="hidden" name={name} value={encoded} />
    </div>
  );
}
