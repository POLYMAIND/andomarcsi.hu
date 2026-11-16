'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type NavItem = { href: string; icon: string; label: string; badge?: number; locked?: boolean; external?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

// A közösség oldalsávja: csoportosított terek ikonnal és olvasatlan-számlálóval. Mobilon hamburger menübe csukódik.
export function SidebarNav({ groups, profileHref, profileName }: { groups: NavGroup[]; profileHref: string; profileName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const total = groups.reduce((s, g) => s + g.items.reduce((t, i) => t + (i.badge ?? 0), 0), 0);
  const current = groups.flatMap((g) => g.items).find((i) => !i.external && (pathname === i.href || pathname.startsWith(`${i.href}/`)));

  return (
    <aside className={`kz-side${open ? ' open' : ''}`}>
      <button type="button" className="kz-burger" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">☰</span>
        <span>{current ? `${current.icon} ${current.label}` : 'Közösség'}</span>
        {total > 0 && <span className="kz-count">{total}</span>}
      </button>
      <nav className="kz-nav" aria-label="Közösségi terek">
        {groups.map((g) =>
          g.items.length ? (
            <div key={g.label} className="kz-nav-group">
              <span className="kz-nav-label">{g.label}</span>
              {g.items.map((i) => {
                const active = !i.external && (pathname === i.href || pathname.startsWith(`${i.href}/`));
                const inner = (
                  <>
                    <span className="kz-nav-icon" aria-hidden="true">{i.icon}</span>
                    <span className="kz-nav-text">{i.label}</span>
                    {i.locked ? <span aria-label="csak tagoknak">🔒</span> : i.badge ? <span className="kz-count">{i.badge > 99 ? '99+' : i.badge}</span> : null}
                  </>
                );
                return i.external ? (
                  <a key={i.href} href={i.href} target="_blank" rel="noopener noreferrer" className="kz-nav-item">{inner}<span aria-hidden="true" className="muted">↗</span></a>
                ) : (
                  <Link key={i.href} href={i.href} className={`kz-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>{inner}</Link>
                );
              })}
            </div>
          ) : null,
        )}
        <div className="kz-nav-group">
          <Link href={profileHref} className={`kz-nav-item${pathname.startsWith('/kozosseg/profil') ? ' active' : ''}`}>
            <span className="kz-nav-icon" aria-hidden="true">🙂</span>
            <span className="kz-nav-text">Profilom ({profileName})</span>
          </Link>
          <Link href="/kozosseg/ertesitesek" className={`kz-nav-item${pathname.startsWith('/kozosseg/ertesitesek') ? ' active' : ''}`}>
            <span className="kz-nav-icon" aria-hidden="true">🔔</span>
            <span className="kz-nav-text">Értesítések</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
