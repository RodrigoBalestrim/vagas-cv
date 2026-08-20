import { NextRequest, NextResponse } from 'next/server';
import { coletarVagas } from '@/lib/job-sources';
import { ranquear, PerfilScoring, detectarSenioridade } from '@/lib/scoring';
import profileData from '@/lib/profile.json';

// API GET /api/jobs?dias=&minScore=&brasil=&junior=&skills=&nivel=
// Busca vagas nas fontes externas, ranqueia pelo perfil e retorna
// os resultados agrupados por área (React Native, Full Stack, Next.js...).
// Parâmetros opcionais de personalização:
//   skills  — lista de skills do usuário separadas por vírgula (URL-encoded)
//   nivel   — nível alvo do usuário: jr | pleno | sr (se omitido, infere do cargo)
// Quando não há skills, usa o perfil padrão (profile.json).

// Garante que cada requisição (ex.: clique em "Atualizar") busque as fontes de novo
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Lê os filtros da query string (com valores padrão)
  const { searchParams } = new URL(request.url);
  const dias = parseInt(searchParams.get('dias') || '30', 10);
  const minScore = parseInt(searchParams.get('minScore') || '0', 10);
  const apenasBrasil = searchParams.get('brasil') === 'true';
  const soJunior = searchParams.get('junior') === 'true';

  try {
    // Perfil do usuário (personalização): skills separadas por vírgula + nível alvo
    const perfil: PerfilScoring | undefined = searchParams.get('skills')
      ? {
          skills: (searchParams.get('skills') || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          senioridade: (searchParams.get('nivel') as PerfilScoring['senioridade']) || undefined,
        }
      : undefined;

    // Keywords prioritárias do perfil para filtrar as fontes:
    // skills do usuário quando logado, senão as do profile.json
    const keywords = perfil?.skills?.length
      ? perfil.skills
      : profileData.palavras_chave_prioritarias;
    const vagas = await coletarVagas(dias, keywords);

    // Ranqueia: pontua cada vaga (score 0-100) e ordena
    let resultados = ranquear(vagas, perfil);

    // Filtro anti-ruído: exclui vagas que não são dev (marketing, vendas, RH, etc.)
    const NAO_DEV = /\b(sales|account manager|account executive|business development|recruiter|recruiting|marketing|brand protection|compliance|analyst|negotiator|infanteer|military|service desk|support specialist|customer success|customer service|head of|product strategy|revenue|bd assistant|gtm|accounting|finance|legal|hr |human resources|project manager|product manager|scrum master|designer|ui designer|ux designer|data scientist|data engineer|qa manual|tester|content reviewer|content writer|reviewer|data management|data analyst|accounting|operations|administrative|coordinator|assistant|specialist|counsel|paralegal|writer|editor|copywriter)\b/i;
    resultados = resultados.filter(v => !NAO_DEV.test(`${v.titulo} ${v.descricao.slice(0, 300)}`));

    // Filtro de score mínimo (ex.: só vagas com 60+)
    if (minScore > 0) {
      resultados = resultados.filter(v => (v.score ?? 0) >= minScore);
    }

    // Filtro "apenas Brasil"
    if (apenasBrasil) {
      resultados = resultados.filter(v => v.brasileira);
    }

    // Filtro "só júnior"
    if (soJunior) {
      // só vagas júnior: aceita se título/descrição NÃO tem senior/pleno
      const SENIOR = /(senior|s[eê]nior|pleno|plena|sr\.?|specialist|tech.?lead|staff|arquiteto|arquiteta|lead|especialista|expert|principal|mid[ -]?level|plenos)/i;
      const JR = /(j[uú]nior|jr\.?|estag|est[áa]gio|trainee|iniciante|entry|junior)/i;
      resultados = resultados.filter(v => {
        const titulo = v.titulo;
        const desc = v.descricao;
        const explicitoSenior = SENIOR.test(titulo) || SENIOR.test(desc.slice(0, 900));
        const explicitoJunior = JR.test(titulo);
        if (explicitoJunior) return true;          // título diz júnior → mantém
        if (explicitoSenior) return false;          // diz sênior/pleno → descarta
        return true;                                 // sem sinal → mantém (júnior pode não estar no título)
      });
    }

    // Agrupar por área (React Native, Full Stack, Next.js, etc.)
    const porGrupo = new Map<string, typeof resultados>();
    for (const vaga of resultados) {
      const chave = grupo(vaga.titulo);
      if (!porGrupo.has(chave)) porGrupo.set(chave, []);
      porGrupo.get(chave)!.push(vaga);
    }

    const grupos = [...porGrupo.entries()].map(([area, vagas]) => ({
      area,
      quantidade: vagas.length,
      vagas,
    }));

    return NextResponse.json({
      total: resultados.length,
      grupos,
      vagas: resultados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar vagas:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar vagas', detalhes: String(error) },
      { status: 500 }
    );
  }
}

// Classifica a vaga numa área pelo título (espelhado em lib/scoring.ts)
function grupo(titulo: string): string {
  const t = titulo.toLowerCase();
  if (/react native|\bexpo\b|mobile|android|ios/.test(t)) return 'React Native / Mobile';
  if (/full[ -]?stack/.test(t)) return 'Full Stack';
  if (/next\.js|nextjs/.test(t)) return 'Next.js';
  if (/node\.js|nodejs|back[ -]?end/.test(t)) return 'Node.js / Backend';
  if (/react|front[ -]?end/.test(t)) return 'Front-end React';
  return 'Outras JS';
}