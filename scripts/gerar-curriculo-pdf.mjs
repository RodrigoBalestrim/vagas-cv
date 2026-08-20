import fs from 'node:fs';
import PDFDocument from 'pdfkit';

const TEXTO = '<CAMINHO_LOCAL>curriculo-para-importar.txt';
const SAIDA = '<CAMINHO_LOCAL>curriculo-para-importar.pdf';

const linhas = fs.readFileSync(TEXTO, 'utf-8').replace(/\r\n/g, '\n').split('\n');

const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'Currículo - <NOME COMPLETO>' } });
const chunks = [];
doc.on('data', c => chunks.push(c));
doc.on('end', () => fs.writeFileSync(SAIDA, Buffer.concat(chunks)));

const FONTE_TITULO = 15;
const FONTE_CARGO = 10.5;
const FONTE_CONTATO = 8.5;
const FONTE_SECAO = 10.5;
const FONTE_ITEM = 9.5;
const FONTE_PAR = 9;

doc.font('Helvetica-Bold').fontSize(FONTE_TITULO).fillColor('#111111').text('<NOME COMPLETO>');
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(FONTE_CARGO).fillColor('#111111').text('Desenvolvedor Front-End Júnior');
doc.moveDown(0.15);
doc.font('Helvetica').fontSize(FONTE_CONTATO).fillColor('#333333').text(
  '<CIDADE, UF> · <EMAIL> · <TELEFONE>'
);
doc.font('Helvetica').fontSize(FONTE_CONTATO).fillColor('#333333').text(
  'GitHub: https://github.com/<usuario> · LinkedIn: https://www.linkedin.com/in/<usuario> · Portfólio: https://<portfolio>.vercel.app'
);

let secoes = ['OBJETIVO', 'RESUMO', 'SKILLS', 'PROJETOS', 'EXPERIÊNCIA', 'FORMAÇÃO', 'CERTIFICADOS', 'IDIOMAS'];
let secaoAtual = '';

function novaSecao(titulo) {
  doc.moveDown(0.7);
  doc.moveTo(48, doc.y).lineTo(595.28 - 48, doc.y).lineWidth(0.7).strokeColor('#bbbbbb').stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(FONTE_SECAO).fillColor('#111111').text(titulo);
  doc.moveDown(0.15);
}

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