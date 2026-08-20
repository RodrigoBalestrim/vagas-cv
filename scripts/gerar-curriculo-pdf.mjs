// Script local utilitário: converte um currículo em texto (.txt) para PDF (A4).
// Uso: node scripts/gerar-curriculo-pdf.mjs
// Env opcionais: CURRICULO_TEXTO=<arquivo.txt> e CURRICULO_SAIDA=<saida.pdf>
import fs from 'node:fs';
import PDFDocument from 'pdfkit';

// Arquivos de entrada/saída (configuráveis via env)
const TEXTO = process.env.CURRICULO_TEXTO || 'curriculo-para-importar.txt';
const SAIDA = process.env.CURRICULO_SAIDA || 'curriculo-para-importar.pdf';

// Lê as linhas do texto (normalizando quebras de linha do Windows)
const linhas = fs.readFileSync(TEXTO, 'utf-8').replace(/\r\n/g, '\n').split('\n');

// Cria o documento PDF A4 com margem de 48pt e acumula os chunks do buffer
const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'Currículo' } });
const chunks = [];
doc.on('data', c => chunks.push(c));
doc.on('end', () => fs.writeFileSync(SAIDA, Buffer.concat(chunks)));

// Tamanhos de fonte por tipo de conteúdo
const FONTE_TITULO = 15;
const FONTE_CARGO = 10.5;
const FONTE_CONTATO = 8.5;
const FONTE_SECAO = 10.5;
const FONTE_ITEM = 9.5;
const FONTE_PAR = 9;

// Cabeçalho: as 3 primeiras linhas do texto (nome / cargo / contato)
const cabecalho = fs.existsSync(TEXTO)
  ? linhas.slice(0, 3).filter(Boolean).join('\n')
  : '';

if (cabecalho) {
  doc.font('Helvetica-Bold').fontSize(FONTE_TITULO).fillColor('#111111').text(cabecalho.split('\n')[0]);
  doc.moveDown(0.2);
  const resto = cabecalho.split('\n').slice(1);
  doc.font('Helvetica-Bold').fontSize(FONTE_CARGO).fillColor('#111111').text(resto[0] || '');
  doc.moveDown(0.15);
  if (resto[1]) {
    doc.font('Helvetica').fontSize(FONTE_CONTATO).fillColor('#333333').text(resto[1]);
  }
}

// Seções reconhecidas no texto (linha com o nome exato vira título de seção)
let secoes = ['OBJETIVO', 'RESUMO', 'SKILLS', 'PROJETOS', 'EXPERIÊNCIA', 'FORMAÇÃO', 'CERTIFICADOS', 'IDIOMAS'];
let secaoAtual = '';

// Desenha um título de seção com linha separadora
function novaSecao(titulo) {
  doc.moveDown(0.7);
  doc.moveTo(48, doc.y).lineTo(595.28 - 48, doc.y).lineWidth(0.7).strokeColor('#bbbbbb').stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(FONTE_SECAO).fillColor('#111111').text(titulo);
  doc.moveDown(0.15);
}

// Percorre o texto linha a linha: seção → bullet (- ) → parágrafo
for (const linha of linhas) {
  const t = linha.trim();
  if (!t) continue;

  const ehSecao = secoes.find(s => s.toLowerCase() === t.toLowerCase());
  if (ehSecao) {
    novaSecao(ehSecao);
    secaoAtual = ehSecao;
    continue;
  }

  if (t.startsWith('- ')) {
    doc.font('Helvetica').fontSize(FONTE_ITEM).fillColor('#1a1a1a');
    const texto = t.slice(2).replace(/^[-•·\d.)\s]+/, '').trim();
    doc.text('• ' + texto, { width: 595.28 - 96, lineGap: 2 });
  } else {
    doc.font('Helvetica').fontSize(FONTE_PAR).fillColor('#1a1a1a');
    doc.text(t, { width: 595.28 - 96, lineGap: 2 });
  }
}

doc.end();
console.log('PDF gerado em', SAIDA);