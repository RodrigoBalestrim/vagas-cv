'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import SiteHeader from '@/components/SiteHeader';
import { carregarPerfil } from '@/lib/perfil-store';
import { UserProfile } from '@/lib/user-profile';

interface Compatibilidade {
  score: number;
  matched: string[];
  missing: string[];
  blocked: string[];
  explicacao?: string;
}

export default function CurriculoPage() {
  const { user, loading: authLoading, logout, getToken } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [html, setHtml] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<'html' | 'pdf'>('html');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [compat, setCompat] = useState<Compatibilidade | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    (async () => {
      const p = await carregarPerfil(user.uid);
      setPerfil(p.nome ? p : null);
    })();
  }, [user, authLoading, router]);

  const nomeExibido = perfil?.nome || (user?.email?.split('@')[0] || 'você');
  const semPerfil = !!user && !perfil;

  const payload = () => ({
    jobTitle: titulo.trim() || undefined,
    jobDescription: descricao.trim() || undefined,
  });

  const postResume = async (body: Record<string, unknown>) =>
    fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify(body),
    });

  const nomeArquivo = (ext: string) => {
    const base = (titulo.trim() || 'curriculo')
      .replace(/[\[\]()]/g, '')
      .replace(/[^a-zA-Z0-9áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return `${base}.${ext}`;
  };

  const buscarPDF = async () => {
    const res = await postResume({ ...payload(), format: 'pdf' });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    return url;
  };

  const gerar = async () => {
    setLoading(true);
    setErro(false);
    try {
      const [htmlRes, matchRes] = await Promise.all([
        postResume({ ...payload(), format: 'html' }),
        postResume({ ...payload(), format: 'match' }),
      ]);
      if (!htmlRes.ok) throw new Error(String(htmlRes.status));
      const text = await htmlRes.text();
      setHtml(text);
      if (matchRes.ok) {
        setCompat(await matchRes.json());
      }
      setPdfUrl(null);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const baixarPDF = async () => {
    setLoading(true);
    try {
      const url = pdfUrl || (await buscarPDF());
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo('pdf');
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SiteHeader />

      <div className="page">
        <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Currículo ATS-Friendly</h1>
            <p className="muted" style={{ margin: 0 }}>Baseado no perfil de {nomeExibido}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!semPerfil && html && (
              <button onClick={baixarPDF} disabled={loading} className="btn btn-primary">
                {loading ? 'Gerando PDF...' : '⬇️ Baixar PDF'}
              </button>
            )}
            {!semPerfil && (
              <button onClick={gerar} disabled={loading} className="btn btn-success">
                {loading ? 'Gerando...' : 'Gerar Currículo'}
              </button>
            )}
          </div>
        </header>

        {semPerfil && (
          <div className="card center" style={{ padding: '48px 32px', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Configure seu perfil primeiro</h2>
            <p className="muted" style={{ maxWidth: '520px', margin: '0 auto 20px', fontSize: '14px' }}>
              Para gerar um currículo com seus dados, preencha seu perfil ou envie seu currículo em PDF
              — os campos são preenchidos automaticamente.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/perfil" className="btn btn-primary">⚙️ Preencher / Importar meu perfil</a>
            </div>
          </div>
        )}

        {!semPerfil && (
        <div className="card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gap: '16px', maxWidth: '700px' }}>
            <div className="field">
              <label>Título da vaga</label>
              <input
                type="text"
                className="input"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Desenvolvedor Front-end Júnior React (opcional)"
              />
            </div>
            <div className="field">
              <label>Descrição da vaga (preenchimento automático)</label>
              <textarea
                className="textarea"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Cole aqui a descrição da vaga. O currículo é preenchido automaticamente com as palavras-chave e o foco da vaga."
              />
            </div>
          </div>
        </div>
        )}

        {erro && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            Erro ao gerar currículo. Tente novamente.
          </div>
        )}

        {compat && (
          <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="32" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="36" cy="36" r="32" fill="none"
                    stroke={compat.score >= 70 ? 'var(--success)' : compat.score >= 40 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(compat.score / 100) * 201} 201`}
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                  {compat.score}%
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                  Compatibilidade com a vaga
                </p>
                <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                  {compat.explicacao || (
                    compat.blocked.length
                      ? `⚠️ A vaga exige tecnologia fora do seu perfil (${compat.blocked.join(', ')}).`
                      : compat.score >= 70
                      ? 'Boa compatibilidade — o currículo cobre a maior parte dos requisitos.'
                      : compat.score >= 40
                      ? 'Compatibilidade média — alguns requisitos da vaga não estão no perfil.'
                      : 'Compatibilidade baixa — poucos requisitos da vaga estão no perfil.'
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>✓ Cobertos pelo perfil</p>
                {compat.matched.length ? (
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>{compat.matched.join(' · ')}</p>
                ) : (
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>Nenhum</p>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>✗ Não cobertos</p>
                {compat.missing.length ? (
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>{compat.missing.join(' · ')}</p>
                ) : (
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>Nenhum</p>
                )}
                {compat.blocked.length ? (
                  <>
                    <p style={{ margin: '10px 0 6px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>🚫 Fora do perfil</p>
                    <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>{compat.blocked.join(' · ')}</p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {!semPerfil && !html && !loading && (
          <div className="card center" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', color: 'var(--text-muted)', padding: '32px' }}>
            <div style={{ fontSize: '52px' }}>📄</div>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>Cole a descrição da vaga acima e clique em "Gerar Currículo".</p>
            <p className="muted" style={{ margin: 0, fontSize: '14px' }}>Sem vaga? Clique em "Gerar Currículo" para usar o perfil base.</p>
          </div>
        )}

        {html && (
          <div className="card no-print" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <button
                onClick={() => setPreview('html')}
                className={`btn btn-sm ${preview === 'html' ? 'btn-primary' : 'btn-ghost'}`}
              >
                👁️ HTML
              </button>
              <button
                onClick={() => { if (!pdfUrl) buscarPDF(); setPreview('pdf'); }}
                className={`btn btn-sm ${preview === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
              >
                📄 Pré-visualizar PDF
              </button>
            </div>
            {preview === 'html' ? (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                style={{ width: '100%', height: '90vh', border: 'none', minHeight: '800px' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-print"
              />
            ) : (
              pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  style={{ width: '100%', height: '90vh', border: 'none', minHeight: '800px' }}
                />
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Gerando pré-visualização do PDF...
                </div>
              )
            )}
          </div>
        )}

        <div className="card" style={{ marginTop: '20px', padding: '20px 24px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Dicas para ATS:</strong>
          <ul style={{ margin: '8px 0 0 20px', lineHeight: 1.8 }}>
            <li>Cole a descrição da vaga para preencher o currículo automaticamente com o foco da vaga</li>
            <li>Use "Baixar PDF" (ou Ctrl+P / Cmd+P) para exportar em PDF</li>
            <li>Mantenha formatação simples — sem colunas, gráficos ou imagens</li>
            <li>Palavras-chave do perfil já estão embutidas no template</li>
            <li>Para vaga específica, use a página de Vagas → "Gerar Currículo"</li>
          </ul>
        </div>
      </div>

      <footer className="site-footer no-print">
        Baseado no perfil de {nomeExibido} · Currículo ATS multi-usuário
      </footer>
    </div>
  );
}