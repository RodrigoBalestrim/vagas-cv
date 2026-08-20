'use client';

import Link from 'next/link';

interface FeatureCardProps {
  icon: string;        // emoji/ícone exibido no topo do card
  title: string;       // título do card
  description: string; // texto de descrição
  href: string;        // rota para onde o card leva ao clicar
}

// Card clicável usado na página inicial para apresentar as principais
// funcionalidades (Buscar Vagas / Gerar Currículo). Todo o card é um link.
export default function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="feature-card">
        <div className="icon">{icon}</div>
        <h3>{title}</h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{description}</p>
      </div>
    </Link>
  );
}