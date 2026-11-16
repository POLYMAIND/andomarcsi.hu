// Letöltés gomb feltűnően: fölötte kézírásos „itt töltheted le” és egy lefelé ugráló nyíl, a gombban is ugrál a nyíl.
// (Csökkentett mozgás beállításnál nincs animáció – lásd .dl-* a globals.css-ben.)
export function DownloadLink({ href, label, block = false, hint = 'itt töltheted le' }: { href: string; label: string; block?: boolean; hint?: string | null }) {
  return (
    <span className={`dl-cta${block ? ' block' : ''}`}>
      {hint && (
        <span className="dl-hint ps-hand purple" aria-hidden="true">
          {hint} <span className="dl-bounce">↓</span>
        </span>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" className={`btn ps-lime dl-btn${block ? ' block' : ' sm'}`}>
        {label} <span className="dl-bounce" aria-hidden="true">↓</span>
      </a>
    </span>
  );
}
