# ⚡ Vagas CV — Buscador de Vagas + Gerador de Currículo ATS

Plataforma web completa que **busca vagas** de desenvolvedor front-end/mobile em múltiplas fontes, **analisa a compatibilidade** do seu perfil com cada vaga e **gera currículos ATS-friendly** (HTML e PDF) prontos para download.

> **ATS** (Applicant Tracking System) são os sistemas que recrutadores usam para filtrar currículos automaticamente. Um currículo "ATS-friendly" tem formatação simples, sem tabelas/imagens, e repete as palavras-chave da vaga.

---

## 🚀 Funcionalidades

| Recurso | Descrição |
| --- | --- |
| 🔍 **Busca de vagas** | Agrega vagas de 9+ fontes: GitHub (issues BR), Remotive, RemoteOK, WeWorkRemotely, Himalayas, Jobicy, WorkingNomads, Programathor e Vagas.com.br |
| 🎯 **Ranqueamento** | Cada vaga ganha um **score de 0 a 100** baseado no seu perfil (stack React/TypeScript/React Native/Supabase), com nível detectado (JR/PLENO/SR) e keywords que combinam |
| 📄 **Currículo ATS** | Gera currículo **customizado por vaga** — palavras-chave da descrição são injetadas naturalmente no texto |
| 🤖 **IA generativa** | Opcional: usa Claude/OpenAI para adaptar o currículo à vaga (estrutura XYZ nos bullets, sem inventar experiência) |
| 📊 **Compatibilidade** | Explica em texto por que o score é baixo/médio/alto, listando requisitos cobertos e não cobertos |
| 👤 **Multi-usuário** | Login com Firebase Auth (e-mail/senha ou Google); cada usuário tem seu **perfil salvo no Firestore** |
| 📤 **Importar currículo** | Envie seu currículo em **PDF, Word (.docx) ou TXT** e o site preenche os campos automaticamente (parser determinístico por seções) |
| 💾 **Exportar** | Baixe o currículo em **PDF** (pdfkit) ou veja o **HTML** (pronto para Ctrl+P) |

---

## 🧱 Stack

- **Front-end:** Next.js (App Router), React, TypeScript
- **Estilização:** CSS puro com variáveis (`globals.css`)
- **Auth:** Firebase Authentication (e-mail/senha + Google)
- **Banco de dados:** Firestore (`perfis/{uid}` — cada usuário tem o próprio documento)
- **Backend:** API Routes do Next.js (server-side, com Firebase Admin SDK)
- **IA generativa (opcional):** endpoint Anthropic-compatível (Claude), configurável via env
- **PDF:** pdfkit (server-side) · **Leitura de PDF:** pdf.js · **Leitura de Word:** mammoth
- **Deploy:** Vercel

---

## 📁 Estrutura do projeto

```
src/
├── app/                    # Rotas (páginas) e API
│   ├── page.tsx            # Home
│   ├── vagas/              # Buscar vagas (cards ranqueados + filtros)
│   ├── curriculo/          # Gerar currículo (colar descrição da vaga)
│   ├── perfil/             # Editar/importar seu perfil
│   ├── login/              # Login/cadastro (e-mail ou Google)
│   ├── layout.tsx          # Layout raiz (HTML, fontes, AuthProvider)
│   ├── globals.css         # Tema, variáveis e estilos globais
│   └── api/                # API Routes (server-side)
│       ├── jobs/           # GET /api/jobs — busca e ranqueia vagas
│       ├── rank/           # POST /api/rank — detalhes de match de uma vaga
│       └── resume/         # POST /api/resume — gera currículo (HTML/PDF/match)
├── components/             # Componentes React reutilizáveis
│   ├── SiteHeader.tsx      # Barra de navegação compartilhada
│   ├── AuthProvider.tsx    # Contexto de autenticação (user, loading, logout)
│   ├── AuthStatus.tsx      # Avatar com dropdown (Meu Perfil / Sair)
│   ├── JobCard.tsx         # Card de vaga (score, badges, ações)
│   ├── FeatureCard.tsx     # Card da home (link com ícone)
│   └── ResumeModalContent.tsx # Modal de geração de currículo por vaga
├── lib/                    # Lógica de negócio
│   ├── firebase.ts         # Config do Firebase (client)
│   ├── user-profile.ts     # Tipos e perfil vazio/exemplo
│   ├── perfil-store.ts     # Ler/salvar perfil no Firestore
│   ├── parse-curriculo.ts  # Parser de currículo (PDF/Word/TXT → campos)
│   ├── resume-generator.ts # Geração de currículo (HTML/PDF/matcher/IA)
│   ├── scoring.ts          # Pontuação e ranqueamento de vagas
│   ├── job-sources.ts      # Coleta de vagas das fontes externas
│   ├── perfil-mestre.md    # Perfil base usado como referência pela IA (placeholders)
│   └── profile.json        # Keywords do perfil para ranqueamento
└── types/                  # Tipos TypeScript (Job, Profile, RankedJob)
```

---

## 🔑 Variáveis de ambiente

Crie um arquivo `.env.local` na raiz (não versionado):

```env
# Obrigatório para autenticação no backend (gerar currículo por vaga)
FIREBASE_SERVICE_ACCOUNT=<JSON do service account do Firebase Admin>

# Opcional — aumenta o rate limit do GitHub (60 → 5.000 req/h)
GH_PAT=<personal access token>

# Opcional — ativa a IA para customizar o currículo por vaga
ANTHROPIC_BASE_URL=<url do gateway>
ANTHROPIC_AUTH_TOKEN=<token>
AI_MODEL=<ex: kc/anthropic/claude-sonnet-4-20250514>
```

> O **Firebase client config** (`src/lib/firebase.ts`) contém apenas o `apiKey` público — isso é seguro e esperado (as regras de segurança do Firestore e a verificação de token no servidor protegem os dados).

---

## 🛡️ Segurança (por que é seguro publicar)

- **API `POST /api/resume` exige Bearer token** — o servidor valida o ID token do Firebase (`verifyIdToken`) e carrega o perfil **do próprio uid** (nunca confia no `body`).
- **Firestore rules** (owner-only): cada usuário só lê/escreve o documento `perfis/{uid}` dele.
- **Sanitização de perfil no servidor**: campos truncados (limite de tamanho) e só campos conhecidos são aceitos.
- **Escapamento de HTML** (`esc()`): conteúdo do perfil é escapado antes de entrar no currículo (anti-XSS).
- **Upload validado**: apenas `.pdf/.docx/.txt/.md`, máx. 15 MB.
- **Histórico do git limpo**: os dados pessoais foram removidos de todo o histórico com `git-filter-repo`.

---

## 🏃 Rodando localmente

```bash
npm install
npm run dev
# → http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

Typecheck:

```bash
npx tsc --noEmit
```

---

## ☁️ Deploy na Vercel

O projeto já está publicado em **https://vagas-cv.vercel.app**.

```bash
npx vercel --prod --yes
```

Configure as variáveis de ambiente acima em **Vercel → Project → Settings → Environment Variables** (Produção + Preview).

---

## 📜 Scripts auxiliares

Os scripts em `scripts/` são utilitários **locais** (fora do fluxo da web):

| Script | O que faz |
| --- | --- |
| `enviar-candidaturas.mjs` | Envia e-mails de candidatura para vagas (usa `nodemailer` + dados via env) |
| `gerar-curriculo-pdf.mjs` | Gera um PDF a partir de um `.txt` de currículo (usa `pdfkit`) |
| `extract-curriculo.mjs` | Extrai o texto de um PDF (usa `pdf.js`) — útil para conferir o que o parser vai ler |

> **Importante:** nenhum script contém dados pessoais — tudo vem de variáveis de ambiente ou argumentos.

---

## 📄 Licença

Uso pessoal/projeto autoral. Contato: **Rodrigo Balestrim**.