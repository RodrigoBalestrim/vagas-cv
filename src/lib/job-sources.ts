import { Job } from '@/types';

// Coletor de vagas: agrega vagas de múltiplas fontes públicas.
// Fontes brasileiras (GitHub repos BR, Programathor, Vagas.com, Novo Trampo)
// + internacionais (Remotive, RemoteOK, WeWorkRemotely, Himalayas, Jobicy,
// WorkingNomads). Cada fonte tem um adaptador (fonte*) que normaliza os
// dados para o tipo Job.

// Repositórios do GitHub com issues de vagas brasileiras
const REPOS_GITHUB = [
  'backend-br/vagas',
  'frontendbr/vagas',
  'react-brasil/vagas',
  'vuejs-br/vagas',
  'NestBR/vagas',
  'programadores-br/geral',
  'Empregos-dev/Vagas-dev',
  'techmagiccube/vagas',
  'seujobtech/vagas',
  'CangaceirosDevels/vagas_de_emprego',
  'devfsa/vagas',
  'developersRJ/vagas',
  'devmatogrosso/vagas',
];

// Keywords usadas para filtrar vagas relevantes ao perfil
const CORE_KEYWORDS = [
  'react native', 'expo', 'react', 'next.js', 'nextjs', 'typescript', 'javascript',
  'frontend', 'front-end', 'front end', 'mobile', 'android', 'fullstack', 'full-stack',
  'full stack', 'supabase', 'postgres', 'postgresql', 'api rest', 'rest api', 'apis rest',
];

const SECONDARY_KEYWORDS = [
  'tailwind', 'figma', 'acessibilidade', 'wcag', 'git', 'github actions', 'ci/cd', 'node', 'nodejs', 'node.js',
];

const PENALTIES = [
  'java', 'spring', '.net', 'c#', 'php', 'laravel', 'golang', 'ruby on rails',
  'senior', 'sênior', 'especialista', 'tech lead', 'staff', 'presencial',
  'care specialist', 'product strategy', 'revenue lead', 'sales', 'recruiter',
];

// Regex de stacks que não interessam (back-ends com outras linguagens)
const STACK_RUIM = /(\.\s?net\b|dotnet|asp\.net|c#|c\+\+|\bpython\b|django|flask|\bphp\b|laravel|\bjava\b|kotlin|golang|\bgo\b|\bruby\b|\brails\b|scala|elixir|\brust\b)/i;
// Regex para detectar vagas remotas
const REMOTE_REGEX = /(remoto|remote|home\s*-?office|anywhere|worldwide|global|latam|latin america)/;

// Regex de cargos que NÃO são de desenvolvimento (vendas, marketing, RH, suporte...)
const NAO_DEV = /\b(sales|account manager|account executive|business development|recruiter|recruiting|marketing|brand protection|compliance|analyst|analista|negotiator|infanteer|military|service desk|support specialist|customer success|customer service|head of|product strategy|revenue|bd assistant|gtm|accounting|finance|legal|hr |human resources|project manager|product manager|scrum master|designer|ui designer|ux designer|data scientist|data engineer|qa manual|tester|content reviewer|content writer|reviewer|data management|data analyst|operations|administrative|coordinator|coordenador|assistant|assistente|specialist|counsel|paralegal|writer|editor|copywriter|vendedor|atendente|auxiliar|recepcionista|caixa|estoquista)\b/i;

// Termos que indicam aceitação de candidatos do Brasil
const BRAZIL_POSITIVE = [
  'worldwide', 'anywhere', 'global', 'latam', 'latin america',
  'americas', 'south america', 'brazil', 'brasil',
];

function norm(s: string): string {
  return (s || '').toLowerCase();
}

// Verifica se o texto menciona que a vaga aceita Brasil
function aceitaBrasil(texto: string): boolean {
  const l = norm(texto);
  if (!l) return false;
  return BRAZIL_POSITIVE.some(p => l.includes(p));
}

// Detecta nível da vaga a partir do título
function nivel(titulo: string): 'jr' | 'pleno' | 'sr' | '?' {
  const t = ' ' + norm(titulo) + ' ';
  const jr = ['júnior', 'junior', 'estág', 'estagi', 'trainee', 'aprendiz', 'iniciante', ' jr ', ' jr.', '-jr', '/jr', 'entry', 'júnior', 'júnior', 'estagi'];
  const pl = ['pleno', 'plena', ' pl ', 'mid-level', 'mid level', ' mid ', 'plenos'];
  const sr = ['sênior', 'senior', 'sênior', 'senior', 'especialista', 'principal', 'tech lead', ' staff ', ' sr ', ' sr.', '-sr', ' lead ', 'arquiteto', 'arquiteta'];
  if (jr.some(x => t.includes(x))) return 'jr';
  if (pl.some(x => t.includes(x))) return 'pleno';
  if (sr.some(x => t.includes(x))) return 'sr';
  return '?';
}

// Filtra vagas que permitem trabalho remoto
function localOK(vaga: Job): boolean {
  return REMOTE_REGEX.test(norm(`${vaga.titulo} ${vaga.local} ${vaga.descricao}`));
}

// Remove tags HTML e entidades, normaliza espaços
function limpar(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Faz GET e devolve JSON (com cache desabilitado para sempre buscar atualizado)
async function pegarJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'vagas-cv', ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Faz GET e devolve texto puro
async function pegarTexto(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'vagas-cv' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Parser simples de RSS: extrai os blocos <item> e campos básicos
function parseRss(xml: string): any[] {
  const blocks = xml.split(/<item[ >]/i).slice(1);
  return blocks.map(b => {
    const grab = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    return {
      title: grab('title'),
      link: grab('link'),
      description: grab('description'),
      region: grab('region'),
      pubDate: grab('pubDate'),
    };
  });
}

async function fonteGitHub(repo: string, limiteData: number, keywords: string[]): Promise<Job[]> {
  // Busca issues abertas do repositório (ex.: frontendbr/vagas) que pareçam vagas
  const url = `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=100`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GH_PAT) headers.Authorization = `Bearer ${process.env.GH_PAT}`; // token opcional = mais req/h

  try {
    const issues = await pegarJson(url, headers);
    return issues
      .filter((i: any) => !i.pull_request && Date.parse(i.created_at) >= limiteData) // só issues novas
      .filter((i: any) => {
        const text = norm(`${i.title} ${i.body || ''}`);
        return keywords.some(k => text.includes(k)); // só as que mencionam o perfil
      })
      .map((i: any) => {
// limpa prefixos/sufixos comuns de localização do título
        // ex: "[REMOTO] Vaga X", "Vaga Y (Remoto)", "HOME OFFICE - Vaga Z"
        let titulo = i.title
          .replace(/^\[(remoto|home\s?office|presencial|hibrido|híbrido)\]\s*/i, '')
          .replace(/\s*\((remoto|home\s?office|presencial|hibrido|híbrido)\)\s*$/i, '')
          .replace(/^\s*[-–—]\s*(remoto|home\s?office|presencial|hibrido|híbrido)\b/gi, '')
          .replace(/\b(remoto|home\s?office|presencial|hibrido|híbrido)\s*[-–—]\s*$/i, '')
          .trim();
        return {
          id: `github-${repo}-${i.number}`,
          fonte: `GitHub/${repo.split('/')[0]}`,
          titulo,
          empresa: '',
          local: (i.labels || []).map((l: any) => l.name).join(', ') || 'Brasil',
          url: i.html_url,
          descricao: limpar(i.body).slice(0, 2500),
          data: i.created_at,
          brasileira: true,
        };
      });
  } catch (e) {
    console.warn(`GitHub/${repo} falhou:`, e);
    return [];
  }
}

async function fonteRemotive(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Remotive (API JSON de vagas remotas de software)
  try {
    const { jobs = [] } = await pegarJson('https://remotive.com/api/remote-jobs?category=software-dev&limit=100');
    return jobs
      .filter((j: any) => Date.parse(j.publication_date) >= limiteData)
      .filter((j: any) => {
        const text = norm(`${j.title} ${j.description || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((j: any) => ({
        id: `remotive-${j.id}`,
        fonte: 'Remotive',
        titulo: j.title,
        empresa: j.company_name || '',
        local: j.candidate_required_location || '',
        url: j.url,
        descricao: limpar(j.description).slice(0, 800),
        data: j.publication_date,
        brasileira: false,
      }));
  } catch (e) {
    console.warn('Remotive falhou:', e);
    return [];
  }
}

async function fonteRemoteOK(limiteData: number, keywords: string[]): Promise<Job[]> {
  // RemoteOK (API JSON de vagas remotas)
  try {
    const arr = await pegarJson('https://remoteok.com/api');
    return arr
      .filter((j: any) => j && j.position && Date.parse(j.date) >= limiteData)
      .filter((j: any) => {
        const text = norm(`${j.position} ${j.description || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((j: any) => ({
        id: `remoteok-${j.id}`,
        fonte: 'RemoteOK',
        titulo: j.position,
        empresa: j.company || '',
        local: j.location || '',
        url: j.url,
        descricao: limpar(j.description).slice(0, 800),
        data: j.date,
        brasileira: false,
      }));
  } catch (e) {
    console.warn('RemoteOK falhou:', e);
    return [];
  }
}

async function fonteWWR(limiteData: number, keywords: string[]): Promise<Job[]> {
  // WeWorkRemotely (feed RSS de programação remota)
  try {
    const xml = await pegarTexto('https://weworkremotely.com/categories/remote-programming-jobs.rss');
    const items = parseRss(xml);
    return items
      .filter((i: any) => Date.parse(i.pubDate) >= limiteData)
      .filter((i: any) => {
        const text = norm(`${i.title} ${i.description || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((i: any) => ({
        id: `wwr-${i.link}`,
        fonte: 'WeWorkRemotely',
        titulo: limpar(i.title),
        empresa: '',
        local: i.region || '',
        url: i.link,
        descricao: limpar(i.description).slice(0, 800),
        data: i.pubDate,
        brasileira: false,
      }));
  } catch (e) {
    console.warn('WeWorkRemotely falhou:', e);
    return [];
  }
}

async function fonteHimalayas(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Himalayas (API JSON de vagas remotas)
  try {
    const data = await pegarJson('https://himalayas.app/jobs/api?limit=100');
    const jobs = data.jobs || data.data || [];
    return jobs
      .filter((j: any) => {
        const date = j.pubDate ? new Date(j.pubDate * 1000).toISOString() : new Date().toISOString();
        return Date.parse(date) >= limiteData;
      })
      .filter((j: any) => {
        const text = norm(`${j.title} ${j.description || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((j: any) => {
        const restr = Array.isArray(j.locationRestrictions) ? j.locationRestrictions.join(', ') : (j.locationRestrictions || '');
        return {
          id: `himalayas-${j.id}`,
          fonte: 'Himalayas',
          titulo: j.title || '',
          empresa: j.companyName || '',
          local: restr || 'Worldwide',
          url: j.applicationLink || j.url || '',
          descricao: limpar(j.description).slice(0, 800),
          data: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : new Date().toISOString(),
          brasileira: false,
        };
      })
      .filter((v: Job) => v.url);
  } catch (e) {
    console.warn('Himalayas falhou:', e);
    return [];
  }
}

async function fonteJobicy(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Jobicy (API JSON de vagas remotas)
  try {
    const data = await pegarJson('https://jobicy.com/api/v2/remote-jobs?count=50');
    const jobs = data.jobs || [];
    return jobs
      .filter((j: any) => Date.parse(j.pubDate || new Date().toISOString()) >= limiteData)
      .filter((j: any) => {
        const text = norm(`${j.jobTitle} ${j.jobDescription || j.jobExcerpt || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((j: any) => ({
        id: `jobicy-${j.id}`,
        fonte: 'Jobicy',
        titulo: j.jobTitle || '',
        empresa: j.companyName || '',
        local: j.jobGeo || '',
        url: j.url || '',
        descricao: limpar(j.jobExcerpt || j.jobDescription || '').slice(0, 800),
        data: j.pubDate || new Date().toISOString(),
        brasileira: false,
      }))
      .filter((v: Job) => v.url);
  } catch (e) {
    console.warn('Jobicy falhou:', e);
    return [];
  }
}

interface WorkingNomadsJob {
  id?: string | number;
  url?: string;
  title?: string;
  company?: string;
  company_name?: string;
  location?: string;
  description?: string;
  tags?: string;
  pub_date?: string;
  date?: string;
}

async function fonteWorkingNomads(limiteData: number, keywords: string[]): Promise<Job[]> {
  // WorkingNomads (API JSON de vagas remotas)
  try {
    const arr = await pegarJson('https://www.workingnomads.com/api/exposed_jobs/');
    return (arr as WorkingNomadsJob[])
      .filter((j: WorkingNomadsJob) => j && j.title && Date.parse(j.pub_date || j.date || '') >= limiteData)
      .filter((j: WorkingNomadsJob) => {
        const text = norm(`${j.title} ${j.description || j.tags || ''}`);
        return keywords.some(k => text.includes(k));
      })
      .map((j: WorkingNomadsJob) => ({
        id: `wnomads-${j.id || j.url}`,
        fonte: 'WorkingNomads',
        titulo: j.title || '',
        empresa: j.company_name || j.company || '',
        local: j.location || 'Worldwide',
        url: j.url || '',
        descricao: limpar(j.description || j.tags || '').slice(0, 800),
        data: j.pub_date || j.date || new Date().toISOString(),
        brasileira: false,
      }))
      .filter((v: Job) => v.url);
  } catch (e) {
    console.warn('WorkingNomads falhou:', e);
    return [];
  }
}

async function fonteProgramathor(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Programathor (site BR, sem API — faz web scraping das 3 primeiras páginas)
  const jobs: Job[] = [];
  for (let page = 1; page <= 3; page++) {
    try {
      const url = page === 1 ? 'https://programathor.com.br/jobs' : `https://programathor.com.br/jobs/page/${page}`;
      const html = await pegarTexto(url);
      const blocos = html.split(/class="cell-list /).slice(1);

      for (const bloco of blocos) {
        const href = (bloco.match(/href="(\/jobs\/[^"]+)"/) || [])[1];
        const titulo = limpar((bloco.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '').replace(/NOVA$/i, '').trim();
        if (!href || !titulo) continue;

        const spanVal = (cls: string) => {
          const m = bloco.match(new RegExp(`<span>.*?${cls}[^<]*</i>([^<]*)</span>`));
          return m ? m[1].trim() : '';
        };
        const empresa = spanVal('fa-briefcase');
        const local = spanVal('fa-map-marker-alt');
        const senioridade = spanVal('fa-chart-bar');
        const tags = [...bloco.matchAll(/tag-list[^>]*>([^<]+)</g)].map(m => m[1].trim()).join(', ');

        const descricao = limpar([titulo, senioridade, tags].filter(Boolean).join('. '));
        const text = norm(`${titulo} ${descricao} ${tags}`);
        if (!keywords.some(k => text.includes(k))) continue;

        jobs.push({
          id: `programathor-${href}`,
          fonte: 'Programathor',
          titulo,
          empresa,
          local: local || 'Brasil',
          url: `https://programathor.com.br${href}`,
          descricao: descricao.slice(0, 800),
          data: new Date().toISOString(),
          brasileira: true,
        });
      }
    } catch (e) {
      console.warn(`Programathor página ${page} falhou:`, e);
      break;
    }
  }
  return jobs;
}

async function fonteVagasComBr(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Vagas.com.br (site BR, sem API — faz web scraping da listagem)
  try {
    const html = await pegarTexto('https://www.vagas.com.br/vagas-de-desenvolvedor?ordenar_por=mais_recentes');
    const blocos = html.split(/<li class="vaga/).slice(1);
    const jobs: Job[] = [];

    for (const bloco of blocos) {
      const link = (bloco.match(/class="link-detalhes-vaga"[^>]*href="([^"]+)"/) || [])[1];
      const titulo = limpar((bloco.match(/<h2 class="cargo">[\s\S]*?title="([^"]+)"/) || [])[1] || '').replace(/^<mark>/, '');
      const empresa = limpar((bloco.match(/class="emprVaga">([\s\S]*?)<\/span>/) || [])[1] || '');
      const local = limpar((bloco.match(/class="vaga-local">[\s\S]*?<\/i>([\s\S]*?)<\/div>/) || [])[1] || '').trim();
      const dataStr = (bloco.match(/class="data-publicacao">[\s\S]*?<\/i>([\d/]+)/) || [])[1] || '';
      const desc = limpar((bloco.match(/class="detalhes">[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || '');

      if (!link || !titulo) continue;
      const [dd, mm, yyyy] = dataStr.split('/').map(Number);
      const data = dd && mm && yyyy ? new Date(yyyy, mm - 1, dd).toISOString() : new Date().toISOString();
      if (Date.parse(data) < limiteData) continue;

      const text = norm(`${titulo} ${desc} ${local}`);
      if (!keywords.some(k => text.includes(k))) continue;

      jobs.push({
        id: `vagascom-${link}`,
        fonte: 'Vagas.com',
        titulo,
        empresa,
        local: local || 'Brasil',
        url: `https://www.vagas.com.br${link}`,
        descricao: (desc || titulo).slice(0, 800),
        data,
        brasileira: true,
      });
    }
    return jobs;
  } catch (e) {
    console.warn('Vagas.com falhou:', e);
    return [];
  }
}

async function fonteNovoTrampo(limiteData: number, keywords: string[]): Promise<Job[]> {
  // Novo Trampo (site BR, sem API — faz web scraping das 5 primeiras páginas)
  const jobs: Job[] = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const url = page === 1 ? 'https://www.novotrampo.com.br/' : `https://www.novotrampo.com.br/vagas/${page}`;
      const html = await pegarTexto(url);
      const blocos = html.split(/class="po-sm-12 po-lg-4 po-p-1"/).slice(1);

      for (const bloco of blocos) {
        const link = (bloco.match(/class="title-container"[\s\S]*?href="(https:\/\/atracaodetalentos\.totvs\.app\/[^"]+)"/) || [])[1];
        const titulo = limpar((bloco.match(/title="([^"]+)"[\s\S]*?class="hiring-type"/) || [])[1] || '').trim();
        const empresa = limpar((bloco.match(/data-tooltip="([^"]+)"[\s\S]*?class="company-link"/) || [])[1] || '').trim();
        const local = limpar((bloco.match(/an-map-pin mr-4[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || '').trim();
        const regime = limpar((bloco.match(/an-briefcase mr-4[\s\S]*?<\/i>([\s\S]*?)<\/p>/) || [])[1] || '').trim();
        const tag = (bloco.match(/class="po-mr-1 tag tag-[a-z]+">([^<]+)</) || [])[1] || '';
        const dataStr = (bloco.match(/\b(\d{2}\/\d{2}\/\d{4})\b/) || [])[1] || '';

        if (!link || !titulo) continue;
        const [dd, mm, yyyy] = dataStr.split('/').map(Number);
        const data = dd && mm && yyyy ? new Date(yyyy, mm - 1, dd).toISOString() : new Date().toISOString();
        if (Date.parse(data) < limiteData) continue;

        const text = norm(`${titulo} ${empresa} ${local} ${tag}`);
        if (!keywords.some(k => text.includes(k))) continue;

        jobs.push({
          id: `novotrampo-${link.split('?')[0]}`,
          fonte: 'Novo Trampo (TOTVS)',
          titulo,
          empresa,
          local: `${local} · ${tag}`,
          url: link,
          descricao: [titulo, empresa, tag, regime].filter(Boolean).join('. ').slice(0, 500),
          data,
          brasileira: true,
        });
      }
    } catch (e) {
      console.warn(`Novo Trampo página ${page} falhou:`, e);
      break;
    }
  }
  return jobs;
}

// Ponto de entrada: coleta vagas de TODAS as fontes em paralelo,
// aplica filtros (aceita Brasil, é dev, remota, stack compatível, nível) e deduplica.
export async function coletarVagas(dias: number = 30, keywords: string[] = []): Promise<Job[]> {
  // Data-limite: só vagas publicadas nos últimos N dias
  const limiteData = Date.now() - dias * 24 * 60 * 60 * 1000;
  // Keywords padrão quando o chamador não informa (foco do perfil)
  const kw = keywords.length > 0 ? keywords : [
    'react native', 'expo', 'react', 'next.js', 'nextjs', 'typescript',
    'javascript', 'frontend', 'front-end', 'front end', 'mobile', 'android',
    'supabase', 'postgres', 'postgresql', 'sqlite', 'cloudflare', 'workers', 'd1', 'api', 'rest', 'tailwind', 'figma',
    'acessibilidade', 'wcag', 'git', 'github actions', 'ci/cd', 'fullstack',
    'full-stack', 'full stack', 'node.js', 'nodejs'
  ];

  // Executa todas as fontes em paralelo (Promise.allSettled: uma falha não derruba as outras)
  const resultados = await Promise.allSettled([
    ...REPOS_GITHUB.map(r => fonteGitHub(r, limiteData, kw)),
    fonteRemotive(limiteData, kw),
    fonteRemoteOK(limiteData, kw),
    fonteWWR(limiteData, kw),
    fonteHimalayas(limiteData, kw),
    fonteJobicy(limiteData, kw),
    fonteWorkingNomads(limiteData, kw),
fonteProgramathor(limiteData, kw),
    fonteVagasComBr(limiteData, kw),
    fonteNovoTrampo(limiteData, kw),
  ]);

  // Junta os resultados bem-sucedidos (logando o que falhou)
  const vagas: Job[] = [];
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`  Fonte ${i}: ${r.value.length} vagas`);
      vagas.push(...r.value);
    } else {
      console.warn(`  Fonte ${i} falhou:`, r.reason);
    }
  });

  // Filtros
  const filtradas = vagas
    .filter(v => v.brasileira || aceitaBrasil(`${v.local} ${v.descricao}`)) // aceita Brasil
    .filter(v => !NAO_DEV.test(`${v.titulo} ${v.descricao}`))               // é vaga de dev
    .filter(localOK)                                                          // remota
    .filter(v => !STACK_RUIM.test(`${v.titulo} ${v.descricao}`))            // stack compatível
    .filter(v => nivel(v.titulo) !== 'sr')                                   // não é sênior
    .filter(v => nivel(v.titulo) !== 'pleno');                               // não é pleno

  // Deduplicar por URL
  const vistos = new Set<string>();
  const unicas = filtradas.filter(v => {
    if (!v.url || vistos.has(v.url)) return false;
    vistos.add(v.url);
    return true;
  });

  // Limita o total retornado para não estourar a resposta
  return unicas.slice(0, 120);
}
