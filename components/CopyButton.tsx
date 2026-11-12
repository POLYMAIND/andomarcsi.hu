'use client';

import { useState } from 'react';

// „Másolom” gomb a promptdobozokhoz: a szöveget a vágólapra teszi, és 2 mp-ig jelzi, hogy kész.
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  }
  return (
    <button type="button" className="guide-copy" onClick={copy} aria-live="polite">
      {done ? 'Kimásolva ✓' : 'Másolom'}
    </button>
  );
}
