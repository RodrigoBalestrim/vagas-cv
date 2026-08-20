'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Indicador de autenticação no cabeçalho.
// - Deslogado: mostra o link "Entrar".
// - Logado: mostra APENAS a foto (avatar) que abre um dropdown com
//   "Meu Perfil" e "Sair". O nome só aparece dentro do dropdown.
export default function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);        // dropdown aberto ou fechado
  const ref = useRef<HTMLDivElement>(null);       // âncora p/ detectar clique fora

  // Fecha o dropdown ao clicar fora dele (listener global de mousedown)
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Enquanto o Firebase restaura a sessão, mostra um placeholder discreto
  if (loading) return <span className="chip">...</span>;

  if (user) {
    return (
      <div className="auth-menu" ref={ref}>
        {/* Botão-avatar: clicar alterna o dropdown */}
        <button
          className="auth-avatar-btn"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Conta"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="auth-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            // Sem foto: mostra a inicial do nome/e-mail num círculo colorido
            <span className="auth-avatar auth-avatar-fallback" aria-hidden>
              {((user.displayName || user.email || 'C')[0] || 'C').toUpperCase()}
            </span>
          )}
        </button>
        {open && (
          <div className="auth-dropdown" role="menu">
            {/* Cabeçalho do dropdown: nome + e-mail do usuário */}
            <div className="auth-dropdown-head">
              <span className="auth-dropdown-name">{user.displayName || user.email || 'Conta'}</span>
              <span className="auth-dropdown-email">{user.email}</span>
            </div>
            <a href="/perfil" role="menuitem" onClick={() => setOpen(false)}>
              Meu Perfil
            </a>
            {/* Sair: desloga e volta para a home */}
            <button
              role="menuitem"
              className="auth-dropdown-sair"
              onClick={async () => { await logout(); router.push('/'); }}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    );
  }

  // Deslogado: link simples para a página de login
  return <a href="/login" className="nav-link">Entrar</a>;
}