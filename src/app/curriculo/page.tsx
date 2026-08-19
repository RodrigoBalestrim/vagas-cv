'use client';

import { useState } from 'react';

export default function CurriculoPage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  const gerar = async () => {
    setLoading(true);
    setErro(false);
    try {
      const res = await fetch('/api/resume?format=html');
      const text = await res.text();
      setHtml(text);
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
          {!html && (
            <button onClick={gerar} disabled={loading}
              style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              {loading ? 'Gerando...' : 'Gerar Currículo'}
            </button>
          )}
          {html && (
            <>
              <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                Salvar como PDF
              </button>
              <a href="/api/resume?format=html" download="curriculo.html"
                style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
                Baixar HTML
              </a>
            </>
          )}
        </div>
      </header>

      {erro && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
          Erro ao carregar currículo. Tente novamente.
        </div>
      )}

      {!html && !loading && (
        <div style={{ border: '1px dashed #d1d5db', borderRadius: '8px', background: '#fff', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#6b7280', textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px' }}>📄</div>
          <p style={{ margin: 0, fontSize: '16px' }}>O currículo só é gerado quando você clicar no botão acima.</p>
          <p style={{ margin: 0, fontSize: '14px' }}>Geração manual, sob demanda.</p>
        </div>
      )}

      {html && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          <iframe
            srcDoc={html}
            style={{ width: '100%', height: '90vh', border: 'none', minHeight: '800px' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
        <strong>Dicas para ATS:</strong>
        <ul style={{ margin: '8px 0 0 20px' }}>
          <li>Clique em "Gerar Currículo" para gerar sob demanda</li>
          <li>Use o botão "Salvar como PDF" no navegador (Ctrl+P / Cmd+P)</li>
          <li>Mantenha formatação simples — sem colunas, gráficos ou imagens</li>
          <li>Palavras-chave do perfil já estão embutidas no template</li>
          <li>Para vaga específica, use a página de Vagas → "Gerar Currículo"</li>
        </ul>
      </div>
    </div>
  );
}