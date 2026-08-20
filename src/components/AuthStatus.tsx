'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (loading) return <span className="chip">...</span>;

  if (user) {
    return (
      <div className="auth-menu" ref={ref}>
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
            <span className="auth-avatar auth-avatar-fallback" aria-hidden>
              {((user.displayName || user.email || 'C')[0] || 'C').toUpperCase()}
            </span>
          )}
        </button>
        {open && (
          <div className="auth-dropdown" role="menu">
            <div className="auth-dropdown-head">
              <span className="auth-dropdown-name">{user.displayName || user.email || 'Conta'}</span>
              <span className="auth-dropdown-email">{user.email}</span>
            </div>
            <a href="/perfil" role="menuitem" onClick={() => setOpen(false)}>
              Meu Perfil
            </a>
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

  return <a href="/login" className="nav-link">Entrar</a>;
}