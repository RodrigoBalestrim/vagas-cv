export interface UserProfile {
  nome: string;
  cargo: string;
  cidade: string;
  email: string;
  telefone: string;
  github: string;
  linkedin: string;
  portfolio: string;
  objetivo: string;
  resumo: string;
  skills: string[];
  projetos: { nome: string; periodo: string; descricao: string }[];
  experiencia: { cargo: string; empresa: string; periodo: string; descricao: string }[];
  formacao: { curso: string; instituicao: string; periodo: string }[];
  certificados: string[];
  idiomas: string[];
}

export const PROFILE_VAZIO: UserProfile = {
  nome: '',
  cargo: '',
  cidade: '',
  email: '',
  telefone: '',
  github: '',
  linkedin: '',
  portfolio: '',
  objetivo: '',
  resumo: '',
  skills: [],
  projetos: [],
  experiencia: [],
  formacao: [],
  certificados: [],
  idiomas: [],
};

// Perfil de exemplo com dados fictícios — usado apenas para demonstração
// quando o visitante não está logado. NUNCA deve conter dados reais.
export const PERFIL_EXEMPLO: UserProfile = {
  nome: 'João da Silva',
  cargo: 'Desenvolvedor Front-End Júnior',
  cidade: 'São Paulo, SP',
  email: 'joao.silva@exemplo.com',
  telefone: '+55 11 90000-0000',
  github: 'https://github.com/joaosilva',
  linkedin: 'https://linkedin.com/in/joaosilva',
  portfolio: '',
  objetivo: 'Desenvolvedor Front-End Júnior em busca da primeira oportunidade.',
  resumo: 'Desenvolvedor com foco em React, TypeScript e Next.js, com projetos pessoais publicados.',
  skills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'HTML5', 'CSS3'],
  projetos: [],
  experiencia: [],
  formacao: [],
  certificados: [],
  idiomas: ['Português — nativo'],
};

// Perfil fixo de exemplo — mantido como alias de PERFIL_EXEMPLO para não
// vazar dados reais em nenhum caminho de código (fallback, demo, etc).
export const PERFIL_RODRIGO: UserProfile = PERFIL_EXEMPLO;