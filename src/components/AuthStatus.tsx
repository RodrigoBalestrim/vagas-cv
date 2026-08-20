'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <span className="chip">...</span>;

  if (user) {
    return (
      <>
        <span className="chip" title={user.email || undefined}>👤 {user.email?.split('@')[0] || 'Conta'}</span>
        <a href="/perfil" className="nav-link">Meu Perfil</a>
        <button
          onClick={async () => { await logout(); router.push('/'); }}
          className="btn btn-sm btn-ghost"
          style={{ marginLeft: '4px' }}
        >
          Sair
        </button>
      </>
    );
  }

  return <a href="/login" className="nav-link">Entrar</a>;
}