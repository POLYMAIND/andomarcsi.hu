import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <section className="card stack" style={{ '--gap': '18px', maxWidth: 640, margin: '10vh auto 0', width: '100%' } as React.CSSProperties}>
        <div className="eyebrow">404</div>
        <h1 className="h2">Ez az oldal nem található.</h1>
        <Link href="/" className="btn" style={{ alignSelf: 'flex-start' }}>Vissza a főoldalra</Link>
      </section>
    </div>
  );
}
