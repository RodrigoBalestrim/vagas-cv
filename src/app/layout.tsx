import type { Metadata } from 'next';
import './globals.css'; // estilos globais (tema, variáveis, componentes .btn/.card/.input etc.)
import { AuthProvider } from '@/components/AuthProvider'; // contexto de autenticação (envia user/logout/token p/ toda a árvore)

// Metadados usados pelo Next.js no <head> (título e descrição da aba/pesquisa)
export const metadata: Metadata = {
  title: 'Vagas CV — Buscador de Vagas + Gerador de Currículo ATS',
  description: 'Busca vagas front-end/mobile React/TypeScript em múltiplas fontes e gera currículos ATS-friendly customizados',
};

// Layout raiz do App Router: envolve todas as páginas com o AuthProvider
// para que qualquer componente possa usar useAuth() (ver quem está logado).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}