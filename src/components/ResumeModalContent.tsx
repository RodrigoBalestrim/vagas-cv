'use client';

import { useState, useEffect, useRef } from 'react';
import { Job } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { carregarPerfil } from '@/lib/perfil-store';
import { UserProfile } from '@/lib/user-profile';

interface ResumeModalContentProps {
  vaga?: Job;         // vaga selecionada (modo "Auto"); vazio se abrir manual
  onClose: () => void; // fecha o modal
}

// Modal de geração de currículo aberto a partir de um card de vaga.
// Tem dois modos:
// - "Auto (da vaga)": gera o currículo usando a descrição da vaga salva.
// - "Manual (colar descrição)": o usuário cola título/empresa/local/descrição.
// Mostra pré-visualização em HTML ou PDF e permite baixar o PDF final.
export default function ResumeModalContent({ vaga, onClose }: ResumeModalContentProps) {
  const { user, getToken } = useAuth();
  const [html, setHtml] = useState<string>('');          // HTML do currículo gerado
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // blob URL do PDF
  const [preview, setPreview] = useState<'html' | 'pdf'>('html'); // aba ativa
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);           // barra de progresso fake
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: vaga?.titulo || '',
    companyName: vaga?.empresa || '',
    location: vaga?.local || 'Remoto',
    jobDescription: '',
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carrega o perfil do usuário logado para saber se ele tem dados salvos
  useEffect(() => {
    if (!user) {
      setPerfil(null);
      return;
    }
    (async () => {
      const p = await carregarPerfil(user.uid);
      setPerfil(p.nome ? p : null);
    })();
  }, [user]);

  // Envia a requisição para a API /api/resume com o token do usuário no header
  const withAuth = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` };
    return fetch('/api/resume', { method: 'POST', headers, body: JSON.stringify(payload) });
  };

  // Barra de progresso simulada (a geração pode demorar com IA)
  const startProgress = () => {
    setProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return 90;                 // trava em 90% até terminar
        const inc = p < 40 ? 8 : p < 70 ? 4 : 2; // desacelera com o tempo
        return Math.min(90, p + inc);
      });
    }, 300);
  };

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgress(100);
  };

  // Chama a API para gerar o HTML do currículo (modo auto ou manual)
  const generateResume = async (data?: typeof formData) => {
    setLoading(true);
    startProgress();
    try {
      const payload = {
        jobTitle: vaga?.titulo,
        companyName: vaga?.empresa,
        location: vaga?.local,
        jobDescription: vaga?.descricao || vaga?.titulo,
        format: 'html',
        ...data, // se "manual", sobrescreve com o que o usuário digitou
      };
      const res = await withAuth(payload);
      const text = await res.text();
      setHtml(text);
      setPdfUrl(null);
      setPreview('html');
    } catch {
      setHtml('<p>Erro ao gerar currículo</p>');
    } finally {
      setLoading(false);
      stopProgress();
    }
  };

  // No modo "Auto", gera automaticamente ao abrir o modal (ou trocar de vaga)
  useEffect(() => {
    if (vaga && mode === 'auto') {
      generateResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaga?.id, vaga?.url, mode]);

  // Submissão do formulário manual
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('manual');
    generateResume(formData);
  };

  // Cria um nome de arquivo seguro a partir do título da vaga
  const nomeArquivo = (ext: string) => {
    const tituloVaga = (mode === 'manual' ? formData.jobTitle : vaga?.titulo) || 'curriculo';
    const base = tituloVaga
      .replace(/[\[\]()]/g, '')
      .replace(/[^a-zA-Z0-9áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+/g, '-') // caracteres especiais → hífen
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return `${base}.${ext}`;
  };

  // Busca e guarda a blob URL do PDF gerado no servidor
  const buscarPDF = async () => {
    const payload = mode === 'manual'
      ? { ...formData, format: 'pdf' }
      : {
          jobTitle: vaga?.titulo,
          companyName: vaga?.empresa,
          location: vaga?.local,
          jobDescription: vaga?.descricao || vaga?.titulo,
          format: 'pdf',
        };
    const res = await withAuth(payload);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl); // libera a URL antiga da memória
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    return url;
  };

  // Dispara o download do PDF (usa o cache se já gerado antes)
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
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header com tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button
          onClick={() => { setMode('auto'); if (vaga) generateResume(); }}
          className={`btn btn-sm ${mode === 'auto' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🤖 Auto (da vaga)
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
        >
          ✍️ Manual (colar descrição)
        </button>
      </div>

      {/* Form manual */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmit} style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
            <div className="field">
              <label>Título da vaga *</label>
              <input
                type="text"
                className="input"
                value={formData.jobTitle}
                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Ex: Desenvolvedor Front-end Júnior React"
                required
              />
            </div>
            <div className="field">
              <label>Empresa</label>
              <input
                type="text"
                className="input"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nome da empresa (opcional)"
              />
            </div>
            <div className="field">
              <label>Local</label>
              <input
                type="text"
                className="input"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Remoto, São Paulo, etc."
              />
            </div>
            <div className="field">
              <label>Descrição completa da vaga *</label>
              <textarea
                className="textarea"
                value={formData.jobDescription}
                onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Cole aqui a descrição completa da vaga (requisitos, responsabilidades, benefícios, stack, etc.). Quanto mais detalhes, melhor o match do currículo."
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !formData.jobDescription.trim()}
              className="btn btn-success"
            >
              {loading ? 'Gerando...' : 'Gerar Currículo Personalizado'}
            </button>
          </div>
        </form>
      )}

      {/* Preview do currículo */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '16px', padding: '24px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              {progress < 100 ? 'Gerando currículo com IA...' : 'Pronto!'}
            </p>
            <div style={{ width: '280px', background: 'var(--surface-2)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--success), var(--primary))',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{progress}%</p>
          </div>
        )}
        {html && (
          <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
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
        )}
        {preview === 'html' ? (
          <iframe
            ref={iframeRef}
            srcDoc={html || '<div style="padding:40px;text-align:center;color:#6b7280;font-family:sans-serif">Selecione uma vaga ou preencha o formulário para gerar o currículo</div>'}
            style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-print"
          />
        ) : (
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }}
            />
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Gerando pré-visualização do PDF...
            </div>
          )
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Fechar</button>
        <button onClick={baixarPDF} className="btn btn-primary btn-sm">⬇️ Baixar PDF</button>
      </div>
    </div>
  );
}