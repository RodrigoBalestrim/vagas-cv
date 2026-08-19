import FeatureCard from '@/components/FeatureCard';

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Vagas CV</h1>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <a href="/vagas" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Buscar Vagas</a>
            <a href="/curriculo" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Gerar Currículo</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <section style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '40px', margin: '0 0 16px', fontWeight: 700 }}>
            Buscador de Vagas + Gerador de Currículo ATS
          </h2>
          <p style={{ fontSize: '18px', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Busca vagas em múltiplas fontes (GitHub BR, Remotive, RemoteOK, WeWorkRemotely, Himalayas, Jobicy),
            ranqueia por match com seu perfil front-end/mobile React/TypeScript, e gera currículos ATS-friendly
            customizados por vaga.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <FeatureCard
            icon="🔍"
            title="Buscar Vagas"
            description="Fontes: GitHub BR (11 repos), Remotive, RemoteOK, WeWorkRemotely, Himalayas, Jobicy. Filtros: remoto, stack React/TS/JS, júnior/pleno. Ranqueamento por palavras-chave."
            href="/vagas"
          />
          <FeatureCard
            icon="📄"
            title="Gerar Currículo"
            description="Template ATS-friendly baseado no seu perfil (React, Next.js, React Native, TypeScript, Supabase). Exporta HTML/PDF. Versão customizada por vaga disponível na busca."
            href="/curriculo"
          />
        </div>

        <section style={{ marginTop: '48px', padding: '24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 16px' }}>Como funciona</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: 1.8 }}>
            <li><strong>Busca:</strong> Clique em "Buscar Vagas" → define filtros (dias, score mínimo, só Brasil) → vê cards ranqueados</li>
            <li><strong>Match:</strong> Cada vaga mostra score (0-100), nível (JR/PLENO/SR), keywords match e alertas</li>
            <li><strong>Currículo:</strong> Clique "Gerar Currículo" no card → abre modal com currículo customizado para aquela vaga</li>
            <li><strong>Exporta:</strong> Ctrl+P para salvar PDF, ou baixe o HTML base em "Gerar Currículo"</li>
          </ol>
        </section>

        <section style={{ marginTop: '24px', padding: '24px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: '#92400e' }}>⚠️ Variáveis de ambiente necessárias</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Para busca completa, configure no <code>.env.local</code>:
            <br/><code>GH_PAT</code> (GitHub Personal Access Token — opcional, aumenta rate limit)
            <br/>Sem token: 60 req/h no GitHub API. Com token: 5.000 req/h.
          </p>
        </section>
      </main>

      <footer style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', borderTop: '1px solid #e5e7eb', marginTop: '48px' }}>
        Baseado no perfil de <NOME COMPLETO> · Front-end & Mobile (React, React Native, TypeScript)
      </footer>
    </div>
  );
}