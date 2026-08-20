import { NextRequest, NextResponse } from 'next/server';
import { coletarVagas } from '@/lib/job-sources';
import { ranquear } from '@/lib/scoring';
import profileData from '@/lib/profile.json';

// API POST /api/rank — retorna os detalhes de match de UMA vaga específica
// (score, nível, keywords, alertas). Recebe { jobId } ou { jobUrl } no corpo.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, jobUrl } = body;

    // Re-busca as vagas (mesma lógica da listagem) para localizar a vaga
    const keywords = profileData.palavras_chave_prioritarias;
    const vagas = await coletarVagas(30, keywords);
    const ranqueadas = ranquear(vagas);

    const vaga = ranqueadas.find(v => v.id === jobId || v.url === jobUrl);

    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      vaga: {
        ...vaga,
        // Empacota os campos de match para o front consumir sem surpresa
        matchDetails: {
          score: vaga.score,
          nivel: vaga.nivel,
          matchedKeywords: vaga.matchedKeywords,
          warnings: vaga.warnings,
          coreNoTitulo: vaga.coreNoTitulo,
          temCore: vaga.temCore,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao ranquear vaga:', error);
    return NextResponse.json(
      { error: 'Falha ao ranquear', detalhes: String(error) },
      { status: 500 }
    );
  }
}