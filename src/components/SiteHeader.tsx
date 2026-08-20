'use client';

import { usePathname } from 'next/navigation';
import AuthStatus from '@/components/AuthStatus';

const LINKS = [
  { href: '/', label: 'Início', ativo: (p: string) => p === '/' },
  { href: '/vagas', label: 'Buscar Vagas', ativo: (p: string) => p.startsWith('/vagas') },
  { href: '/curriculo', label: 'Gerar Currículo', ativo: (p: string) => p.startsWith('/curriculo') },
];

export default function SiteHeader() {
  const pathname = usePathname() || '/';

  return (
    <header className="site-header no-print">
      <div className="inner">
        <div className="brand">
          <span className="logo">⚡</span>
          Vagas CV
        </div>
        <nav className="site-nav">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className={`nav-link${l.ativo(pathname) ? ' active' : ''}`}>
              {l.label}
            </a>
          ))}
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}