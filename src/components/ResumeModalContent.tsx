'use client';

import { useState, useEffect, useRef } from 'react';
import { Job } from '@/types';

interface ResumeModalContentProps {
  vaga?: Job;
  onClose: () => void;
}

export default function ResumeModalContent({ vaga, onClose }: ResumeModalContentProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [formData, setFormData] = useState({
    jobTitle: vaga?.titulo || '',
    companyName: vaga?.empresa || '',
    location: vaga?.local || 'Remoto',
    jobDescription: '',
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = () => {
    setProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress(p => {
        // sobe rápido até 90%, depois segura (IA pode demorar 30-60s)
        if (p >= 90) return 90;
        const inc = p < 40 ? 8 : p < 70 ? 4 : 2;
        return Math.min(90, p + inc);
      });
    }, 300);
  };

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgress(100);
  };

  const generateResume = async (data?: typeof formData) => {
    setLoading(true);
    startProgress();
    try {
      const payload = data || {
        jobTitle: vaga?.titulo,
        companyName: vaga?.empresa,
        location: vaga?.local,
        jobDescription: vaga?.descricao || vaga?.titulo,
        format: 'html',
      };
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      setHtml(text);
    } catch {
      setHtml('<p>Erro ao gerar currículo</p>');
    } finally {
      setLoading(false);
      stopProgress();
    }
  };

  // Auto-generate on mount if vaga provided
  useEffect(() => {
    if (vaga && mode === 'auto') {
      generateResume();
    }
  }, [vaga?.id, vaga?.url, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('manual');
    generateResume({ ...formData, format: 'html' } as any);
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header com tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <button
          onClick={() => { setMode('auto'); if (vaga) generateResume(); }}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            background: mode === 'auto' ? '#2563eb' : '#fff',
            color: mode === 'auto' ? '#fff' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🤖 Auto (da vaga)
        </button>
        <button
          onClick={() => setMode('manual')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            background: mode === 'manual' ? '#2563eb' : '#fff',
            color: mode === 'manual' ? '#fff' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ✍️ Manual (colar descrição)
        </button>
      </div>

      {/* Form manual */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmit} style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                Título da vaga *
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Ex: Desenvolvedor Front-end Júnior React"
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                Empresa
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nome da empresa (opcional)"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                Local
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Remoto, São Paulo, etc."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
                Descrição completa da vaga *
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Cole aqui a descrição completa da vaga (requisitos, responsabilidades, benefícios, stack, etc.). Quanto mais detalhes, melhor o match do currículo."
                rows={8}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !formData.jobDescription.trim()}
              style={{
                padding: '10px 20px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || !formData.jobDescription.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                opacity: loading || !formData.jobDescription.trim() ? 0.6 : 1,
              }}
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
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
              {progress < 100 ? 'Gerando currículo com IA...' : 'Pronto!'}
            </p>
            <div style={{ width: '280px', background: '#e5e7eb', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #059669, #2563eb)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{progress}%</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={html || '<div style="padding:40px;text-align:center;color:#6b7280">Selecione uma vaga ou preencha o formulário para gerar o currículo</div>'}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-print"
        />
      </div>

      {/* Footer actions */}
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Fechar</button>
        <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Salvar PDF</button>
      </div>
    </div>
  );
}