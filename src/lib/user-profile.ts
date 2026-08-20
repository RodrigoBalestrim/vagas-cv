export interface UserProfile {
  nome: string;
  cargo: string;
  cidade: string;
  email: string;
  telefone: string;
  github: string;
  linkedin: string;
  portfolio: string;
  objetivo: string;
  resumo: string;
  skills: string[];
  projetos: { nome: string; periodo: string; descricao: string }[];
  experiencia: { cargo: string; empresa: string; periodo: string; descricao: string }[];
  formacao: { curso: string; instituicao: string; periodo: string }[];
  certificados: string[];
  idiomas: string[];
}

export const PROFILE_VAZIO: UserProfile = {
  nome: '',
  cargo: 'Desenvolvedor Front-End Júnior',
  cidade: '<CIDADE, UF>',
  email: '',
  telefone: '',
  github: '',
  linkedin: '',
  portfolio: '',
  objetivo: '',
  resumo: '',
  skills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'HTML5', 'CSS3'],
  projetos: [],
  experiencia: [],
  formacao: [],
  certificados: [],
  idiomas: ['Português — nativo'],
};

export const PERFIL_RODRIGO: UserProfile = {
  nome: '<NOME COMPLETO>',
  cargo: 'Desenvolvedor Front-End Júnior',
  cidade: '<CIDADE, UF>',
  email: '<EMAIL>',
  telefone: '<TELEFONE>',
  github: 'https://github.com/<usuario>',
  linkedin: 'https://www.linkedin.com/in/<usuario>',
  portfolio: 'https://<portfolio>.vercel.app',
  objetivo: 'Desenvolvedor Front-End Júnior em React/Next.js buscando oportunidade remota para construir aplicações web e mobile escaláveis e com boa experiência de usuário.',
  resumo: 'Desenvolvedor Front-End com experiência prática em React, TypeScript, Next.js e React Native, do design à publicação. Autor do Prazo Certo, aplicação multiplataforma com Supabase/PostgreSQL, autenticação, permissões por papel e IA generativa (Gemini/OpenAI). Portfólio 3D interativo com React, Three.js e Tailwind CSS, deploy na Vercel. Uso diário de IA generativa e engenharia de prompts. Busco oportunidade remota como Desenvolvedor Front-End Júnior React.',
  skills: [
    'React', 'TypeScript', 'Next.js', 'JavaScript (ES6+)', 'React Native, Expo',
    'HTML5, CSS3', 'Tailwind CSS, Bootstrap', 'Three.js, React Three Fiber, Framer Motion',
    'APIs REST', 'Supabase (PostgreSQL, Auth)', 'Git, GitHub, Vercel', 'Figma',
    'Testes', 'Responsive Design', 'Web Development', 'Front-end',
    'Docker', 'Cloud (Vercel, AWS)', 'Metodologias Ágeis',
    'Engenharia de prompts (Gemini/OpenAI)',
  ],
  projetos: [
    {
      nome: 'Prazo Certo',
      periodo: 'Jan/2025 – Atual',
      descricao: 'Aplicativo multiplataforma (Android/Web) de gestão de validade de produtos com React Native, TypeScript, Expo e Supabase/PostgreSQL. Autenticação com 5 papéis de permissão (owner, admin, manager, stockist, viewer), leitor de código de barras EAN-13, notificações push, relatórios em PDF e suporte offline (AsyncStorage). Build de APK automatizado a cada atualização via GitHub Actions (CI/CD). Integração com IA generativa para reconhecimento de produto por imagem. Repositório: https://github.com/<usuario>/prazo-certo-app',
    },
    {
      nome: 'Prazo Certo Landing',
      periodo: 'Jan/2025',
      descricao: 'Landing page do Prazo Certo com Next.js e TypeScript. https://github.com/<usuario>/prazo-certo-landing',
    },
    {
      nome: 'Portfólio 3D Interativo',
      periodo: 'Jan/2025',
      descricao: 'Portfólio com Next.js, React, Three.js, React Three Fiber e Tailwind CSS, animações com Framer Motion, 100% responsivo, deploy na Vercel. https://<portfolio>.vercel.app',
    },
    {
      nome: 'Currículo HTML Bilíngue',
      periodo: 'Jan/2025',
      descricao: 'Currículo + portfólio responsivo com HTML, CSS e JavaScript. https://github.com/<usuario>/curriculo-html-rodrigo',
    },
  ],
  experiencia: [
    {
      cargo: 'Desenvolvedor Full Stack',
      empresa: 'Autônomo',
      periodo: 'Jan/2025 – Atual',
      descricao: 'Desenvolvimento autônomo de sites e aplicativos de ponta a ponta (front-end e back-end). Autor do Prazo Certo (React Native, TypeScript, Expo, Supabase/PostgreSQL, IA generativa, CI/CD), além de portfólio 3D, landing pages e currículo HTML bilíngue com deploy na Vercel.',
    },
    {
      cargo: 'Técnico de Informática',
      empresa: 'Autônomo',
      periodo: 'Jan/2014 – Dez/2024',
      descricao: 'Mais de 10 anos de experiência em atendimento ao cliente, diagnóstico e resolução de problemas técnicos, gestão do próprio negócio, suporte e organização.',
    },
  ],
  formacao: [
    { curso: 'Análise de Dados e Desenvolvimento', instituicao: 'UniCesumar', periodo: 'Jan/2022 – Dez/2024' },
    { curso: 'Análise e Projeto de Software', instituicao: 'IFRS / Aprenda Mais', periodo: 'Ago/2026' },
    { curso: 'Desenvolvimento Full Stack', instituicao: 'Programador BR', periodo: 'Jun/2021' },
    { curso: 'HTML/CSS', instituicao: 'Curso em Vídeo', periodo: 'Jun/2020' },
  ],
  certificados: [
    'Programação em Pares de IA com o GitHub Copilot',
    'Prompt Engineering: Aprenda a Conversar com uma IA Generativa',
  ],
  idiomas: [
    'Português — nativo',
    'Inglês — técnico (leitura de documentação)',
    'Espanhol — básico',
  ],
};