import { Job, RankedJob } from '@/types';

// Motor de pontuação e ranqueamento de vagas.
// Dá a cada vaga um score 0-100 com base em keywords do perfil do candidato:
// - CORE: tecnologias principais (React, React Native, TypeScript...)
// - SECUNDARIAS: tecnologias de apoio (Tailwind, Git, Node...)
// - PENALIDADES: tecnologias/níveis que não combinam com o perfil

const CORE = [
  'react native', 'expo', 'react', 'next.js', 'nextjs', 'typescript', 'javascript',
  'frontend', 'front-end', 'front end', 'mobile', 'android', 'fullstack', 'full-stack',
  'full stack', 'supabase', 'postgres', 'postgresql', 'api rest', 'rest api', 'apis rest',
];

const SECUNDARIAS = [
  'tailwind', 'figma', 'acessibilidade', 'wcag', 'git', 'github actions', 'ci/cd', 'node', 'nodejs', 'node.js',
];

const PENALIDADES = [
  'java', 'spring', '.net', 'c#', 'php', 'laravel', 'golang', 'ruby on rails',
  'senior', 'sênior', 'especialista', 'tech lead', 'staff', 'presencial',
  'care specialist', 'product strategy', 'revenue lead', 'sales', 'recruiter',
  'pleno', 'mid-level', 'mid level',  // Penalizar termos de nível médio/alto no título
];

// Normaliza texto para comparação (minúsculas, sem acentos)
const norm = (s: string) => (s || '').toLowerCase();

// Detecta o nível da vaga a partir do título (JR / PLENO / SR)
function nivel(titulo: string): 'jr' | 'pleno' | 'sr' | '?' {
  const t = ' ' + norm(titulo) + ' ';
  const jr = ['júnior', 'junior', 'estág', 'estagi', 'trainee', 'aprendiz', 'iniciante', ' jr ', ' jr.', '-jr', '/jr', 'entry', 'júnior', 'estagi'];
  const pl = ['pleno', 'plena', ' pl ', 'mid-level', 'mid level', ' mid ', 'plenos'];
  const sr = ['sênior', 'senior', 'sênior', 'senior', 'especialista', 'principal', 'tech lead', ' staff ', ' sr ', ' sr.', '-sr', ' lead ', 'arquiteto', 'arquiteta'];
  if (jr.some(x => t.includes(x))) return 'jr';
  if (pl.some(x => t.includes(x))) return 'pleno';
  if (sr.some(x => t.includes(x))) return 'sr';
  return '?';
}

// Calcula o score de UMA vaga. Pontuação:
// - keyword CORE no título: +16 | CORE na descrição: +6
// - keyword SECUNDÁRIA no título: +5 | na descrição: +2
// - penalidade no título: -10
// - bônus de nível (jr +40, pleno -5, sr -30) e vaga brasileira +10
export function pontuar(vaga: Job) {
  const titulo = norm(vaga.titulo);
  const desc = norm(vaga.descricao);
  let score = 0;
  const combina = new Set<string>();
  let coreNoTitulo = false;
  const alertas: string[] = [];

  for (const kw of CORE) {
    if (titulo.includes(kw)) {
      score += 16;
      combina.add(kw);
      coreNoTitulo = true;
    } else if (desc.includes(kw)) {
      score += 6;
      combina.add(kw);
    }
  }

  for (const kw of SECUNDARIAS) {
    if (titulo.includes(kw)) {
      score += 5;
      combina.add(kw);
    } else if (desc.includes(kw)) {
      score += 2;
      combina.add(kw);
    }
  }

  for (const p of PENALIDADES) {
    if (titulo.includes(p)) {
      score -= 10;
      alertas.push(p);
    }
  }

  const nv = nivel(vaga.titulo);
  if (nv === 'jr') score += 40;      // Boost júnior ainda mais
  else if (nv === 'pleno') score -= 5; // Penalizar pleno leve
  else if (nv === 'sr') score -= 30;   // Penalizar sênior forte

  if (vaga.brasileira) score += 10;

  // Garante que o score fique entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Texto de explicação do match (exibido no card da vaga)
  const matched = [...combina].slice(0, 6);
  let motivo = matched.length > 0 ? `Combina com: ${matched.join(', ')}` : 'Match fraco';
  if (alertas.length) motivo += ` · ⚠ título menciona: ${alertas.slice(0, 3).join(', ')}`;

  return {
    score,
    motivo,
    nivel: nv,
    coreNoTitulo,
    temCore: [...combina].some(k => CORE.includes(k)),
    matchScore: score,
    matchedKeywords: [...combina],
    warnings: alertas,
  };
}

// Ranqueia uma lista de vagas: pontua cada uma, descarta as sem match
// (score 0) e as sênior, e ordena por score (e depois por brasileira).
export function ranquear(vagas: Job[]): RankedJob[] {
  const comScore = vagas
    .map(v => ({ ...v, ...pontuar(v) }))
    .filter(v => (v.score ?? 0) > 0 && v.nivel !== 'sr');
  return comScore.sort((a, b) => ((b.score ?? 0) - (a.score ?? 0)) || (Number(b.brasileira) - Number(a.brasileira)));
}

// Agrupa vagas por área (usado nos filtros/agrupamento da API)
export function grupo(titulo: string): string {
  const t = norm(titulo);
  if (/react native|\bexpo\b|mobile|android|ios/.test(t)) return 'React Native / Mobile';
  if (/full[ -]?stack/.test(t)) return 'Full Stack';
  if (/next\.js|nextjs/.test(t)) return 'Next.js';
  if (/node\.js|nodejs|back[ -]?end/.test(t)) return 'Node.js / Backend';
  if (/react|front[ -]?end/.test(t)) return 'Front-end React';
  return 'Outras JS';
}