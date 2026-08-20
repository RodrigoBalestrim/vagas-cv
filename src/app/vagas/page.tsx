'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '@/types';
import JobCard from '@/components/JobCard';
import ResumeModalContent from '@/components/ResumeModalContent';
import AuthStatus from '@/components/AuthStatus';
import { useAuth } from '@/components/AuthProvider';

export default function VagasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vagas, setVagas] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ dias: 30, minScore: 0, apenasBrasil: false, soJunior: false });
  const [resumeTarget, setResumeTarget] = useState<Job | null>(null);

  useEffect(() => {
    buscarVagas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.dias, filtros.minScore, filtros.apenasBrasil, filtros.soJunior]);

  const buscarVagas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dias: String(filtros.dias),
        minScore: String(filtros.minScore),
        brasil: String(filtros.apenasBrasil),
        junior: String(filtros.soJunior),
      });
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
      setVagas(data.vagas || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading && vagas.length === 0) {
    return (
      <div className="page center">
        <div className="card" style={{ padding: '48px' }}>
          <p style={{ fontSize: '1.1rem' }}>Carregando vagas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page center">
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>Erro: {error}</div>
        <button onClick={buscarVagas} className="btn btn-primary">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header no-print">
        <div className="inner">
          <div className="brand">
            <span className="logo">⚡</span>
            Vagas CV
          </div>
          <nav className="site-nav">
            <a href="/" className="nav-link">Início</a>
            <a href="/vagas" className="nav-link active">Buscar Vagas</a>
            <a href="/curriculo" className="nav-link">Gerar Currículo</a>
            <AuthStatus />
          </nav>
        </div>
      </header>

      <div className="page">
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{ marginBottom: '4px' }}>Vagas Encontradas</h1>
          <p className="muted" style={{ margin: 0 }}>{vagas.length} vagas únicas</p>
        </header>

        <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', alignItems: 'end' }}>
            <div className="field">
              <label>Dias atrás</label>
              <select className="select" value={filtros.dias} onChange={e => setFiltros({ ...filtros, dias: parseInt(e.target.value) })}>
                <option value="7">7 dias</option>
                <option value="14">14 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
              </select>
            </div>
            <div className="field">
              <label>Score mínimo</label>
              <select className="select" value={filtros.minScore} onChange={e => setFiltros({ ...filtros, minScore: parseInt(e.target.value) })}>
                <option value="0">Todos</option>
                <option value="35">35+</option>
                <option value="50">50+</option>
                <option value="60">60+</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.9rem', cursor: 'pointer', fontWeight: 500 }}>
              <input type="checkbox" checked={filtros.apenasBrasil} onChange={e => setFiltros({ ...filtros, apenasBrasil: e.target.checked })} />
              Apenas Brasil
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.9rem', cursor: 'pointer', fontWeight: 500,
              padding: '10px 12px', border: filtros.soJunior ? '2px solid var(--success)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', background: filtros.soJunior ? 'var(--success-soft)' : '#fff',
            }}>
              <input type="checkbox" checked={filtros.soJunior} onChange={e => setFiltros({ ...filtros, soJunior: e.target.checked })} />
              🎓 Só Júnior
            </label>
            <button onClick={buscarVagas} disabled={loading} className="btn btn-primary">
              {loading ? 'Buscando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {vagas.length === 0 ? (
          <p className="muted center" style={{ padding: '40px' }}>Nenhuma vaga encontrada com esses filtros.</p>
        ) : (
          <div>
            {vagas.map(vaga => (
              <JobCard key={vaga.id} vaga={vaga} onGenerateResume={(v) => {
                if (authLoading) return;
                if (!user) {
                  router.push('/login');
                  return;
                }
                setResumeTarget(v);
              }} />
            ))}
          </div>
        )}
      </div>

      {resumeTarget && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <ResumeModalContent vaga={resumeTarget} onClose={() => setResumeTarget(null)} />
          </div>
        </div>
      )}
    </div>
  );
}