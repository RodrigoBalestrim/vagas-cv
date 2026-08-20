'use client';

import Link from 'next/link';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

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