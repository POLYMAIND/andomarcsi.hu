'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Turn = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = ['Hogyan állítsam be a márkaszíneimet Canvában?', 'Hogyan kérdezzek jól Claude-tól?', 'Mire jó a PolyOS?'];

// „Valamit nem értesz?” – AI segítő a kurzus- és leckeoldalakon.
export function ChatWidget({ courseSlug, lessonId, loggedIn }: { courseSlug?: string; lessonId?: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history: Turn[] = [...turns, { role: 'user', content: question }];
    setTurns([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, courseSlug, lessonId }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Valami hiba történt, próbáld újra.' }));
        setTurns([...history, { role: 'assistant', content: err.error }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setTurns([...history, { role: 'assistant', content: answer }]);
      }
    } catch {
      setTurns([...history, { role: 'assistant', content: 'Megszakadt a kapcsolat, próbáld újra.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="AI segítő megnyitása">
          <span aria-hidden>💬</span> Valamit nem értesz?
        </button>
      )}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="AI segítő">
          <div className="chat-head">
            <div className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
              <strong>Valamit nem értesz?</strong>
              <span style={{ fontSize: 12, opacity: 0.75 }}>AI segítő · Canva, Claude, PolyOS</span>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Bezárás">×</button>
          </div>
          <div className="chat-list" ref={listRef}>
            {turns.length === 0 && (
              <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
                <div className="chat-msg assistant">
                  Szia! Kérdezz bátran a kurzusról vagy a Canva, Claude és PolyOS használatáról – lépésről lépésre elmagyarázom. 🙂
                </div>
                {loggedIn &&
                  SUGGESTIONS.map((s) => (
                    <button key={s} className="chat-suggest" onClick={() => send(s)}>{s}</button>
                  ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`chat-msg ${t.role}`}>
                {t.content || (busy && i === turns.length - 1 ? <span className="chat-typing">gépel…</span> : '')}
              </div>
            ))}
          </div>
          {loggedIn ? (
            <form
              className="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                className="chat-input"
                value={input}
                maxLength={2000}
                rows={2}
                placeholder="Írd ide a kérdésed…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <button className="btn sm" type="submit" disabled={busy || !input.trim()}>Küldés</button>
            </form>
          ) : (
            <div className="chat-form">
              <Link href={`/belepes?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/kurzusok')}`} className="btn sm block">
                Belépés a kérdezéshez
              </Link>
            </div>
          )}
          <p className="chat-note">Az AI tévedhet – fontos dolgoknál ellenőrizd. Fiók- és fizetési ügyben: hello@andormarcsi.hu</p>
        </div>
      )}
    </>
  );
}
