import { Profile, Job } from '@/types';
import profileData from './profile.json';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error pdfkit não tem tipos TypeScript
import PDFDocument from 'pdfkit';

const profile: Profile = profileData as Profile;

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
];

// Calcula o % de compatibilidade entre a vaga e o perfil do candidato.
// Retorna score (0-100) e as skills exigidas cobertas / não cobertas pelo perfil.
export function calcularCompatibilidade(desc?: string): {
  score: number;
  matched: string[];
  missing: string[];
} {
  if (!desc) return { score: 0, matched: [], missing: [] };
  const normalizeToken = (s: string) => normKey(s).replace(/[^a-z0-9]/g, '');
  const d = normalizeToken(desc);
  const matched: string[] = [];
  const missing: string[] = [];
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
  const total = matched.length + missing.length;
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);
  return { score, matched: dedupe(matched), missing: dedupe(missing) };
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
function fallbackTemplate(jobMatch?: Job): string {
  const h = profile.nome;
  const role = jobMatch?.titulo
    ? cleanJobTitle(jobMatch.titulo).toUpperCase()
    : 'DESENVOLVEDOR FRONT-END JÚNIOR';
  const keywords = extractJobKeywords(jobMatch?.descricao || '');
  const resumoExtra = keywords.length
    ? ` Alinhado aos requisitos da vaga: ${keywords.slice(0, 6).join(', ')}.`
    : '';
  const habilidadeFoco = keywords.length
    ? `<p class="skills-full"><strong>Foco da vaga:</strong> ${keywords.map(esc).join(', ')}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${h} - Currículo</title>
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
    <h1>${h}</h1>
    <p class="role">${role}</p>
    <div class="contact"><span><CIDADE, UF> · <EMAIL> · <TELEFONE> · GitHub: https://github.com/<usuario> · LinkedIn: https://www.linkedin.com/in/<usuario> · Portfólio: https://<portfolio>.vercel.app</span></div>

    <section class="sec">
      <h2>Objetivo</h2>
      <div class="items">
        <p>Desenvolvedor Front-End Júnior em React/Next.js buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.</p>
      </div>
    </section>

    <section class="sec">
      <h2>Resumo</h2>
      <div class="items">
        <p>Desenvolvedor Front-End com experiência prática em React, TypeScript, Next.js e React Native, do design à publicação. Autor do Prazo Certo, aplicação multiplataforma com Supabase/PostgreSQL, autenticação, permissões por papel e IA generativa (Gemini/OpenAI). Portfólio 3D interativo com React, Three.js e Tailwind CSS, deploy na Vercel. Uso diário de IA generativa e engenharia de prompts. Busco oportunidade remota como Desenvolvedor Front-End Júnior React.${resumoExtra}</p>
      </div>
    </section>
    <section class="sec">
      <h2>Skills</h2>
      <div class="items">
        ${habilidadeFoco}<div class="skills-grid"><p>React</p><p>TypeScript</p><p>Next.js</p><p>JavaScript (ES6+)</p><p>React Native, Expo</p><p>HTML5, CSS3</p><p>Tailwind CSS, Bootstrap</p><p>Three.js, React Three Fiber, Framer Motion</p><p>APIs REST</p><p>Supabase (PostgreSQL, Auth)</p><p>Git, GitHub, Vercel</p><p>Figma</p><p>Testes</p><p>Responsive Design</p><p>Web Development</p><p>Front-end</p><p>Engenharia de prompts (Gemini/OpenAI)</p></div>
      </div>
    </section>
    <section class="sec">
      <h2>Projetos</h2>
      <div class="items">
        <div class="xp-row"><span class="xp-title">- Prazo Certo</span><span class="xp-date">Jan/2025 – Atual</span></div><p>Aplicativo multiplataforma (Android/Web) de gestão de validade de produtos com React Native, TypeScript, Expo e Supabase/PostgreSQL, integração com IA generativa para reconhecimento de produto por imagem e CI/CD via GitHub Actions. Repositório: https://github.com/<usuario>/prazo-certo-app</p><div class="xp-row"><span class="xp-title">- Prazo Certo Landing</span><span class="xp-date">Jan/2025</span></div><p>Landing page do Prazo Certo com Next.js e TypeScript. https://github.com/<usuario>/prazo-certo-landing</p><div class="xp-row"><span class="xp-title">- Portfólio 3D Interativo</span><span class="xp-date">Jan/2025</span></div><p>Portfólio com Next.js, React, Three.js, React Three Fiber e Tailwind CSS, animações com Framer Motion, 100% responsivo, deploy na Vercel. https://<portfolio>.vercel.app</p><div class="xp-row"><span class="xp-title">- Currículo HTML Bilíngue</span><span class="xp-date">Jan/2025</span></div><p>Currículo + portfólio responsivo com HTML, CSS e JavaScript. https://github.com/<usuario>/curriculo-html-rodrigo</p>
      </div>
    </section>
    <section class="sec">
      <h2>Experiência</h2>
      <div class="items">
        <div class="xp-row"><span class="xp-title">- Desenvolvedor Full Stack</span><span class="xp-date">Autônomo (Jan/2025 – Atual)</span></div><p>Desenvolvimento autônomo de sites e aplicativos de ponta a ponta (front-end e back-end). Autor do Prazo Certo (React Native, TypeScript, Expo, Supabase/PostgreSQL, IA generativa, CI/CD), além de portfólio 3D, landing pages e currículo HTML bilíngue com deploy na Vercel.</p><div class="xp-row"><span class="xp-title">- Técnico de Informática</span><span class="xp-date">Autônomo (Jan/2014 – Dez/2024)</span></div><p>Mais de 10 anos de experiência em atendimento ao cliente, diagnóstico e resolução de problemas técnicos, gestão do próprio negócio, suporte e organização.</p>
      </div>
    </section>
    <section class="sec">
      <h2>Formação</h2>
      <div class="items">
        <div class="xp-row"><span class="xp-title">- Análise de Dados e Desenvolvimento</span><span class="xp-date">UniCesumar (Jan/2022 – Dez/2024)</span></div><div class="xp-row"><span class="xp-title">- Análise e Projeto de Software</span><span class="xp-date">IFRS / Aprenda Mais (Ago/2026)</span></div><div class="xp-row"><span class="xp-title">- Desenvolvimento Full Stack</span><span class="xp-date">Programador BR (Jun/2021)</span></div><div class="xp-row"><span class="xp-title">- HTML/CSS</span><span class="xp-date">Curso em Vídeo (Jun/2020)</span></div>
      </div>
    </section>
<section class="sec">
      <h2>Certificados</h2>
      <div class="items">
        <div class="xp-row"><span class="xp-title">- Programação em Pares de IA com o GitHub Copilot</span><span class="xp-date">Certificado</span></div><div class="xp-row"><span class="xp-title">- Prompt Engineering: Aprenda a Conversar com uma IA Generativa</span><span class="xp-date">Certificado</span></div>
      </div>
    </section>
    <section class="sec">
      <h2>Idiomas</h2>
      <div class="items">
        <p>- Português — nativo</p><p>- Inglês — técnico (leitura de documentação)</p><p>- Espanhol — básico</p>
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
- <Nome do projeto> — <descrição curta em 1-2 linhas>

**Experiência**
- <Cargo> — <Empresa> (<período>)
- <descrição curta>

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

async function callAI(title: string, description: string): Promise<{ curriculo: string; carta: string }> {
  const profileTxt = readPerfilMestre();

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
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  let name = '<NOME COMPLETO>';
  let contact = '';
  let sections: { title: string; items: string[] }[] = [];
  let curSec: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (/^(-{3,}|\*{3,})$/.test(line)) continue; // ignore --- / ***

    // nome = primeiro # (nível 1)
    if (line.startsWith('# ')) {
      const text = cleanMd(line.slice(2));
      if (!name || name === '<NOME COMPLETO>') name = text;
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

export async function gerarCurriculoHTML(jobMatch?: Job): Promise<string> {
  const title = jobMatch?.titulo || 'Desenvolvedor Front-End';
  const description = jobMatch?.descricao || '';

  // Se AI configurada, usa IA pra adaptar o currículo à vaga
  if (AI_BASE_URL && AI_AUTH_TOKEN) {
    try {
      const { curriculo } = await callAI(title, description);
      const html = markdownToHtml(curriculo, title);
      // valida: se a IA retornou placeholder/lixo (sem seções), cai pro fallback
      const sections = (html.match(/<h2>/g) || []).length;
      const hasContent = html.includes('<h2>') && html.length > 2000;
      if (!hasContent || sections < 2 || /markdown and|resume in markdown|\[markdown\]/i.test(curriculo)) {
        console.warn('IA retornou conteúdo insuficiente, usando fallback');
        return fallbackTemplate(jobMatch);
      }
      // garante certificados mesmo se a IA omitir
      return ensureCertificates(html);
    } catch (e) {
      console.error('IA falhou, usando fallback:', e);
      return fallbackTemplate(jobMatch);
    }
  }

  return fallbackTemplate(jobMatch);
}

// Gera um PDF A4 real com pdfkit a partir do perfil (mesmo conteúdo do fallbackTemplate)
// Ajusta automaticamente o tamanho da fonte/espaçamento para preencher bem a página:
// - conteúdo curto -> fonte e espaçamento maiores
// - conteúdo longo  -> reduz para caber em 1 página
export function gerarCurriculoPDF(jobMatch?: Job): Promise<Buffer> {
  const A4_HEIGHT = 842;
  const MARGIN = 36;
  const usable = A4_HEIGHT - MARGIN * 2;

  const draw = (scale: number) => new Promise<{ buffer: Buffer; pages: number; used: number }>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: 'Currículo - <NOME COMPLETO>' } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pages = doc.bufferedPageRange().count;
        resolve({ buffer: Buffer.concat(chunks), pages, used: (pages - 1) * usable + Math.max(0, doc.y - MARGIN) });
      });
      doc.on('error', reject);

      const h = profile.nome;
      const role = jobMatch?.titulo
        ? cleanJobTitle(jobMatch.titulo).toUpperCase()
        : 'DESENVOLVEDOR FRONT-END JÚNIOR';
      const keywords = extractJobKeywords(jobMatch?.descricao || '');

      const fs = (n: number) => n * scale;      // fonte
      const sp = (n: number) => n * scale;      // espaçamento
      const gap = Math.max(0.5, 1 * scale);     // lineGap

      // Cabeçalho
      doc.font('Helvetica-Bold').fontSize(fs(17)).fillColor('#111111').text(h);
      doc.moveDown(sp(0.1));
      doc.font('Helvetica-Bold').fontSize(fs(10)).fillColor('#111111').text(role);
      doc.moveDown(sp(0.1));
      doc.font('Helvetica').fontSize(fs(7.5)).fillColor('#333333').text(
        '<CIDADE, UF> · <EMAIL> · <TELEFONE> · GitHub: https://github.com/<usuario> · LinkedIn: https://www.linkedin.com/in/<usuario> · Portfólio: https://<portfolio>.vercel.app'
      );

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
        'Desenvolvedor Front-End Júnior em React/Next.js buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.',
        { lineGap: gap }
      );

      section('Resumo');
      doc.text(
        'Desenvolvedor Front-End com experiência prática em React, TypeScript, Next.js e React Native, do design à publicação. Autor do Prazo Certo, aplicação multiplataforma com Supabase/PostgreSQL, autenticação, permissões por papel e IA generativa (Gemini/OpenAI). Portfólio 3D interativo com React, Three.js e Tailwind CSS, deploy na Vercel. Uso diário de IA generativa e engenharia de prompts. Busco oportunidade remota como Desenvolvedor Front-End Júnior React.' +
        (keywords.length ? ` Alinhado aos requisitos da vaga: ${keywords.slice(0, 6).join(', ')}.` : ''),
        { lineGap: gap }
      );

      section('Skills');
      if (keywords.length) bullet('Foco da vaga: ' + keywords.join(', '));
      const skillsList = [
        'React', 'TypeScript', 'Next.js', 'JavaScript (ES6+)', 'React Native, Expo',
        'HTML5, CSS3', 'Tailwind CSS, Bootstrap', 'Three.js, React Three Fiber, Framer Motion',
        'APIs REST', 'Supabase (PostgreSQL, Auth)', 'Git, GitHub, Vercel', 'Figma',
        'Testes', 'Responsive Design', 'Web Development', 'Front-end',
        'Engenharia de prompts (Gemini/OpenAI)',
      ];
      // coluna única: até 4 skills por linha, ordem de leitura linear (ATS-safe)
      for (let i = 0; i < skillsList.length; i += 4) {
        const linha = skillsList.slice(i, i + 4).join('  •  ');
        doc.text('•  ' + linha, { lineGap: gap });
        doc.moveDown(sp(0.05));
      }

      section('Projetos');
      doc.text('Prazo Certo', { continued: true });
      doc.text('  Jan/2025 – Atual', { align: 'right' });
      bullet('Aplicativo multiplataforma (Android/Web) de gestão de validade de produtos com React Native, TypeScript, Expo e Supabase/PostgreSQL, integração com IA generativa para reconhecimento de produto por imagem e CI/CD via GitHub Actions. Repositório: https://github.com/<usuario>/prazo-certo-app');
      doc.text('Prazo Certo Landing', { continued: true });
      doc.text('  Jan/2025', { align: 'right' });
      bullet('Landing page do Prazo Certo com Next.js e TypeScript. https://github.com/<usuario>/prazo-certo-landing');
      doc.text('Portfólio 3D Interativo', { continued: true });
      doc.text('  Jan/2025', { align: 'right' });
      bullet('Portfólio com Next.js, React, Three.js, React Three Fiber e Tailwind CSS, animações com Framer Motion, 100% responsivo, deploy na Vercel. https://<portfolio>.vercel.app');
      doc.text('Currículo HTML Bilíngue', { continued: true });
      doc.text('  Jan/2025', { align: 'right' });
      bullet('Currículo + portfólio responsivo com HTML, CSS e JavaScript. https://github.com/<usuario>/curriculo-html-rodrigo');

      section('Experiência');
      doc.text('Desenvolvedor Full Stack', { continued: true });
      doc.text('  Autônomo (Jan/2025 – Atual)', { align: 'right' });
      bullet('Desenvolvimento autônomo de sites e aplicativos de ponta a ponta (front-end e back-end). Autor do Prazo Certo (React Native, TypeScript, Expo, Supabase/PostgreSQL, IA generativa, CI/CD), além de portfólio 3D, landing pages e currículo HTML bilíngue com deploy na Vercel.');
      doc.text('Técnico de Informática', { continued: true });
      doc.text('  Autônomo (Jan/2014 – Dez/2024)', { align: 'right' });
      bullet('Mais de 10 anos de experiência em atendimento ao cliente, diagnóstico e resolução de problemas técnicos, gestão do próprio negócio, suporte e organização.');

      section('Formação');
      [
        'Análise de Dados e Desenvolvimento — UniCesumar (Jan/2022 – Dez/2024)',
        'Análise e Projeto de Software — IFRS / Aprenda Mais (Ago/2026)',
        'Desenvolvimento Full Stack — Programador BR (Jun/2021)',
        'HTML/CSS — Curso em Vídeo (Jun/2020)',
      ].forEach(bullet);

      section('Certificados');
      [
        'Programação em Pares de IA com o GitHub Copilot — Certificado',
        'Prompt Engineering: Aprenda a Conversar com uma IA Generativa — Certificado',
      ].forEach(bullet);

      section('Idiomas');
      [
        'Português — nativo',
        'Inglês — técnico (leitura de documentação)',
        'Espanhol — básico',
      ].forEach(bullet);

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
        // 1 folha: preencher moderadamente SEM derramar para a 2ª.
        // Pouca informação = 1 folha é suficiente, pode sobrar espaço.
        if (fill > 0.995) {
          scale = Math.max(0.55, scale * 0.95);
          best = await draw(scale);
          continue;
        }
        if (fill < 0.72) {
          // conteúdo bem curto: dá um leve aumento de fonte, mas nunca derrama
          const lastOne = best;
          scale = Math.min(1.3, scale * (0.90 / Math.max(fill, 0.1)));
          const r = await draw(scale);
          if (r.pages === 1) { best = r; continue; }
          best = lastOne;
          break;
        }
        break; // preenchimento aceitável (72%-99.5%)
      }

      // 2+ folhas: preencher bem a última folha (sem cortar conteúdo)
      const lastPageUsed = best.used - (best.pages - 1) * usable;
      const lastFill = lastPageUsed / usable;

      if (lastFill < 0.80) {
        // última folha quase vazia: aumenta fonte/espaçamento para preenchê-la
        scale = Math.min(1.55, scale * (0.95 / Math.max(lastFill, 0.1)));
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