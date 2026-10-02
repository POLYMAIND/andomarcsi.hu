import Link from 'next/link';

// Kötelező nyilatkozatok vásárlás előtt (ÁSZF + adatkezelés, digitális tartalom – 45/2014. Korm. r. 29. § (1) m)).
export function PurchaseConsents({ digital = true }: { digital?: boolean }) {
  return (
    <div className="stack" style={{ '--gap': '8px', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 } as React.CSSProperties}>
      <label className="check" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" name="aszf" required style={{ marginTop: 2 }} />
        <span>
          Elfogadom az <Link href="/aszf" target="_blank" style={{ textDecoration: 'underline' }}>ÁSZF</Link>-et, és megismertem az{' '}
          <Link href="/adatvedelem" target="_blank" style={{ textDecoration: 'underline' }}>Adatkezelési tájékoztatót</Link>.
        </span>
      </label>
      {digital && (
        <label className="check" style={{ alignItems: 'flex-start' }}>
          <input type="checkbox" name="digital" required style={{ marginTop: 2 }} />
          <span>
            Kifejezetten kérem, hogy a hozzáférést a fizetés után azonnal megkapjam, és tudomásul veszem, hogy a digitális tartalom teljesítésének
            megkezdésével elveszítem a 14 napos elállási jogomat.
          </span>
        </label>
      )}
    </div>
  );
}
