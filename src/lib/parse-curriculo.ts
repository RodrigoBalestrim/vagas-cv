'use client';

import { UserProfile, PERFIL_RODRIGO } from './user-profile';

// Extrai dados de um currículo (texto puro) e devolve um UserProfile parcial.
// Determinístico via regex — não precisa de IA.

const SEP_SECAO = /(resumo|objetivo|skills|habilidades|compet[êe]ncias|projetos?|experi[êe]ncia|forma[cç][aã]o|educa[cç][aã]o|certifica[cç][oõ]es|idiomas|contato|dados pessoais|sobre)\s*[:]?/gi;

interface Secao {
  titulo: string;
  linhas: string[];
}

function quebrarSecoes(texto: string): Secao[] {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const secoes: Secao[] = [];
  let atual: Secao | null = null;
  let primeiro = true;

  for (const linha of linhas) {
    // A primeira linha "solta" que não é seção (nem contato) costuma ser o nome
    const m = linha.match(SEP_SECAO);
    const pareceSecao = m && (primeiro || /^[a-zà-ú]+$/i.test(linha.replace(SEP_SECAO, '').trim()) || linha.length < 40);
    if (m && pareceSecao) {
      atual = { titulo: linha.replace(SEP_SECAO, '').trim() || m[0], linhas: [] };
      secoes.push(atual);
    } else {
      if (!atual) {
        atual = { titulo: '', linhas: [] };
        secoes.push(atual);
      }
      atual.linhas.push(linha);
    }
    primeiro = false;
  }
  return secoes;
}

function extrairEmail(texto: string): string {
  const m = texto.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return m ? m[0] : '';
}

function extrairTelefone(texto: string): string {
  const m = texto.match(/\+?\d[\d\s().-]{8,}/);
  return m ? m[0].trim() : '';
}

function extrairURLs(texto: string): { github: string; linkedin: string; portfolio: string } {
  const urls = texto.match(/https?:\/\/[^\s)]+/g) || [];
  return {
    github: urls.find(u => /github\.com/i.test(u)) || '',
    linkedin: urls.find(u => /linkedin\.com/i.test(u)) || '',
    portfolio: urls.find(u => !/github\.com/i.test(u) && !/linkedin\.com/i.test(u)) || '',
  };
}

function extrairNome(texto: string): string {
  // Primeira linha não-vazia com 2-4 palavras e sem sinais de contato
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const l of linhas) {
    if (l.includes('@') || /github|linkedin|http|www\.|telefone|contato/i.test(l)) continue;
    const palavras = l.split(/\s+/);
    if (palavras.length >= 2 && palavras.length <= 5 && !/^(resumo|objetivo|skills|experi)/i.test(l)) {
      return l;
    }
  }
  return '';
}

function extrairCidade(texto: string): string {
  const m = texto.match(/(?:[A-ZÁ-Ú][a-zá-ú]+(?:\s+[A-ZÁ-Ú][a-zá-ú]+)?)\s*[-,]\s*([A-Z]{2}|[A-Za-zá-ú]+)\b/);
  if (m) return m[0];
  return '';
}

function limparItem(s: string): string {
  return s.replace(/^[-•·\d.)\s]+/, '').trim();
}

function extrairProjetos(linhas: string[]): UserProfile['projetos'] {
  const out: UserProfile['projetos'] = [];
  let atual: { nome: string; periodo: string; descricao: string } | null = null;
  for (const l of linhas) {
    const item = limparItem(l);
    if (!item) continue;
    const m = item.match(/^(.+?)\s*[—–|]\s*(.+)$/);
    if (m) {
      if (atual) out.push(atual);
      atual = { nome: m[1].trim(), periodo: m[2].trim(), descricao: '' };
    } else if (atual) {
      atual.descricao = atual.descricao ? atual.descricao + ' ' + item : item;
    }
  }
  if (atual) out.push(atual);
  return out;
}

function extrairExperiencia(linhas: string[]): UserProfile['experiencia'] {
  const out: UserProfile['experiencia'] = [];
  let atual: { cargo: string; empresa: string; periodo: string; descricao: string } | null = null;
  for (const l of linhas) {
    const item = limparItem(l);
    if (!item) continue;
    const m = item.match(/^(.+?)\s*(?:[—–|]\s*(.+?))?\s*\((.+?)\)\s*$/);
    const m2 = item.match(/^(.+?)\s*(?:[—–|]\s*(.+?))\s*$/);
    if (m) {
      if (atual) out.push(atual);
      atual = { cargo: m[1].trim(), empresa: m[2]?.trim() || '', periodo: m[3].trim(), descricao: '' };
    } else if (m2) {
      if (atual) out.push(atual);
      atual = { cargo: m2[1].trim(), empresa: m2[2].trim(), periodo: '', descricao: '' };
    } else if (atual && /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|\d{4})/i.test(item)) {
      atual.periodo = item;
    } else if (atual) {
      atual.descricao = atual.descricao ? atual.descricao + ' ' + item : item;
    }
  }
  if (atual) out.push(atual);
  return out;
}

function extrairFormacao(linhas: string[]): UserProfile['formacao'] {
  const out: UserProfile['formacao'] = [];
  for (const l of linhas) {
    const item = limparItem(l);
    if (!item) continue;
    const m = item.match(/^(.+?)\s*[—–|]\s*(.+?)\s*(?:\((.+?)\))?\s*$/);
    if (m) {
      out.push({ curso: m[1].trim(), instituicao: m[2].trim(), periodo: m[3]?.trim() || '' });
    } else {
      out.push({ curso: item, instituicao: '', periodo: '' });
    }
  }
  return out;
}

function extrairItems(linhas: string[]): string[] {
  return linhas.map(limparItem).filter(Boolean);
}

export function parseCurriculo(texto: string): UserProfile {
  const perfil: UserProfile = {
    ...PERFIL_RODRIGO,
    nome: '', resumo: '',
    skills: [], projetos: [], experiencia: [], formacao: [], certificados: [], idiomas: [],
  };
  const urls = extrairURLs(texto);
  perfil.email = extrairEmail(texto);
  perfil.telefone = extrairTelefone(texto);
  perfil.github = urls.github;
  perfil.linkedin = urls.linkedin;
  perfil.portfolio = urls.portfolio;
  perfil.cidade = extrairCidade(texto);

  const secoes = quebrarSecoes(texto);
  const textoNome = texto.split(/\r?\n/)[0] || '';
  perfil.nome = extrairNome(texto);

  for (const sec of secoes) {
    const t = sec.titulo.toLowerCase();
    if (/skill|habilidade|compet/i.test(t)) perfil.skills = extrairItems(sec.linhas);
    else if (/projet/i.test(t)) perfil.projetos = extrairProjetos(sec.linhas);
    else if (/experi/i.test(t)) perfil.experiencia = extrairExperiencia(sec.linhas);
    else if (/forma|curs|educa/i.test(t)) perfil.formacao = extrairFormacao(sec.linhas);
    else if (/certif/i.test(t)) perfil.certificados = extrairItems(sec.linhas);
    else if (/idioma/i.test(t)) perfil.idiomas = extrairItems(sec.linhas);
    else if (/resumo|objetivo|sobre/i.test(t)) perfil.resumo = sec.linhas.join(' ');
    else if (/contato|dados pessoais/i.test(t)) {
      if (!perfil.email) perfil.email = extrairEmail(sec.linhas.join(' '));
      if (!perfil.telefone) perfil.telefone = extrairTelefone(sec.linhas.join(' '));
    }
  }

  // Fallback: se não achou nome, tenta a primeira linha do texto
  if (!perfil.nome) perfil.nome = limparItem(textoNome);
  // se não achou resumo, usa texto do nome pra evitar duplicar
  if (!perfil.resumo) perfil.resumo = '';

  return perfil;
}

export async function extrairTextoDoPDF(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  try {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  } catch {
    // fallback: deixa o pdfjs tentar o worker padrão
  }
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const linhas = content.items
      .filter((it: any) => typeof it.str === 'string' && it.str.trim())
      .map((it: any) => it.str);
    // agrupa itens que estão na mesma linha (mesmo y aproximado) — fallback simples: junta com espaço
    texto += linhas.join(' ') + '\n';
  }
  return texto;
}