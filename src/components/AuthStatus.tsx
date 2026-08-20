'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <span className="chip">...</span>;

  if (user) {
    return (
      <div className="auth-status">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || 'Foto de perfil'}
            className="auth-avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="auth-avatar auth-avatar-fallback" aria-hidden>
            {((user.displayName || user.email || 'C')[0] || 'C').toUpperCase()}
          </span>
        )}
        <span className="auth-name" title={user.email || undefined}>
          {user.displayName || user.email?.split('@')[0] || 'Conta'}
        </span>
        <a href="/perfil" className="nav-link">Meu Perfil</a>
        <button
          onClick={async () => { await logout(); router.push('/'); }}
          className="btn btn-sm btn-ghost"
          style={{ marginLeft: '4px' }}
        >
          Sair
        </button>
      </div>
    );
  }

  return <a href="/login" className="nav-link">Entrar</a>;
}