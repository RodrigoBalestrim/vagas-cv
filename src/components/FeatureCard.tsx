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
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
        <h3 style={{ fontSize: '20px', margin: '0 0 12px', fontWeight: 600 }}>{title}</h3>
        <p style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{description}</p>
      </div>
    </Link>
  );
}