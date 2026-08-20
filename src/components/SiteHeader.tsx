'use client';

import { usePathname } from 'next/navigation';
import AuthStatus from '@/components/AuthStatus';

// Navegação principal do site. Cada link tem uma função "ativo" que decide
// se o link deve aparecer destacado (classe .active) conforme a rota atual.
const LINKS = [
  { href: '/', label: 'Início', ativo: (p: string) => p === '/' },
  { href: '/vagas', label: 'Buscar Vagas', ativo: (p: string) => p.startsWith('/vagas') },
  { href: '/curriculo', label: 'Gerar Currículo', ativo: (p: string) => p.startsWith('/curriculo') },
];

// Barra de cabeçalho compartilhada entre todas as páginas.
// Mostra o logo, os links de navegação e o componente de status do login (AuthStatus).
export default function SiteHeader() {
  const pathname = usePathname() || '/'; // rota atual, ex.: "/vagas"

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
          {/* Avatar (com dropdown Meu Perfil/Sair) quando logado, ou link "Entrar" */}
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}