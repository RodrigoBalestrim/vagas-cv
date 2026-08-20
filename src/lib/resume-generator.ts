import { Profile, Job } from '@/types';
import profileData from './profile.json';
import { UserProfile, PROFILE_VAZIO } from './user-profile';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error pdfkit não tem tipos TypeScript
import PDFDocument from 'pdfkit';

const profile: Profile = profileData as Profile;

// Perfil usado na geração. Se o usuário logado tiver perfil próprio (Firestore),
// ele é passado aqui; senão usa perfil vazio (sem dados fictícios).
const perfilDe = (perfil?: UserProfile): UserProfile =>
  perfil && perfil.nome ? perfil : PROFILE_VAZIO;

// Contato em uma linha (ATS-safe) a partir do perfil
const linhaContato = (p: UserProfile): string =>
  [p.cidade, p.email, p.telefone, p.github ? `GitHub: ${p.github}` : '', p.linkedin ? `LinkedIn: ${p.linkedin}` : '', p.portfolio ? `Portfólio: ${p.portfolio}` : '']
    .filter(Boolean)
    .join(' · ');

// Converte o perfil do usuário (Firestore) em texto factual para a IA gerar o currículo
function userProfileToText(p: UserProfile): string {
  const linhas: string[] = [];
  linhas.push(`Nome: ${p.nome}`);
  linhas.push(`Cargo alvo: ${p.cargo}`);
  if (p.cidade) linhas.push(`Localização: ${p.cidade}`);
  if (p.email) linhas.push(`E-mail: ${p.email}`);
  if (p.telefone) linhas.push(`Telefone: ${p.telefone}`);
  if (p.github) linhas.push(`GitHub: ${p.github}`);
  if (p.linkedin) linhas.push(`LinkedIn: ${p.linkedin}`);
  if (p.portfolio) linhas.push(`Portfólio: ${p.portfolio}`);
  linhas.push('');
  if (p.objetivo) linhas.push(`Objetivo: ${p.objetivo}`);
  if (p.resumo) linhas.push(`Resumo: ${p.resumo}`);
  if (p.skills.length) linhas.push(`Skills: ${p.skills.join(', ')}`);
  if (p.projetos.length) {
    linhas.push('Projetos:');
    p.projetos.forEach(pr => linhas.push(`- ${pr.nome} (${pr.periodo}): ${pr.descricao}`));
  }
  if (p.experiencia.length) {
    linhas.push('Experiência:');
    p.experiencia.forEach(e => linhas.push(`- ${e.cargo} — ${e.empresa} (${e.periodo}): ${e.descricao}`));
  }
  if (p.formacao.length) {
    linhas.push('Formação:');
    p.formacao.forEach(f => linhas.push(`- ${f.curso} — ${f.instituicao} (${f.periodo})`));
  }
  if (p.certificados.length) {
    linhas.push('Certificados:');
    p.certificados.forEach(c => linhas.push(`- ${c}`));
  }
  if (p.idiomas.length) {
    linhas.push('Idiomas:');
    p.idiomas.forEach(i => linhas.push(`- ${i}`));
  }
  return linhas.join('\n');
}

// 9Router (ou qualquer endpoint OpenAI-compatível) configurável via env
const AI_BASE_URL = process.env.ANTHROPIC_BASE_URL || process.env.AI_BASE_URL || '';
const AI_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN || '';
const AI_MODEL = process.env.AI_MODEL || 'kc/anthropic/claude-sonnet-4-20250514';

function readPerfilMestre(): string {
  try {
    const p = path.join(process.cwd(), 'src', 'lib', 'perfil-mestre.md');
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return 'Perfil mestre não encontrado.';
  }
}

// Habilidades do perfil (nomes exatos de mercado) — usadas pra casar keywords com a vaga
const SKILLS_PERFIL = [
  'React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Expo',
  'Expo Router', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Framer Motion',
  'Three.js', 'React Three Fiber', 'Swiper', 'Supabase', 'PostgreSQL',
  'APIs REST', 'Git', 'GitHub', 'Vercel', 'VS Code', 'Figma', 'Node.js',
  'GitHub Actions', 'CI/CD', 'Edge Functions', 'AsyncStorage',
  'Engenharia de Prompts', 'Gemini', 'OpenAI', 'Auth', 'Design Responsivo',
  'Docker', 'Cloud', 'AWS', 'Metodologias Ágeis',
];

// Termos gerais de vaga de dev que reforçam ATS quando presentes na descrição
const KEYWORDS_GERAIS = [
  'componentes reutilizáveis', 'componentes', 'code review', 'code reviews',
  'estado', 'props', 'consumo de APIs', 'testes', 'jest',
];

const normKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Termos comuns de requisitos em vagas front-end/mobile (base de comparação p/ score de compatibilidade)
const KEYWORDS_VAGA = [
  'React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Expo',
  'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Framer Motion', 'Three.js',
  'Swiper', 'Supabase', 'PostgreSQL', 'APIs REST', 'REST API', 'GraphQL',
  'Git', 'GitHub', 'Vercel', 'Figma', 'Node.js', 'GitHub Actions', 'CI/CD',
  'testes', 'Jest', 'componentes reutilizáveis', 'code review', 'clean code',
  'responsivo', 'design responsivo', 'mobile', 'web', 'front-end', 'frontend',
  'typescript', 'redux', 'context api', 'hooks', 'acessibilidade', 'a11y',
  'performance', 'SEO', 'SSR', 'SSG', 'Cloud', 'Docker', 'AWS', 'Azure',
  'scrum', 'ágil', 'ingles', 'comunicacao',
];

// Termos de requisitos que o perfil de fato cobre (skills exibidas no currículo + keywords)
const COBERTURA_PERFIL = [
  'React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Expo', 'Expo Router',
  'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Framer Motion', 'Three.js', 'React Three Fiber',
  'Swiper', 'Supabase', 'PostgreSQL', 'APIs REST', 'REST API', 'Git', 'GitHub', 'Vercel', 'VS Code',
  'Figma', 'Node.js', 'GitHub Actions', 'CI/CD', 'Edge Functions', 'AsyncStorage',
  'Engenharia de Prompts', 'Gemini', 'OpenAI', 'Auth', 'Design Responsivo', 'Responsive Design',
  'Testes', 'Jest', 'componentes reutilizáveis', 'code review', 'estado', 'props',
  'consumo de APIs', 'Web Development', 'Front-end', 'Frontend',
  'Cloud', 'Docker', 'AWS', 'Azure', 'scrum', 'ágil', 'comunicacao',
];

// Tecnologias que o perfil NÃO cobre e que, se exigidas pela vaga, bloqueiam/derrubam o match.
// Reflete a lista "evitar" do profile.json: Java/Spring, .NET, PHP, Go, Python, Ruby + ERPs/legados.
const KEYWORDS_BLOQUEADAS = [
  'advpl', 'protheus', 'totvs', 'pl/sql', 'plsql', 'oracle', 'java', 'spring',
  'hibernate', '.net', 'c#', 'asp.net', 'php', 'laravel', 'golang', 'go', 'python',
  'ruby', 'delphi', 'cobol', 'sap', 'abap', 'mainframe', 'vb.net', 'visual basic',
  'mysql dba', 'sql server dba', 'f#', 'haskell', 'scala', 'elixir',
];

// Calcula o % de compatibilidade entre a vaga e o perfil do candidato.
// Retorna score (0-100), skills exigidas cobertas / não cobertas pelo perfil
// e tecnologias bloqueadas (que o perfil evita) encontradas na vaga.
export function calcularCompatibilidade(desc?: string): {
  score: number;
  matched: string[];
  missing: string[];
  blocked: string[];
  explicacao: string;
} {
  if (!desc) return { score: 0, matched: [], missing: [], blocked: [], explicacao: 'Sem descrição de vaga para analisar.' };
  const normalizeToken = (s: string) => normKey(s).replace(/[^a-z0-9]/g, '');
  const d = normalizeToken(desc);
  // para detecção de bloqueio usamos a string com espaços/pontuação preservados
  // (senão "java" viraria substring de "javascript" e "advpl" colaria nas palavras vizinhas)
  const dRaw = normKey(desc);
  const matched: string[] = [];
  const missing: string[] = [];
  const blocked: string[] = [];
  for (const term of KEYWORDS_VAGA) {
    const nt = normalizeToken(term);
    if (!d.includes(nt)) continue;
    const coberto = COBERTURA_PERFIL.some(s => {
      const ns = normalizeToken(s);
      return ns === nt || ns.includes(nt) || nt.includes(ns);
    });
    if (coberto) matched.push(term);
    else missing.push(term);
  }
  for (const b of KEYWORDS_BLOQUEADAS) {
    // Fronteira de palavra pra não dar falso positivo:
    // ex.: "java" NÃO pode bater dentro de "javascript", "go" não bate em "google".
    const regex = new RegExp(`(?<![a-z0-9])${b}(?![a-z0-9])`);
    if (regex.test(dRaw)) blocked.push(b);
  }
  // Penaliza forte se a vaga exigir tecnologia que o perfil evita:
  // score nunca passa de 30 quando há bloqueio, proporcional à quantidade.
  const total = matched.length + missing.length;
  let score = total === 0 ? 0 : Math.round((matched.length / total) * 100);
  if (blocked.length) {
    const penalidade = Math.min(90, 25 * blocked.length);
    score = Math.max(5, Math.round(score * (1 - penalidade / 100)));
    score = Math.min(30, score);
  }

  const m = dedupe(matched);
  const miss = dedupe(missing);
  const bl = dedupe(blocked);

  let explicacao: string;
  if (bl.length) {
    explicacao = `A vaga exige ${bl.join(', ')}${miss.length ? `, além de requisitos como ${miss.slice(0, 4).join(', ')}` : ''} — tecnologias fora do perfil. Seu perfil cobre ${m.length ? m.slice(0, 6).join(', ') : 'poucos requisitos'}, mas a exigência de ${bl[0]} é decisiva: mesmo com o restante alinhado, o score é limitado a 30% para refletir o desalinhamento de stack.`;
  } else if (score >= 70) {
    explicacao = `Boa compatibilidade: o perfil cobre os principais requisitos da vaga (${m.slice(0, 8).join(', ')}). ${miss.length ? `Faltam apenas ${miss.slice(0, 4).join(', ')} — dá para mitigar destacando habilidades transferíveis no currículo.` : 'Não foram detectados requisitos fora do perfil.'}`;
  } else if (score >= 40) {
    explicacao = `Compatibilidade média: o perfil cobre ${m.slice(0, 6).join(', ')}. A vaga também pede ${miss.slice(0, 5).join(', ') || 'requisitos não cobertos'} — vale reforçar esses pontos ou destacar projetos que os exercitem.`;
  } else {
    explicacao = `Compatibilidade baixa: poucos requisitos da vaga estão no perfil (${m.slice(0, 4).join(', ') || 'nenhum detectado'}). A vaga pede ${miss.slice(0, 5).join(', ') || 'tecnologias fora do escopo'} — candidatura tem baixa chance de passar no filtro ATS.`;
  }

  return {
    score,
    matched: m,
    missing: miss,
    blocked: bl,
    explicacao,
  };
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.map(s => s.toLowerCase()).map(s => s.charAt(0).toUpperCase() + s.slice(1)))];
}

// Remove prefixos de localização do título da vaga, ex.: "[SÃO PAULO] Front-end" -> "Front-end"
const cleanJobTitle = (titulo?: string): string => {
  if (!titulo) return '';
  return titulo
    .trim()
    .replace(/^\s*\[[^\]]*\]\s*/i, '')
    .replace(/^\s*\([^)]*\)\s*/i, '')
    .trim();
};

function extractJobKeywords(desc: string): string[] {
  if (!desc) return [];
  const d = normKey(desc);
  const found: string[] = [];
  for (const skill of SKILLS_PERFIL) {
    if (d.includes(normKey(skill))) found.push(skill);
  }
  for (const g of KEYWORDS_GERAIS) {
    if (d.includes(normKey(g)) && !found.includes(g)) found.push(g);
  }
  // remove subtermos duplicados (ex.: "componentes" dentro de "componentes reutilizáveis")
  const uniq: string[] = [];
  for (const kw of found) {
    const isSubterm = found.some(other => other !== kw && normKey(other).includes(normKey(kw)));
    if (!isSubterm) uniq.push(kw);
  }
  return uniq;
}

// FALLBACK: template exato do curriculo_final.html (sem IA disponível)
function fallbackTemplate(jobMatch?: Job, perfil?: UserProfile): string {
  const p = perfilDe(perfil);
  const h = p.nome;
  const role = jobMatch?.titulo
    ? cleanJobTitle(jobMatch.titulo).toUpperCase()
    : p.cargo.toUpperCase();
  const keywords = extractJobKeywords(jobMatch?.descricao || '');
  const resumoExtra = keywords.length
    ? ` Alinhado aos requisitos da vaga: ${keywords.slice(0, 6).map(esc).join(', ')}.`
    : '';
  const habilidadeFoco = keywords.length
    ? `<p class="skills-full"><strong>Foco da vaga:</strong> ${keywords.map(esc).join(', ')}</p>`
    : '';
  const skillsHtml = p.skills.map(s => `<p>${esc(s)}</p>`).join('');
  const projetosHtml = p.projetos.map(pr =>
    `<div class="xp-row"><span class="xp-title">- ${esc(pr.nome)}</span><span class="xp-date">${esc(pr.periodo)}</span></div><p>${esc(pr.descricao)}</p>`
  ).join('');
  const expHtml = p.experiencia.map(e =>
    `<div class="xp-row"><span class="xp-title">- ${esc(e.cargo)}</span><span class="xp-date">${esc(e.empresa)} (${esc(e.periodo)})</span></div><p>${esc(e.descricao)}</p>`
  ).join('');
  const formacaoHtml = p.formacao.map(f =>
    `<div class="xp-row"><span class="xp-title">- ${esc(f.curso)}</span><span class="xp-date">${esc(f.instituicao)} (${esc(f.periodo)})</span></div>`
  ).join('');
  const certHtml = p.certificados.map(c =>
    `<div class="xp-row"><span class="xp-title">- ${esc(c)}</span><span class="xp-date">Certificado</span></div>`
  ).join('');
  const idiomasHtml = p.idiomas.map(i => `<p>- ${esc(i)}</p>`).join('');
  const objetivo = p.objetivo || `Desenvolvedor ${p.cargo.replace(/desenvolvedor/i, '').trim()} buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${esc(h)} - Currículo</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; max-width: 780px; margin: 0 auto; padding: 32px 40px; color: #1a1a1a; line-height: 1.45; font-size: 13px; }
    h1 { font-size: 26px; margin: 0 0 2px; font-weight: 700; }
    .role { font-size: 13px; font-weight: 800; margin: 0 0 8px; text-transform: uppercase; }
    .contact { font-size: 11px; color: #333; margin: 2px 0 0; }
    .contact .sep { margin: 0 6px; color: #999; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin: 18px 0 8px; letter-spacing: .3px; }
    .items p { margin: 0 0 5px; }
    .skills-grid { display: block; }
    .skills-grid p { margin: 0 0 5px; }
    .skills-grid .skills-full { grid-column: 1 / -1; }
    .xp-row { display: flex; justify-content: space-between; font-weight: 600; font-size: 12.5px; margin-bottom: 3px; }
    .xp-date { font-weight: 600; font-size: 11px; color: #333; }
    @media print { body { padding: 12px 6px; } }
  </style>
  </head>
  <body>
    <h1>${esc(h)}</h1>
    <p class="role">${esc(role)}</p>
    <div class="contact"><span>${esc(linhaContato(p))}</span></div>

    <section class="sec">
      <h2>Objetivo</h2>
      <div class="items">
        <p>${esc(objetivo)}</p>
      </div>
    </section>

    <section class="sec">
      <h2>Resumo</h2>
      <div class="items">
        <p>${esc(p.resumo)}${resumoExtra}</p>
      </div>
    </section>
    <section class="sec">
      <h2>Skills</h2>
      <div class="items">
        ${habilidadeFoco}<div class="skills-grid">${skillsHtml}</div>
      </div>
    </section>
    <section class="sec">
      <h2>Projetos</h2>
      <div class="items">
        ${projetosHtml}
      </div>
    </section>
    <section class="sec">
      <h2>Experiência</h2>
      <div class="items">
        ${expHtml}
      </div>
    </section>
    <section class="sec">
      <h2>Formação</h2>
      <div class="items">
        ${formacaoHtml}
      </div>
    </section>
<section class="sec">
      <h2>Certificados</h2>
      <div class="items">
        ${certHtml}
      </div>
    </section>
    <section class="sec">
      <h2>Idiomas</h2>
      <div class="items">
        ${idiomasHtml}
      </div>
    </section>
  </body>
  </html>`;
}

const SYSTEM_PROMPT = `Você é um especialista em currículos ATS (Applicant Tracking Systems) e candidaturas.
Seu trabalho é adaptar o perfil de um desenvolvedor front-end JÚNIOR para vagas específicas, SEMPRE mantendo verdade factual (nunca inventar experiência).
REGRAS ATS (críticas):
- 1 coluna, headers simples, sem tabelas, sem imagens
- Encoding limpo (acentos corretos)
- Keywords EXATAS da descrição da vaga injetadas de forma natural
- Currículo em PORTUGUÊS (a menos que a vaga peça inglês)
- Bullets de conquistas com estrutura X-Y-Z: Ação → Método → Resultado numérico
  (ex.: "Reduzi o cadastro manual em ~70% ao integrar reconhecimento por foto via IA em Edge Functions")
- NUNCA inventar números: use apenas métricas presentes no perfil do candidato
  (quantidade de produtos, papéis, formatos, telas, prazos, clientes) ou estimativas conservadoras sem exagero
- Cada bullet de projeto/experiência deve começar com verbo forte no passado (Entreguei, Implementei, Reduzi, Automatizei)

FORMATO EXATO (obrigatório — será convertido pra HTML estilizado automaticamente):
# <Nome completo>
<Cargo alvo, ex: Desenvolvedor Front-End Júnior>

**Contato**
- <cidade/UF · email · telefone · GitHub · LinkedIn · Portfólio>

**Resumo**
<parágrafo>

**Skills**
- <skill>
- <skill>

**Projetos**
- <Nome do projeto> — <período> — <conquista com estrutura X-Y-Z em 1-2 linhas>

**Experiência**
- <Cargo> — <Empresa> (<período>)
- <conquista com estrutura X-Y-Z em 1-2 linhas>

**Formação**
- <Curso> — <Instituição> (<ano>)

**Certificados**
- <Certificado> — Certificado

IMPORTANTE: lista TODOS os cursos e certificações do perfil em Formação e Certificados — nunca omita nenhum. Inclui também os certificados (ex: GitHub Copilot, Prompt Engineering), mesmo que a vaga não peça explicitamente.
Responda SEMPRE no formato:
===CURRICULO===
[currículo completo em markdown seguindo o formato acima]
===CARTA===
[descrição/carta de candidatura pronta pra colar, curta, com as keywords]`;

async function callAI(title: string, description: string, perfil?: UserProfile): Promise<{ curriculo: string; carta: string }> {
  const profileTxt = perfil
    ? userProfileToText(perfil)
    : readPerfilMestre();

  const user = `Título da vaga:\n${title}\n\nDescrição da vaga:\n${description}\n\nPERFIL DO CANDIDATO (verdade factual, não inventar):\n${profileTxt}`;

  const payload = {
    model: AI_MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
  };

  const url = new URL(AI_BASE_URL);
  url.pathname = (url.pathname.replace(/\/+$/, '') || '') + '/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + AI_AUTH_TOKEN,
      'x-api-key': AI_AUTH_TOKEN,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`API retornou ${response.status}: ${(await response.text()).slice(0, 300)}`);

  const rawText = await response.text();
  const tryParse = (s: string) => {
    try {
      const d = JSON.parse(s);
      if (d.type === 'message' && Array.isArray(d.content)) {
        return d.content
          .filter((x: any) => x.type === 'text' && x.text)
          .map((x: any) => x.text)
          .join('\n');
      }
      if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta' && d.delta.text) {
        return d.delta.text;
      }
      return '';
    } catch {
      return null;
    }
  };

  // Caso 1: JSON puro
  const direct = tryParse(rawText);
  if (direct !== null && direct !== '') {
    const cur = (direct.match(/===CURRICULO===\s*([\s\S]*?)(?:===CARTA===|$)/) || [])[1] || direct;
    const carta = (direct.match(/===CARTA===\s*([\s\S]*)$/) || [])[1] || '';
    return { curriculo: cur.trim(), carta: carta.trim() };
  }

  // Caso 2: SSE misturado (JSON completo + data: [DONE])
  let txt = '';
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      const parsed = tryParse(payload);
      if (parsed) txt += parsed;
    } else if (line.trim().startsWith('{')) {
      const parsed = tryParse(line.trim());
      if (parsed) txt += parsed;
    }
  }
  if (!txt) txt = rawText;

  const cur = (txt.match(/===CURRICULO===\s*([\s\S]*?)(?:===CARTA===|$)/) || [])[1] || txt;
  const carta = (txt.match(/===CARTA===\s*([\s\S]*)$/) || [])[1] || '';

  return { curriculo: cur.trim(), carta: carta.trim() };
}

// Converte markdown do currículo (do pipeline da extensão) em HTML estilizado
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// remove markdown links/negrito mantendo texto legível
const cleanMd = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // [texto](url) -> texto
  .replace(/\*\*([^*]+)\*\*/g, '$1')        // **bold** -> bold
  .replace(/\*([^*]+)\*/g, '$1');           // *italic* -> italic

function stripFences(s: string): string {
  // remove ```markdown ... ``` code fence
  return s.replace(/```[a-zA-Z]*\s*\n?/g, '').replace(/```/g, '').trim();
}

function markdownToHtml(cur: string, roleFallback: string): string {
  const lines = stripFences(cur).split('\n').map(l => l.trim());
  let name = '';
  let contact = '';
  let sections: { title: string; items: string[] }[] = [];
  let curSec: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (/^(-{3,}|\*{3,})$/.test(line)) continue; // ignore --- / ***

    // nome = primeiro # (nível 1)
    if (line.startsWith('# ')) {
      const text = cleanMd(line.slice(2));
      if (!name) name = text;
      continue;
    }
    // ## ou ### vira título de seção
    if (/^#{2,3}\s+/.test(line)) {
      curSec = { title: cleanMd(line.replace(/^#+\s+/, '')), items: [] };
      sections.push(curSec);
      continue;
    }
    // **Seção** no início vira título
    const boldSec = line.match(/^\*\*(.+?)\*\*\s*:?(.*)$/);
    if (boldSec) {
      const t = cleanMd(boldSec[1]);
      if (/contato/i.test(t)) {
        if (boldSec[2]) contact += (contact ? '<span class="sep">|</span>' : '') + `<span>${esc(cleanMd(boldSec[2]))}</span>`;
        continue;
      }
      // linha bold que parece cargo (logo após nome) → role, não seção
      if (!sections.length && !/resumo|habilidade|experi|projet|educa|contato|idioma|forma|certif|tecnolog/i.test(t) && /j[uú]nior|front|dev|mobile|full|react|next|type/i.test(t)) {
        continue;
      }
      curSec = { title: t, items: [] };
      sections.push(curSec);
      if (boldSec[2]) curSec.items.push(boldSec[2]);
      continue;
    }
    // linha de contato com email/telefone/url (só ANTES de qualquer seção)
    if (!sections.length && (line.includes('@') || /github|linkedin|portf|behance|www\./.test(line) || /^\+\d/.test(line))) {
      contact += (contact ? '<span class="sep">|</span>' : '') + `<span>${esc(cleanMd(line))}</span>`;
      continue;
    }
    // título de seção conhecida sem marcação (ex.: "Resumo", "Habilidades", "Contato")
    const knownSec = /^(resumo|habilidades|compet[êe]ncias?|experi[êe]ncia|projetos?|educa[cç][aã]o|idiomas|forma[cç][aã]o|certifica[cç][oõ]es|tecnologias|contato|objetivo|sobre|curso)\b/i;
    if (line.match(knownSec) && !/[—–]/.test(line) && !/(19|20)\d\d/.test(line) && !line.includes('@')) {
      curSec = { title: cleanMd(line), items: [] };
      sections.push(curSec);
      continue;
    }
    // item com dash
    if (/^[-*]\s+/.test(line)) {
      const item = cleanMd(line.replace(/^[-*]\s+/, ''));
      if (sections.length) sections[sections.length - 1].items.push(item);
      else sections.push({ title: '', items: [item] });
      continue;
    }
    // parágrafo normal
    if (sections.length) sections[sections.length - 1].items.push(cleanMd(line));
    else contact += (contact ? '<span class="sep">|</span>' : '') + `<span>${esc(cleanMd(line))}</span>`;
  }

  const role = roleFallback.toUpperCase();

  const renderSections = sections.map(s => {
    const isSkills = /skill|habilidade|tecnolog/i.test(s.title);
    return `
    <section class="sec">
      ${s.title ? `<h2>${esc(s.title)}</h2>` : ''}
      <div class="items">
        ${s.items.map(it => {
          const itClean = it.replace(/^[-*]\s+/, '');
          const cls = isSkills ? 'skills-grid-item' : '';
          // datas legíveis: Mês/Ano (Ago/2026, Jan/2024–Dez/2024) ou anos
          if (/(19|20)\d\d/.test(itClean) || /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[/\-\s]?\d{2,4}/i.test(itClean)) {
            const m = itClean.match(/^(.+?)\s*[—–-]\s*(.+)$/);
            if (m) {
              return `<div class="xp-row"><span class="xp-title">${esc(m[1].trim())}</span><span class="xp-date">${esc(m[2].trim())}</span></div>`;
            }
          }
          return `<p${cls ? ` class="${cls}"` : ''}>${esc(itClean)}</p>`;
        }).join('')}
      </div>
    </section>`;
  }).join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Currículo</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; max-width: 780px; margin: 0 auto; padding: 20px 32px; color: #1a1a1a; line-height: 1.25; font-size: 10.5px; }
    h1 { font-size: 20px; margin: 0 0 2px; font-weight: 700; }
    .role { font-size: 11px; font-weight: 800; margin: 0 0 6px; text-transform: uppercase; }
    .contact { font-size: 9.5px; color: #333; margin: 2px 0 0; }
    .contact .sep { margin: 0 5px; color: #999; }
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 1px; margin: 10px 0 5px; letter-spacing: .3px; }
    .items p { margin: 0 0 3px; }
    .items p.skills-grid-item { display: inline-block; width: 49%; vertical-align: top; margin: 0 0 3px; }
    .skills-full { display: block !important; width: 100% !important; }
    .xp-row { display: flex; justify-content: space-between; font-weight: 600; font-size: 10.5px; margin-bottom: 2px; }
    .xp-date { font-weight: 600; font-size: 9.5px; color: #333; }
    @media print { body { padding: 0; } @page { size: A4; margin: 12mm; } }
  </style>
  </head>
  <body>
    <h1>${esc(name)}</h1>
    <p class="role">${esc(role)}</p>
    <div class="contact">${contact}</div>
    ${renderSections}
  </body></html>`;
}

// Garante que certificados essenciais do perfil SEMPRE estejam no currículo
// (a IA grátis às vezes omite — injetamos os que faltam na seção Certificados)
const CERTIFICADOS_ESSENCIAIS = [
  'GitHub Copilot',
  'Prompt Engineering: Aprenda a Conversar com uma IA Generativa',
];

function ensureCertificates(html: string): string {
  let out = html;
  const falta: string[] = [];
  for (const cert of CERTIFICADOS_ESSENCIAIS) {
    if (!out.includes(cert)) falta.push(cert);
  }
  if (falta.length === 0) return out;

  // injeta na seção Certificados se existir, senão cria antes de </body>
  const bullet = falta.map(c => `<p>- ${esc(c)} — Certificado</p>`).join('');
  if (/<h2[^>]*>Certifica[cç][aã]o/i.test(out)) {
    out = out.replace(/(<h2[^>]*>Certifica[cç][aã]o[^<]*<\/h2>\s*<div class="items">)/i, `$1${bullet}`);
  } else {
    out = out.replace('</body>',
      `<section class="sec"><h2>Certificados</h2><div class="items">${bullet}</div></section>\n</body>`);
  }
  return out;
}

export async function gerarCurriculoHTML(jobMatch?: Job, perfil?: UserProfile): Promise<string> {
  const title = jobMatch?.titulo || perfilDe(perfil).cargo || 'Desenvolvedor Front-End';
  const description = jobMatch?.descricao || '';

  // Se AI configurada, usa IA pra adaptar o currículo à vaga
  if (AI_BASE_URL && AI_AUTH_TOKEN) {
    try {
      const { curriculo } = await callAI(title, description, perfil);
      const html = markdownToHtml(curriculo, title);
      // valida: se a IA retornou placeholder/lixo (sem seções), cai pro fallback
      const sections = (html.match(/<h2>/g) || []).length;
      const hasContent = html.includes('<h2>') && html.length > 2000;
      if (!hasContent || sections < 2 || /markdown and|resume in markdown|\[markdown\]/i.test(curriculo)) {
        console.warn('IA retornou conteúdo insuficiente, usando fallback');
        return fallbackTemplate(jobMatch, perfil);
      }
      // garante certificados mesmo se a IA omitir
      return ensureCertificates(html);
    } catch (e) {
      console.error('IA falhou, usando fallback:', e);
      return fallbackTemplate(jobMatch, perfil);
    }
  }

  return fallbackTemplate(jobMatch, perfil);
}

// Gera um PDF A4 real com pdfkit a partir do perfil (mesmo conteúdo do fallbackTemplate)
// Ajusta automaticamente o tamanho da fonte/espaçamento para preencher bem a página:
// - conteúdo curto -> fonte e espaçamento maiores
// - conteúdo longo  -> reduz para caber em 1 página
export function gerarCurriculoPDF(jobMatch?: Job, perfil?: UserProfile): Promise<Buffer> {
  const p = perfilDe(perfil);
  const A4_HEIGHT = 842;
  const MARGIN = 36;
  const usable = A4_HEIGHT - MARGIN * 2;

  const draw = (scale: number) => new Promise<{ buffer: Buffer; pages: number; used: number }>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: `Currículo - ${p.nome}` } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pages = (doc as any).page?.count || doc.bufferedPageRange().count || 1;
        resolve({ buffer: Buffer.concat(chunks), pages, used: (pages - 1) * usable + Math.max(0, doc.y - MARGIN) });
      });
      doc.on('error', reject);

      const h = p.nome;
      const role = jobMatch?.titulo
        ? cleanJobTitle(jobMatch.titulo).toUpperCase()
        : p.cargo.toUpperCase();
      const keywords = extractJobKeywords(jobMatch?.descricao || '');

      const fs = (n: number) => n * scale;      // fonte
      const sp = (n: number) => n * scale;      // espaçamento
      const gap = Math.max(0.5, 1 * scale);     // lineGap

      // Cabeçalho
      doc.font('Helvetica-Bold').fontSize(fs(17)).fillColor('#111111').text(h);
      doc.moveDown(sp(0.1));
      doc.font('Helvetica-Bold').fontSize(fs(10)).fillColor('#111111').text(role);
      doc.moveDown(sp(0.1));
      doc.font('Helvetica').fontSize(fs(7.5)).fillColor('#333333').text(linhaContato(p));

      const section = (titulo: string) => {
        doc.moveDown(sp(0.3));
        doc.font('Helvetica-Bold').fontSize(fs(9.5)).fillColor('#111111').text(titulo);
        doc.moveDown(sp(0.03));
        doc.moveTo(MARGIN, doc.y).lineTo(595.28 - MARGIN, doc.y).lineWidth(0.7).strokeColor('#dddddd').stroke();
        doc.moveDown(sp(0.15));
        doc.font('Helvetica').fontSize(fs(8.5)).fillColor('#111111');
      };
      const bullet = (t: string) => {
        doc.text('•  ' + t, { lineGap: gap });
        doc.moveDown(sp(0.05));
      };

      section('Objetivo');
      doc.text(
        p.objetivo || `Desenvolvedor ${p.cargo.replace(/desenvolvedor/i, '').trim()} buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.`,
        { lineGap: gap }
      );

      section('Resumo');
      doc.text(
        (p.resumo || '') +
        (keywords.length ? ` Alinhado aos requisitos da vaga: ${keywords.slice(0, 6).join(', ')}.` : ''),
        { lineGap: gap }
      );

      section('Skills');
      if (keywords.length) bullet('Foco da vaga: ' + keywords.join(', '));
      // coluna única: 1 skill por linha, ordem de leitura linear (ATS-safe)
      p.skills.forEach(s => bullet(s));

      section('Projetos');
      p.projetos.forEach(pr => {
        doc.text(pr.nome, { continued: true });
        doc.text('  ' + pr.periodo, { align: 'right' });
        bullet(pr.descricao);
      });

      section('Experiência');
      p.experiencia.forEach(e => {
        doc.text(e.cargo, { continued: true });
        doc.text(`  ${e.empresa} (${e.periodo})`, { align: 'right' });
        bullet(e.descricao);
      });

      section('Formação');
      p.formacao.map(f => `${f.curso} — ${f.instituicao} (${f.periodo})`).forEach(bullet);

      section('Certificados');
      p.certificados.map(c => `${c} — Certificado`).forEach(bullet);

      section('Idiomas');
      p.idiomas.forEach(bullet);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });

  return (async () => {
    let scale = 1;
    let best = await draw(scale);

    // Ajuste iterativo (máx. 10 tentativas)
    for (let i = 0; i < 10; i++) {
      const fill = best.used / usable; // preenchimento da última folha (0-1)

      if (best.pages === 1) {
        // 1 folha: preencher bem a folha (min 88%) SEM derramar para a 2ª.
        if (process.env.DEBUG_PDF) console.log(`iter ${i} scale=${scale.toFixed(3)} pages=${best.pages} fill=${fill.toFixed(3)}`);
        if (fill > 0.995) {
          scale = Math.max(0.55, scale * 0.95);
          best = await draw(scale);
          continue;
        }
        if (fill < 0.88) {
          // conteúdo curto: aumenta fonte/espaçamento pra preencher a folha, mas nunca derrama
          const lastOne = best;
          scale = Math.min(1.45, scale * (0.93 / Math.max(fill, 0.1)));
          const r = await draw(scale);
          if (r.pages === 1) { best = r; continue; }
          best = lastOne;
          break;
        }
        break; // preenchimento aceitável (88%-99.5%)
      }

      // 2+ folhas: preencher bem a última folha (sem cortar conteúdo)
      const lastPageUsed = best.used - (best.pages - 1) * usable;
      const lastFill = lastPageUsed / usable;

      if (lastFill < 0.80) {
        // última folha quase vazia: aumenta fonte/espaçamento para preenchê-la
        scale = Math.min(1.3, scale * (0.95 / Math.max(lastFill, 0.1)));
        best = await draw(scale);
        continue;
      }
      if (lastFill > 0.995) {
        // muito justo: reduz um pouco para não cortar conteúdo
        scale = Math.max(0.5, scale * 0.96);
        best = await draw(scale);
        continue;
      }

      break; // última folha bem preenchida
    }

    return best.buffer;
  })();
}