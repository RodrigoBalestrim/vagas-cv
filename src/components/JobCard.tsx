'use client';

import { Job } from '@/types';

interface JobCardProps {
  vaga: Job;
  onGenerateResume: (vaga: Job) => void;
}

export default function JobCard({ vaga, onGenerateResume }: JobCardProps) {
  const scoreColor = vaga.score && vaga.score >= 60 ? 'var(--success)'
    : vaga.score && vaga.score >= 35 ? 'var(--warning)' : 'var(--text-muted)';

  const nivelLabel = vaga.nivel === 'jr' ? 'JR' : vaga.nivel === 'pleno' ? 'PLENO' : vaga.nivel === 'sr' ? 'SR' : '';
  const nivelColor = vaga.nivel === 'jr' ? 'var(--success)' : vaga.nivel === 'pleno' ? 'var(--accent)' : vaga.nivel === 'sr' ? 'var(--danger)' : 'var(--text-muted)';

  return (
    <div className="job-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <a href={vaga.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none', flex: 1, minWidth: '200px', lineHeight: 1.4 }}>
          {vaga.titulo}
          {vaga.brasileira && <span className="badge" style={{ background: '#0891b2', color: '#fff' }}>BR</span>}
          {nivelLabel && <span className="badge" style={{ background: nivelColor, color: '#fff' }}>{nivelLabel}</span>}
        </a>
        {vaga.score !== undefined && (
          <span className="badge-score" style={{ background: scoreColor }}>
            {vaga.score}
          </span>
        )}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '6px 0 4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[vaga.empresa, vaga.local, vaga.fonte].filter(Boolean).map((x, i) => (
          <span key={i} className="chip">📍 {x}</span>
        ))}
      </div>
      {vaga.motivo && (
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px', lineHeight: 1.5 }}>
          {vaga.motivo}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
        <a href={vaga.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          Ver vaga →
        </a>
        <button onClick={() => onGenerateResume(vaga)} className="btn btn-outline btn-sm">
          📄 Gerar Currículo
        </button>
      </div>
    </div>
  );
}