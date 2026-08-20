'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import SiteHeader from '@/components/SiteHeader';

// Página de Login/Cadastro (rota /login): autentica o usuário no Firebase
// por e-mail/senha ou conta Google. Redireciona para /curriculo após entrar.
export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [modo, setModo] = useState<'login' | 'cadastro'>('login'); // alterna entre entrar/cadastrar
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Se o usuário já está logado, vai direto para /curriculo
  useEffect(() => {
    if (!loading && user) router.push('/curriculo');
  }, [user, loading, router]);

  // Envio do formulário: login OU cadastro, conforme o modo atual
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setAuthLoading(true);
    try {
      if (modo === 'login') {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        await createUserWithEmailAndPassword(auth, email, senha);
      }
      router.push('/curriculo');
    } catch (err: any) {
      // Traduz os códigos de erro do Firebase em mensagens amigáveis
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setErro('Este e-mail já está cadastrado. Faça login.');
      else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password')
        setErro('E-mail ou senha incorretos.');
      else if (code === 'auth/weak-password') setErro('Senha muito fraca. Use pelo menos 6 caracteres.');
      else if (code === 'auth/invalid-email') setErro('E-mail inválido.');
      else setErro('Erro ao autenticar. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Login com Google via popup do Firebase
  const loginGoogle = async () => {
    setErro('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/curriculo');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') setErro('Erro ao entrar com Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div>
      <SiteHeader />

      <div className="page center" style={{ maxWidth: '460px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px' }}>🔐</div>
            <h1 style={{ margin: '8px 0 4px', fontSize: '22px' }}>
              {modo === 'login' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              {modo === 'login'
                ? 'Acesse para gerar seu currículo ATS personalizado'
                : 'Cadastre-se para criar seu próprio currículo ATS'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: '14px' }}>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                className="input"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {erro && <div className="alert alert-error">{erro}</div>}

            <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ width: '100%' }}>
              {authLoading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span className="muted" style={{ fontSize: '12px' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button onClick={loginGoogle} disabled={authLoading} className="btn btn-outline" style={{ width: '100%' }}>
            Entrar com Google
          </button>

          <p style={{ textAlign: 'center', margin: '20px 0 0', fontSize: '13.5px' }}>
            {modo === 'login' ? (
              <>Não tem conta?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setModo('cadastro'); }} style={{ fontWeight: 700 }}>
                  Cadastre-se
                </a>
              </>
            ) : (
              <>Já tem conta?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setModo('login'); }} style={{ fontWeight: 700 }}>
                  Entrar
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <footer className="site-footer no-print">
        Vagas CV · Gerador de currículo ATS multi-usuário
      </footer>
    </div>
  );
}