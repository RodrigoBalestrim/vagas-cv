'use client';

import { UserProfile, PROFILE_VAZIO } from './user-profile';

// Extrai dados de um currículo (texto puro) e devolve um UserProfile parcial.
// Determinístico via regex — não precisa de IA.

const SEP_SECAO = /(resumo|objetivo|skills|habilidades|compet[êe]ncias|projetos?|experi[êe]ncia|forma[cç][aã]o|educa[cç][aã]o|certifica(?:dos?|[cç][oõ]es)|idiomas|contato|dados pessoais|sobre)\s*[:]?/gi;

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
  // Exige que o "estado" seja 2 letras maiúsculas (PR, SP...) OU que a cidade
  // esteja em linha com vírgula — evita capturar "Front-End" de cargos.
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const l of linhas) {
    if (l.length > 90) continue;
    const m = l.match(/([A-ZÁ-Ú][a-zá-ú]+(?:\s+[A-ZÁ-Ú][a-zá-ú]+)?)\s*[-,]\s*([A-Z]{2}|[A-ZÁ-Ú][a-zá-ú]+)(?![a-zá-ú])/);
    if (m && !/End\b|\./.test(m[0])) return m[0].replace(/[-,]$/, '').trim();
  }
  return '';
}

function limparItem(s: string): string {
  return s.replace(/^[-•·\d.)\s]+/, '').trim();
}

function extrairProjetos(linhas: string[]): UserProfile['projetos'] {
  const out: UserProfile['projetos'] = [];
  let atual: { nome: string; periodo: string; descricao: string } | null = null;
  // Período de projeto: "Mar/2026 – Atual", "Jan/2025 – Dez/2025", "2025", "Mar/2026"
  const PERIODO = /\b((?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*\/\s*\d{4}|\d{4})\s*(?:–|-|a\s+)\s*(?:atual|(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*\/\s*\d{4}|\d{4})/i;
  for (const l of linhas) {
    const item = limparItem(l);
    if (!item) continue;
    const pm = item.match(PERIODO);
    if (pm) {
      if (atual) out.push(atual);
      // Remove parênteses/colchetes ao redor do período (ex.: "(Mar/2026 – Atual)")
      // para não sobrarem no nome nem na descrição.
      const antes = item.slice(0, pm.index).replace(/[—–|:(\s]+$/, '').replace(/[(\[]+$/, '').trim();
      const depois = item.slice((pm.index || 0) + pm[0].length).replace(/^[—–|:)\s]+/, '').replace(/^[)\]]+/, '').trim();
      atual = { nome: antes || item, periodo: pm[0].trim(), descricao: depois };
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
    // formato: Cargo — Empresa (Período) — Descrição
    const m3 = item.match(/^(.+?)\s*[—–|]\s*(.+?)\s*\((.+?)\)\s*(?:[—–]\s*(.+))?$/);
    // formato: Cargo — Empresa (Período)
    const m = item.match(/^(.+?)\s*[—–|]\s*(.+?)\s*\((.+?)\)\s*$/);
    const m2 = item.match(/^(.+?)\s*(?:[—–|]\s*(.+?))\s*$/);
    if (m3) {
      if (atual) out.push(atual);
      atual = { cargo: m3[1].trim(), empresa: m3[2].trim(), periodo: m3[3].trim(), descricao: m3[4]?.trim() || '' };
    } else if (m) {
      if (atual) out.push(atual);
      atual = { cargo: m[1].trim(), empresa: m[2].trim(), periodo: m[3].trim(), descricao: '' };
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
  // URLs podem ser quebradas no meio por quebras de linha OU espaços do PDF
  // (ex.: "https://github.com/ Rodrigo" vira "https://github.com/Rodrigo").
  // 1) Espaço logo após o domínio/barra de uma URL (mesma linha) — só cola se a
  //    parte antes do espaço termina com "/" E o próximo token tem "/" (URL real).
  texto = texto.replace(/(https?:\/\/[^\s]+\/)\s+(?=[a-zA-Z0-9][^\s]*\/)/gi, '$1');
  // 2) Quebra de linha no meio de uma URL (continuação parece parte de URL).
  texto = texto.replace(/https?:\/\/[^\s]*(?:\n(?=[a-z0-9./?=_:~%+-])\S+)*/g, m => m.replace(/\n/g, ''));

  const perfil: UserProfile = {
    ...PROFILE_VAZIO,
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
    // OBJETIVO → campo "objetivo"; RESUMO/SOBRE → campo "resumo" (separados no site)
    else if (/objetiv/i.test(t)) perfil.objetivo = sec.linhas.join(' ');
    else if (/resumo|sobre/i.test(t)) perfil.resumo = sec.linhas.join(' ');
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
    // pdf.js devolve os itens achatados (palavras, não linhas).
    // Agrupa por coordenada Y para reconstruir as linhas reais do PDF.
    const itens = content.items.filter((it: any) => typeof it.str === 'string' && it.str.trim());
    const linhas: string[] = [];
    let atual: string[] = [];
    let lastY: number | null = null;
    for (const it of itens as any[]) {
      const y = it.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        linhas.push(atual.join(' '));
        atual = [];
      }
      atual.push(it.str);
      lastY = y;
    }
    if (atual.length) linhas.push(atual.join(' '));
    texto += linhas.join('\n') + '\n';
  }
  return texto;
}

async function extrairTextoDoDOCX(file: File): Promise<string> {
  // mammoth roda no browser e extrai texto de arquivos .docx (Word).
  const mammoth = await import('mammoth/mammoth.browser');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

// Detecta o tipo pelo nome/extension do arquivo e extrai o texto bruto.
// Suporta: .pdf (pdfjs), .docx (mammoth), .txt/.md (leitura direta).
export async function extrairTextoDeArquivo(file: File): Promise<string> {
  const nome = (file.name || '').toLowerCase();

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Arquivo muito grande (máx. 15 MB).');
  }

  const ehDOCX = nome.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const ehPDF = nome.endsWith('.pdf') || file.type === 'application/pdf';
  if (ehDOCX) return extrairTextoDoDOCX(file);
  if (ehPDF) return extrairTextoDoPDF(file);
  // fallback: tenta ler como texto puro (.txt, .md, etc.)
  if (nome.endsWith('.txt') || nome.endsWith('.md') || file.type.startsWith('text/')) {
    return file.text();
  }
  throw new Error('Formato não suportado. Envie PDF, Word (.docx) ou TXT.');
}