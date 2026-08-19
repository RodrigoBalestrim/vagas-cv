'use client';

import { useState, useRef } from 'react';

interface Compatibilidade {
  score: number;
  matched: string[];
  missing: string[];
}

export default function CurriculoPage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [compat, setCompat] = useState<Compatibilidade | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const payload = () => ({
    jobTitle: titulo.trim() || undefined,
    jobDescription: descricao.trim() || undefined,
  });

  const nomeArquivo = (ext: string) => {
    const base = (titulo.trim() || 'curriculo')
      .replace(/[\[\]()]/g, '')
      .replace(/[^a-zA-Z0-9áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return `${base}.${ext}`;
  };

  const gerar = async () => {
    setLoading(true);
    setErro(false);
    try {
      const [htmlRes, matchRes] = await Promise.all([
        fetch('/api/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload(), format: 'html' }),
        }),
        fetch('/api/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload(), format: 'match' }),
        }),
      ]);
      if (!htmlRes.ok) throw new Error(String(htmlRes.status));
      const text = await htmlRes.text();
      setHtml(text);
      if (matchRes.ok) {
        setCompat(await matchRes.json());
      }
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const baixarPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: titulo.trim() || undefined,
          jobDescription: descricao.trim() || undefined,
          format: 'pdf',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo('pdf');
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>Currículo ATS-Friendly</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Baseado no perfil do <NOME COMPLETO></p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {html && (
            <button onClick={baixarPDF} disabled={loading} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              {loading ? 'Gerando PDF...' : 'Salvar como PDF'}
            </button>
          )}
          <button onClick={gerar} disabled={loading}
            style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
            {loading ? 'Gerando...' : 'Gerar Currículo'}
          </button>
        </div>
      </header>

      <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gap: '12px', maxWidth: '700px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
              Título da vaga
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Desenvolvedor Front-end Júnior React (opcional)"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
              Descrição da vaga (preenchimento automático)
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Cole aqui a descrição da vaga. O currículo é preenchido automaticamente com as palavras-chave e o foco da vaga."
              rows={6}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {erro && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
          Erro ao gerar currículo. Tente novamente.
        </div>
      )}

      {compat && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="36" cy="36" r="32" fill="none"
                  stroke={compat.score >= 70 ? '#16a34a' : compat.score >= 40 ? '#d97706' : '#dc2626'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(compat.score / 100) * 201} 201`}
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                {compat.score}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px', color: '#111827' }}>
                Compatibilidade com a vaga
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                {compat.score >= 70
                  ? 'Boa compatibilidade — o currículo cobre a maior parte dos requisitos.'
                  : compat.score >= 40
                  ? 'Compatibilidade média — alguns requisitos da vaga não estão no perfil.'
                  : 'Compatibilidade baixa — poucos requisitos da vaga estão no perfil.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#15803d' }}>✓ Cobertos pelo perfil</p>
              {compat.matched.length ? (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#374151' }}>{compat.matched.join(' · ')}</p>
              ) : (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#9ca3af' }}>Nenhum</p>
              )}
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#b91c1c' }}>✗ Não cobertos</p>
              {compat.missing.length ? (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#374151' }}>{compat.missing.join(' · ')}</p>
              ) : (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#9ca3af' }}>Nenhum</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!html && !loading && (
        <div style={{ border: '1px dashed #d1d5db', borderRadius: '8px', background: '#fff', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#6b7280', textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px' }}>📄</div>
          <p style={{ margin: 0, fontSize: '16px' }}>Cole a descrição da vaga acima e clique em "Gerar Currículo".</p>
          <p style={{ margin: 0, fontSize: '14px' }}>Sem vaga? Clique em "Gerar Currículo" para usar o perfil base.</p>
        </div>
      )}

      {html && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{ width: '100%', height: '90vh', border: 'none', minHeight: '800px' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-print"
          />
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
        <strong>Dicas para ATS:</strong>
        <ul style={{ margin: '8px 0 0 20px' }}>
          <li>Cole a descrição da vaga para preencher o currículo automaticamente com o foco da vaga</li>
          <li>Use "Salvar como PDF" (ou Ctrl+P / Cmd+P) para exportar em PDF</li>
          <li>Mantenha formatação simples — sem colunas, gráficos ou imagens</li>
          <li>Palavras-chave do perfil já estão embutidas no template</li>
          <li>Para vaga específica, use a página de Vagas → "Gerar Currículo"</li>
        </ul>
      </div>
    </div>
  );
}