export interface Job {
  id: string;
  fonte: string;
  titulo: string;
  empresa: string;
  local: string;
  url: string;
  descricao: string;
  data: string;
  brasileira: boolean;
  score?: number;
  nivel?: 'jr' | 'pleno' | 'sr' | '?';
  motivo?: string;
  coreNoTitulo?: boolean;
  temCore?: boolean;
  matchedKeywords?: string[];
  warnings?: string[];
}

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

export interface ResumeTemplate {
  name: string;
  html: string;
  css: string;
}

export interface RankedJob extends Job {
  matchScore: number;
  matchedKeywords: string[];
  warnings: string[];
}