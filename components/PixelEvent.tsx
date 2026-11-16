'use client';

import { useEffect, useRef } from 'react';
import { fbqTrack } from '@/lib/pixel';

// Oldalon belüli Meta-esemény (pl. ViewContent, Purchase). `once` kulccsal böngészőnként egyszer küldi (pl. vásárlás).
export function PixelEvent({ event, params, eventId, once }: { event: string; params?: Record<string, unknown>; eventId?: string; once?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (once) {
      try {
        const k = `px-${once}`;
        if (localStorage.getItem(k)) return;
        localStorage.setItem(k, '1');
      } catch {}
    }
    fbqTrack(event, params, eventId);
  }, [event, params, eventId, once]);
  return null;
}

// A vásárlás gomb űrlapjára teszi az InitiateCheckout eseményt (a szülő <form> beküldésekor).
export function TrackFormSubmit({ event, params }: { event: string; params?: Record<string, unknown> }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    const onSubmit = () => fbqTrack(event, params);
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, [event, params]);
  return <span ref={ref} hidden />;
}
