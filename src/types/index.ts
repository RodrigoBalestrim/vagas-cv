// Tipos globais do projeto (compartilhados entre front, libs e API routes).

// Uma vaga coletada das fontes externas e enriquecida com o score de match.
export interface Job {
  id: string;          // id único (fonte + identificador da vaga)
  fonte: string;       // nome da fonte (GitHub/frontendbr, Remotive, RemoteOK...)
  titulo: string;
  empresa: string;
  local: string;
  url: string;         // link para a vaga original
  descricao: string;   // texto limpo da vaga
  data: string;        // data de publicação (ISO)
  brasileira: boolean; // se aceita candidatos do Brasil
  // Campos preenchidos pelo ranqueamento (scoring.ts):
  score?: number;                    // 0-100
  nivel?: 'jr' | 'pleno' | 'sr' | '?';
  motivo?: string;                   // texto explicando o match
  coreNoTitulo?: boolean;            // se alguma keyword core está no título
  temCore?: boolean;                 // se alguma keyword core foi encontrada
  matchedKeywords?: string[];
  warnings?: string[];
}

// Perfil de referência do candidato (carregado de profile.json).
// Define o foco, stack, o que "quer" e o que "evitar" — usado para
// ranquear vagas e dar contexto à IA.
export interface Profile {
  nome: string;
  foco: string;
  senioridade: string;
  modelo_trabalho: string;
  idiomas_vaga: string[];
  stack_frontend: string[];
  stack_mobile: string[];
  backend_baas: string[];
  qualidade_e_entrega: string[];
  quero: string[];
  evitar: string[];
  palavras_chave_prioritarias: string[];
}

// Modelo de template de currículo (não usado atualmente — mantido para futuro)
export interface ResumeTemplate {
  name: string;
  html: string;
  css: string;
}

// Job após o ranqueamento (garante os campos de score/keywords/warnings)
export interface RankedJob extends Job {
  matchScore: number;
  matchedKeywords: string[];
  warnings: string[];
}