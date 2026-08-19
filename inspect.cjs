const fs = require('fs');
const zlib = require('zlib');
const path = 'C:/Users/wbale/AppData/Local/Temp/opencode/curriculo-fullstack2.pdf';
const pdf = fs.readFileSync(path).toString('latin1');
let txt = '';
for (const m of pdf.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
  try { txt += zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch {}
}
// extrai operadores com texto e coordenadas
const blocks = [];
for (const m of txt.matchAll(/BT\s*1\s+0\s+0\s+1\s+([\d.]+)\s+([\d.]+)\s+Tm\s+([\s\S]*?)(?=ET)/g)) {
  const x = parseFloat(m[1]), y = parseFloat(m[2]);
  let s = '';
  for (const h of m[3].matchAll(/<([0-9a-f]+)>/g)) s += Buffer.from(h[1], 'hex').toString('latin1');
  s = s.replace(/\s+/g, ' ');
  blocks.push({ x: Math.round(x), y: Math.round(y), s: s.trim() });
}
blocks.sort((a, b) => b.y - a.y || a.x - b.x);
let last = null;
for (const b of blocks) {
  const overlap = last && last.y === b.y ? `  <-- MESMA LINHA` : '';
  console.log(`y=${b.y} x=${b.x}  ${b.s}${overlap}`);
  last = b;
}