import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DIAS = process.env.DIAS || '30';
const GMAIL_USER = process.env.GMAIL_USER || '<EMAIL>';
const GMAIL_PASS = process.env.GMAIL_PASS;
const DRY_RUN = process.env.DRY_RUN !== '0';
const TEST_MODE = process.env.TEST_MODE === '1';
const MAX_EMAILS = parseInt(process.env.MAX_EMAILS || '5', 10);
const CANDIDATO = {
  nome: '<NOME COMPLETO>',
  cidade: '<CIDADE, UF>',
  email: '<EMAIL>',
  telefone: '<TELEFONE>',
  github: 'https://github.com/<usuario>',
  linkedin: 'https://www.linkedin.com/in/<usuario>',
  portfolio: 'https://<portfolio>.vercel.app',
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function limpar(s = '') {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairEmails(descricao = '') {
  const encontrados = new Set();
  const ignorar = ['github.com', 'vercel.app', 'linkedin.com', 'gmail.com', 'hotmail.com', 'outlook.com'];
  const raw = descricao.replace(/<[^>]+>/g, ' ');
  for (const m of raw.matchAll(EMAIL_RE)) {
    const email = m[0].toLowerCase();
    if (ignorar.some(i => email.includes(i))) continue;
    encontrados.add(email);
  }
  return [...encontrados];
}

function extrairEmpresa(vaga) {
  const desc = vaga.descricao || '';
  const m = desc.match(/Sobre a empresa[^\n]*?\*\*([^*]{2,60})\*\*/i)
    || desc.match(/Sobre a empresa[^\n]*?\bA\s+([a-z0-9][a-z0-9.\-]{2,60})/i)
    || desc.match(/\*\*([A-Za-z0-9][A-Za-z0-9.\-]{2,60})\*\*/);
  if (m) {
    const nome = m[1].trim();
    if (nome) return nome;
  }
  return vaga.empresa || 'Recrutador(a)';
}

function montarEmail(vaga) {
  const empresa = extrairEmpresa(vaga);
  const titulo = vaga.titulo || 'Vaga de Desenvolvimento';
  const assunto = `Candidatura — ${titulo}`;
  const corpo = `Olá, equipe da ${empresa}!

Estou me candidatando à vaga de **${titulo}** que encontrei pelo link ${vaga.url}.

Meu nome é ${CANDIDATO.nome}, desenvolvedor front-end e mobile focado em React, React Native e TypeScript. Atuo 100% de forma remota e busco uma oportunidade como Desenvolvedor Front-End Júnior.

Alguns destaques do meu perfil:
- React, Next.js, TypeScript, JavaScript, HTML5, CSS3 e Tailwind CSS
- React Native com Expo (Expo Router, push notifications, EAS Build)
- Supabase/PostgreSQL, Cloudflare Workers e REST APIs
- Autor do Prazo Certo: app multiplataforma com autenticação, permissões por papel e IA generativa (Gemini/OpenAI)
- Portfólio 3D interativo com React e Three.js, publicado na Vercel

Meus links:
- GitHub: ${CANDIDATO.github}
- LinkedIn: ${CANDIDATO.linkedin}
- Portfólio: ${CANDIDATO.portfolio}

Segue meu currículo em anexo. Fico à disposição para uma conversa quando for conveniente.

Atenciosamente,
${CANDIDATO.nome}
${CANDIDATO.cidade} · ${CANDIDATO.email} · ${CANDIDATO.telefone}`;
  return { empresa, assunto, corpo };
}

function gerarCurriculoHTML(vaga) {
  const titulo = (vaga.titulo || 'Desenvolvedor Front-End Júnior').toUpperCase();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${CANDIDATO.nome} - Currículo</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; max-width: 780px; margin: 0 auto; padding: 32px 40px; color: #1a1a1a; line-height: 1.45; font-size: 13px; }
  h1 { font-size: 26px; margin: 0 0 2px; font-weight: 700; }
  .role { font-size: 13px; font-weight: 800; margin: 0 0 8px; text-transform: uppercase; }
  .contact { font-size: 11px; color: #333; margin: 2px 0 0; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin: 18px 0 8px; }
  .items p { margin: 0 0 5px; }
  .xp-row { display: flex; justify-content: space-between; font-weight: 600; font-size: 12.5px; margin-bottom: 3px; }
  .xp-date { font-weight: 600; font-size: 11px; color: #333; }
</style>
</head>
<body>
  <h1>${CANDIDATO.nome}</h1>
  <p class="role">${titulo}</p>
  <div class="contact"><span>${CANDIDATO.cidade} · ${CANDIDATO.email} · ${CANDIDATO.telefone} · GitHub: ${CANDIDATO.github} · LinkedIn: ${CANDIDATO.linkedin} · Portfólio: ${CANDIDATO.portfolio}</span></div>

  <section class="sec">
    <h2>Resumo</h2>
    <div class="items">
      <p>Desenvolvedor Front-End com experiência prática em React, TypeScript, Next.js e React Native, do design à publicação. Autor do Prazo Certo, aplicação multiplataforma com Supabase/PostgreSQL, autenticação, permissões por papel e IA generativa (Gemini/OpenAI). Portfólio 3D interativo com React, Three.js e Tailwind CSS, deploy na Vercel. Busco oportunidade remota como Desenvolvedor Front-End Júnior React.</p>
    </div>
  </section>

  <section class="sec">
    <h2>Experiência</h2>
    <div class="items">
      <div class="xp-row"><span>Projeto Prazo Certo</span><span class="xp-date">2025 – Atual</span></div>
      <p>Desenvolvimento full-stack com React Native, Expo, Supabase e IA generativa.</p>
      <div class="xp-row"><span>Portfólio 3D interativo</span><span class="xp-date">2025</span></div>
      <p>Site com React, Three.js, Framer Motion e Tailwind CSS publicado na Vercel.</p>
    </div>
  </section>

  <section class="sec">
    <h2>Stack</h2>
    <div class="items">
      <p>React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, React Native, Expo, Supabase, PostgreSQL, Cloudflare Workers, Git, GitHub Actions, Jest, Playwright.</p>
    </div>
  </section>
</body>
</html>`;
}

const SKILLS_PERFIL = [
  'React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Expo',
  'Expo Router', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Framer Motion',
  'Three.js', 'React Three Fiber', 'Swiper', 'Supabase', 'PostgreSQL',
  'APIs REST', 'Git', 'GitHub', 'Vercel', 'VS Code', 'Figma', 'Node.js',
  'GitHub Actions', 'CI/CD', 'Edge Functions', 'AsyncStorage',
  'Engenharia de Prompts', 'Gemini', 'OpenAI', 'Auth', 'Design Responsivo',
];

const KEYWORDS_GERAIS = [
  'componentes reutilizáveis', 'componentes', 'code review', 'code reviews',
  'estado', 'props', 'consumo de APIs', 'testes',
];

const normKey = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function extractJobKeywords(desc) {
  if (!desc) return [];
  const d = normKey(desc);
  const found = [];
  for (const skill of SKILLS_PERFIL) {
    if (d.includes(normKey(skill))) found.push(skill);
  }
  for (const g of KEYWORDS_GERAIS) {
    if (d.includes(normKey(g)) && !found.includes(g)) found.push(g);
  }
  const uniq = [];
  for (const kw of found) {
    const isSubterm = found.some(other => other !== kw && normKey(other).includes(normKey(kw)));
    if (!isSubterm) uniq.push(kw);
  }
  return uniq;
}

function gerarCurriculoPDF(vaga) {
  const titulo = (vaga.titulo || 'Desenvolvedor Front-End Júnior').toUpperCase();
  const keywords = extractJobKeywords(vaga.descricao || '');
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Currículo - ${CANDIDATO.nome}` } });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Helvetica-Bold').fontSize(17).fillColor('#111111').text(CANDIDATO.nome);
      doc.moveDown(0.1);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111111').text(titulo);
      doc.moveDown(0.1);
      doc.font('Helvetica').fontSize(7.5).fillColor('#333333').text(
        `${CANDIDATO.cidade} · ${CANDIDATO.email} · ${CANDIDATO.telefone} · GitHub: ${CANDIDATO.github} · LinkedIn: ${CANDIDATO.linkedin} · Portfólio: ${CANDIDATO.portfolio}`
      );

      const section = (t) => {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111111').text(t);
        doc.moveDown(0.03);
        doc.moveTo(36, doc.y).lineTo(559, doc.y).lineWidth(0.7).strokeColor('#dddddd').stroke();
        doc.moveDown(0.15);
        doc.font('Helvetica').fontSize(8.5).fillColor('#111111');
      };
      const bullet = (t) => { doc.text('•  ' + t, { lineGap: 1 }); doc.moveDown(0.05); };

      section('Objetivo');
      doc.text(
        'Desenvolvedor Front-End Júnior em React/Next.js buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.',
        { lineGap: 1 }
      );

      section('Resumo');
      doc.text(
        'Desenvolvedor Front-End com experiência prática em React, TypeScript, Next.js e React Native, do design à publicação. Autor do Prazo Certo, aplicação multiplataforma com Supabase/PostgreSQL, autenticação, permissões por papel e IA generativa (Gemini/OpenAI). Portfólio 3D interativo com React, Three.js e Tailwind CSS, deploy na Vercel. Uso diário de IA generativa e engenharia de prompts. Busco oportunidade remota como Desenvolvedor Front-End Júnior React.' +
        (keywords.length ? ` Alinhado aos requisitos da vaga: ${keywords.slice(0, 6).join(', ')}.` : ''),
        { lineGap: 1 }
      );

      section('Skills');
      if (keywords.length) bullet('Foco da vaga: ' + keywords.join(', '));
      const skillsList = [
        'React', 'TypeScript', 'Next.js', 'JavaScript (ES6+)', 'React Native, Expo',
        'HTML5, CSS3', 'Tailwind CSS, Bootstrap', 'Three.js, React Three Fiber, Framer Motion',
        'APIs REST', 'REST API', 'Supabase (PostgreSQL, Auth)', 'Git, GitHub, Vercel', 'Figma',
        'Testes', 'Responsive Design', 'Web Development', 'Front-end',
        'Engenharia de prompts (Gemini/OpenAI)',
      ];
      // duas colunas: skills distribuídas à esquerda e à direita na mesma linha
      for (let i = 0; i < skillsList.length; i += 2) {
        const left = skillsList[i];
        const right = skillsList[i + 1];
        const y = doc.y;
        doc.text('•  ' + left, 36, y);
        if (right) doc.text('•  ' + right, 300, y);
        doc.y = y + 9;
      }
      doc.moveDown(0.05);

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
}

async function main() {
  if (!GMAIL_PASS) {
    console.error('Faltou GMAIL_PASS (App Password do Gmail). Crie em https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  const transporter = DRY_RUN
    ? null
    : nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      });

  console.log(`Buscando vagas de ${DIAS} dias em ${API_URL}/api/jobs...`);
  const res = await fetch(`${API_URL}/api/jobs?dias=${DIAS}`);
  const data = await res.json();
  const vagas = data.vagas || [];

  // Modo teste: envia para o próprio email com uma vaga fixa, validando o anexo PDF
  if (TEST_MODE) {
    const vaga = vagas[0] || {
      titulo: 'Desenvolvedor Frontend Júnior React',
      empresa: 'Teste',
      url: 'https://vagas-cv.vercel.app',
      descricao: 'Vaga remota para desenvolvedor front-end júnior com React, TypeScript e Next.js. Consumo de APIs REST, testes e componentes reutilizáveis.',
    };
    const { empresa, assunto, corpo } = montarEmail(vaga);
    const pdfCurriculo = await gerarCurriculoPDF(vaga);

    if (DRY_RUN) {
      console.log('\n=== [DRY-RUN TESTE] NÃO enviado ===');
      console.log(`Para: ${GMAIL_USER}`);
      console.log(`Assunto: ${assunto}`);
      console.log(`Anexo PDF: ${pdfCurriculo.length} bytes, header ${pdfCurriculo.slice(0, 5).toString()}`);
      console.log(`Corpo (início): ${limpar(corpo).slice(0, 180)}...`);
      return;
    }

    const info = await transporter.sendMail({
      from: `"${CANDIDATO.nome}" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: assunto,
      text: corpo.replace(/\*\*/g, ''),
      html: corpo.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>'),
      attachments: [
        {
          filename: 'curriculo-rodrigo-balestrim.pdf',
          content: pdfCurriculo,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log(`OK email de teste enviado para ${GMAIL_USER}: ${info.messageId}`);
    return;
  }

  const alvos = vagas
    .map(v => ({ vaga: v, emails: extrairEmails(v.descricao) }))
    .filter(x => x.emails.length > 0);

  console.log(`Total vagas: ${vagas.length} | Com e-mail: ${alvos.length}`);
  for (const { vaga, emails } of alvos) {
    console.log(`  -> [${emails.join(', ')}] ${vaga.titulo} (${vaga.fonte})`);
  }

  if (alvos.length === 0) {
    console.log('Nenhuma vaga com e-mail encontrada. Nada a enviar.');
    return;
  }

  const enviar = alvos.slice(0, MAX_EMAILS);

  for (const { vaga, emails } of enviar) {
    const { empresa, assunto, corpo } = montarEmail(vaga);
    const pdfCurriculo = await gerarCurriculoPDF(vaga);

    if (DRY_RUN) {
      console.log('\n=== [DRY-RUN] NÃO enviado ===');
      console.log(`Para: ${emails.join(', ')}`);
      console.log(`Assunto: ${assunto}`);
      console.log(`Corpo (início): ${limpar(corpo).slice(0, 180)}...`);
      continue;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${CANDIDATO.nome}" <${GMAIL_USER}>`,
        to: emails.join(', '),
        subject: assunto,
        text: corpo.replace(/\*\*/g, ''),
        html: corpo.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>'),
        attachments: [
          {
            filename: 'curriculo-rodrigo-balestrim.pdf',
            content: pdfCurriculo,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log(`OK enviado para ${emails.join(', ')}: ${info.messageId}`);
    } catch (e) {
      console.error(`ERRO ao enviar para ${emails.join(', ')}: ${e.message}`);
    }

    // pausa entre envios para não parecer spam
    await new Promise(r => setTimeout(r, 8000));
  }

  console.log('\nConcluído.');
}

main().catch(e => {
  console.error('Falha geral:', e);
  process.exit(1);
});