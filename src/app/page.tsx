import FeatureCard from '@/components/FeatureCard';

export default function HomePage() {
  return (
    <div>
      <header className="site-header no-print">
        <div className="inner">
          <div className="brand">
            <span className="logo">⚡</span>
            Vagas CV
          </div>
          <nav className="site-nav">
            <a href="/vagas" className="nav-link">Buscar Vagas</a>
            <a href="/curriculo" className="nav-link">Gerar Currículo</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <span className="eyebrow">🚀 Buscador + Currículo ATS em um só lugar</span>
        <h1>Encontre a vaga certa e gere seu currículo na hora</h1>
        <p>
          Busca vagas em múltiplas fontes (GitHub BR, Remotive, RemoteOK, WeWorkRemotely,
          Himalayas, Jobicy, Novo Trampo), ranqueia por match com seu perfil front-end/mobile
          React/TypeScript, e gera currículos ATS-friendly customizados por vaga.
        </p>
        <div className="actions">
          <a href="/vagas" className="btn btn-primary">🔍 Buscar Vagas</a>
          <a href="/curriculo" className="btn btn-outline">📄 Gerar Currículo</a>
        </div>
      </section>

      <main className="container">
        <div className="card-grid section">
          <FeatureCard
            icon="🔍"
            title="Buscar Vagas"
            description="Fontes: GitHub BR, Remotive, RemoteOK, WeWorkRemotely, Himalayas, Jobicy, Novo Trampo. Filtros: remoto, stack React/TS/JS, júnior/pleno. Ranqueamento por palavras-chave."
            href="/vagas"
          />
          <FeatureCard
            icon="📄"
            title="Gerar Currículo"
            description="Template ATS-friendly baseado no seu perfil (React, Next.js, React Native, TypeScript, Supabase). Exporta HTML/PDF com o nome da vaga."
            href="/curriculo"
          />
        </div>

        <section className="card section">
          <div className="page" style={{ padding: '32px' }}>
            <h3>Como funciona</h3>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: 1.9 }}>
              <li><strong style={{ color: 'var(--text)' }}>Busca:</strong> Clique em "Buscar Vagas" → define filtros (dias, score mínimo, só Brasil) → vê cards ranqueados</li>
              <li><strong style={{ color: 'var(--text)' }}>Match:</strong> Cada vaga mostra score (0-100), nível (JR/PLENO/SR), keywords match e alertas</li>
              <li><strong style={{ color: 'var(--text)' }}>Currículo:</strong> Clique "Gerar Currículo" no card → abre modal com currículo customizado para aquela vaga</li>
              <li><strong style={{ color: 'var(--text)' }}>Exporta:</strong> Baixe o PDF com o nome da vaga, ou salve via Ctrl+P</li>
            </ol>
          </div>
        </section>

        <section className="alert alert-warn section">
          <span>⚠️</span>
          <span>
            <strong>Variáveis de ambiente:</strong> para busca completa, configure no <code>.env.local</code> o
            <code> GH_PAT</code> (GitHub Personal Access Token — opcional, aumenta o rate limit de 60 para 5.000 req/h).
          </span>
        </section>
      </main>

      <footer className="site-footer">
        Baseado no perfil de <NOME COMPLETO> · Front-end &amp; Mobile (React, React Native, TypeScript)
      </footer>
    </div>
  );
}