// Definição do perfil do usuário — o "curriculum" completo que alimenta o
// gerador de currículo. Campos usados tanto no Firestore quanto na UI.
export interface UserProfile {
  nome: string;
  cargo: string;         // cargo alvo (ex.: "Desenvolvedor Front-End Júnior")
  cidade: string;
  email: string;
  telefone: string;
  github: string;        // URL do GitHub
  linkedin: string;      // URL do LinkedIn
  portfolio: string;     // URL do portfólio
  objetivo: string;      // frase curta de objetivo
  resumo: string;        // resumo profissional
  skills: string[];      // lista de skills (uma por linha na UI)
  projetos: { nome: string; periodo: string; descricao: string }[];
  experiencia: { cargo: string; empresa: string; periodo: string; descricao: string }[];
  formacao: { curso: string; instituicao: string; periodo: string }[];
  certificados: string[];
  idiomas: string[];
}

// Perfil vazio: estado inicial e fallback seguro (nunca com dados fictícios).
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