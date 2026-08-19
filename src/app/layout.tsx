import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vagas CV — Buscador de Vagas + Gerador de Currículo ATS',
  description: 'Busca vagas front-end/mobile React/TypeScript em múltiplas fontes e gera currículos ATS-friendly customizados',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}