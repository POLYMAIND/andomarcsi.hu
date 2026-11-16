/** Lecke alatti ajánló sáv (a videó és a lecke kártya között). Kurzus slug + lecke sorszám szerint. */
const PROMOS: Record<string, Record<number, 'sikermaker'>> = {
  'claude-alapozo': { 9: 'sikermaker' },
};

export function lessonPromo(courseSlug: string, sortOrder: number) {
  return PROMOS[courseSlug]?.[sortOrder] ?? null;
}

export function LessonPromo({ kind }: { kind: 'sikermaker' }) {
  if (kind !== 'sikermaker') return null;
  return (
    <a href="https://sikermaker.hu" target="_blank" rel="noopener" className="lesson-promo sikermaker">
      <span className="lesson-promo-body">
        <span className="lesson-promo-eyebrow">Ha nem csetben vezetnéd a céljaidat</span>
        <strong>Sikermaker: célok, fókusz, naptár és posztok egy helyen</strong>
        <span>Saját fejlesztésű appunk. Ingyen is használható, a naptár + posztok együtt 1 990 Ft/hó. Próbáld ki, nem kerül semmibe.</span>
      </span>
      <span className="lesson-promo-btn">Kipróbálom ingyen →</span>
    </a>
  );
}
