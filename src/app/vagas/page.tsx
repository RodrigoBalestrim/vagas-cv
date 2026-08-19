'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/types';
import JobCard from '@/components/JobCard';
import ResumeModalContent from '@/components/ResumeModalContent';

export default function VagasPage() {
  const [vagas, setVagas] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ dias: 30, minScore: 0, apenasBrasil: false, soJunior: false });
  const [resumeTarget, setResumeTarget] = useState<Job | null>(null);

  useEffect(() => {
    buscarVagas();
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
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <p>Carregando vagas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui', color: '#dc2626' }}>
        <p>Erro: {error}</p>
        <button onClick={buscarVagas} style={{ marginTop: '16px', padding: '8px 16px' }}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>Vagas Encontradas</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>{vagas.length} vagas únicas</p>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Dias atrás</label>
          <select value={filtros.dias} onChange={e => setFiltros({ ...filtros, dias: parseInt(e.target.value) })}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Score mínimo</label>
          <select value={filtros.minScore} onChange={e => setFiltros({ ...filtros, minScore: parseInt(e.target.value) })}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
            <option value="0">Todos</option>
            <option value="35">35+</option>
            <option value="50">50+</option>
            <option value="60">60+</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={filtros.apenasBrasil} onChange={e => setFiltros({ ...filtros, apenasBrasil: e.target.checked })} />
            Apenas Brasil
          </label>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '8px 12px', border: filtros.soJunior ? '2px solid #16a34a' : '1px solid #d1d5db', borderRadius: '6px', background: filtros.soJunior ? '#f0fdf4' : '#fff' }}>
            <input type="checkbox" checked={filtros.soJunior} onChange={e => setFiltros({ ...filtros, soJunior: e.target.checked })} />
            🎓 Só Júnior
          </label>
        </div>
        <button onClick={buscarVagas} disabled={loading}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Buscando...' : 'Atualizar'}
        </button>
      </div>

      {vagas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>Nenhuma vaga encontrada com esses filtros.</p>
      ) : (
        <div>
          {vagas.map(vaga => (
            <JobCard key={vaga.id} vaga={vaga} onGenerateResume={setResumeTarget} />
          ))}
        </div>
      )}

      {resumeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <ResumeModalContent vaga={resumeTarget} onClose={() => setResumeTarget(null)} />
          </div>
        </div>
      )}
    </div>
  );
}