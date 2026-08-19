import { NextRequest, NextResponse } from 'next/server';
import { gerarCurriculoHTML, gerarCurriculoPDF } from '@/lib/resume-generator';
import { Job } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, jobUrl, jobDescription, jobTitle, companyName, location, format = 'html' } = body;

    let vaga: Job | undefined;

    // Se forneceu descrição manual da vaga, cria objeto Job ad-hoc
    if (jobDescription) {
      vaga = {
        id: `manual-${Date.now()}`,
        fonte: 'Manual',
        titulo: jobTitle || 'Vaga informada pelo usuário',
        empresa: companyName || '',
        local: location || 'Remoto',
        url: jobUrl || '#',
        descricao: jobDescription,
        data: new Date().toISOString(),
        brasileira: true,
      };
    } else if (jobId || jobUrl) {
      // Busca vaga existente nos resultados
      const vagas = await fetch(`${request.url.split('/api/resume')[0]}/api/jobs?dias=30`).then(r => r.json());
      vaga = (vagas.vagas || []).find((v: Job) => v.id === jobId || v.url === jobUrl);
    }

    const html = await gerarCurriculoHTML(vaga);

    if (format === 'pdf') {
      const pdf = await gerarCurriculoPDF(vaga);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="curriculo-${Date.now()}.pdf"`,
        },
      });
    }

    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="curriculo-${Date.now()}.html"`,
        },
      });
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Erro ao gerar currículo:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar currículo', detalhes: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const html = await gerarCurriculoHTML();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="curriculo-base.html"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar currículo:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar currículo', detalhes: String(error) },
      { status: 500 }
    );
  }
}