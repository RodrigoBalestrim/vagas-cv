'use client';

import { Job } from '@/types';

interface JobCardProps {
  vaga: Job;
  onGenerateResume: (vaga: Job) => void;
}

export default function JobCard({ vaga, onGenerateResume }: JobCardProps) {
  const scoreColor = vaga.score && vaga.score >= 60 ? '#16a34a'
    : vaga.score && vaga.score >= 35 ? '#ca8a04' : '#6b7280';

  const nivelLabel = vaga.nivel === 'jr' ? 'JR' : vaga.nivel === 'pleno' ? 'PLENO' : vaga.nivel === 'sr' ? 'SR' : '';
  const nivelColor = vaga.nivel === 'jr' ? '#16a34a' : vaga.nivel === 'pleno' ? '#7c3aed' : vaga.nivel === 'sr' ? '#dc2626' : '#6b7280';

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '12px',
      background: '#fff',
      transition: 'box-shadow 0.2s',
    }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <a href={vaga.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '16px', fontWeight: 700, color: '#111827', textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          {vaga.titulo}
          {vaga.brasileira && <span style={{ background: '#0891b2', color: '#fff', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', marginLeft: '6px' }}>BR</span>}
          {nivelLabel && <span style={{ background: nivelColor, color: '#fff', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', marginLeft: '6px' }}>{nivelLabel}</span>}
        </a>
        {vaga.score !== undefined && (
          <span style={{ background: scoreColor, color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {vaga.score}
          </span>
        )}
      </div>
      <div style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0' }}>
        {[vaga.empresa, vaga.local, vaga.fonte].filter(Boolean).join(' · ')}
      </div>
      {vaga.motivo && (
        <div style={{ color: '#374151', fontSize: '14px', marginTop: '6px' }}>
          {vaga.motivo}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        <a href={vaga.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
          Ver vaga →
        </a>
        <button
          onClick={() => onGenerateResume(vaga)}
          style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', border: '1px solid #2563eb', borderRadius: '4px', background: '#fff', color: '#2563eb' }}
        >
          Gerar Currículo
        </button>
      </div>
    </div>
  );
}