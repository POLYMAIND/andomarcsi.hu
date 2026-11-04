'use client';

import { useEffect, useRef, useState } from 'react';

// Vízszintesen görgethető fejezetmenü: a szélén elhalványul, ha arra még van tartalom (jelzi, hogy görgethető).
export function ScrollFadeNav({ items, className = 'ps-toc', label = 'Fejezetek' }: { items: readonly (readonly [string, string])[]; className?: string; label?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <nav ref={ref} className={className} aria-label={label} data-fade-left={edges.left || undefined} data-fade-right={edges.right || undefined}>
      {items.map(([href, text]) => <a key={href} href={href}>{text}</a>)}
    </nav>
  );
}
