// Script local utilitário: extrai o texto de um PDF (via pdf.js) e imprime no terminal.
// Uso: node scripts/extract-curriculo.mjs <caminho-do-pdf>
// Serve para conferir como o parser (src/lib/parse-curriculo.ts) vai ler o arquivo.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";

// Lê o PDF passado como argumento (default: curriculo.pdf na pasta atual)
const buf = fs.readFileSync(process.argv[2] || "curriculo.pdf");
const doc = await getDocument({ data: new Uint8Array(buf), disableFontFace: true, useSystemFonts: true }).promise;
let out = "";
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const items = content.items;
  // Agrupa os itens por coordenada Y para reconstruir as linhas do PDF
  const byLine = new Map();
  for (const it of items) {
    if (!("str" in it) || !it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    if (!byLine.has(y)) byLine.set(y, []);
    byLine.get(y).push(it.str);
  }
  // Ordena de cima para baixo e junta as palavras de cada linha
  const lines = [...byLine.entries()].sort((a, b) => b[0] - a[0]).map(([, strs]) => strs.join(" "));
  out += lines.join("\n") + "\n";
}
console.log(out);
