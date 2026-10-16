'use client';

import { useFormStatus } from 'react-dom';

// Űrlapgomb, ami küldés közben „Folyamatban…” feliratot mutat és letiltja magát.
export function SubmitButton({ children, pending = 'Folyamatban…', className = 'btn light sm' }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={isPending} aria-busy={isPending}>
      {isPending ? pending : children}
    </button>
  );
}
