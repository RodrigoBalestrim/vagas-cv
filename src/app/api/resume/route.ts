import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { gerarCurriculoHTML, gerarCurriculoPDF, calcularCompatibilidade } from '@/lib/resume-generator';
import { UserProfile, PROFILE_VAZIO } from '@/lib/user-profile';
import { Job } from '@/types';

// Inicializa o Admin SDK uma única vez (server-side)
function adminApp() {
  if (getApps().length) return getApps()[0];
  const key = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado');
  return initializeApp({ credential: cert(JSON.parse(key)) });
}

async function userAutenticado(request: NextRequest): Promise<string | null> {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!token) return null;
    const decoded = await getAuth(adminApp()).verifyIdToken(token);
    return decoded.uid || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await userAutenticado(request);
    if (!uid) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

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

    // Carrega o perfil DO PRÓPRIO usuário autenticado (Firestore) — nunca do body.
    const doc = await getFirestore(adminApp()).collection('perfis').doc(uid).get();
    const perfilUsr: UserProfile = sanitizePerfil(doc.exists ? doc.data() : undefined) || PROFILE_VAZIO;

    const html = await gerarCurriculoHTML(vaga, perfilUsr);

    if (format === 'match') {
      return NextResponse.json(calcularCompatibilidade(body.jobDescription || vaga?.descricao));
    }

    if (format === 'pdf') {
      const pdf = await gerarCurriculoPDF(vaga, perfilUsr);
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

// Garante que só campos conhecidos do perfil sejam aceitos (evita campos arbitrários no PDF)
function sanitizePerfil(raw: any): UserProfile | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const str = (v: any) => (typeof v === 'string' ? v.slice(0, 5000) : '');
  const strArr = (v: any) => (Array.isArray(v) ? v.filter(x => typeof x === 'string').map(x => x.slice(0, 2000)).slice(0, 100) : []);
  const objArr = (v: any) =>
    Array.isArray(v)
      ? v.filter(x => x && typeof x === 'object').map(x => ({
          nome: str(x.nome), periodo: str(x.periodo), descricao: str(x.descricao),
          cargo: str(x.cargo), empresa: str(x.empresa), curso: str(x.curso), instituicao: str(x.instituicao),
        })).slice(0, 50)
      : [];
  return {
    nome: str(raw.nome),
    cargo: str(raw.cargo),
    cidade: str(raw.cidade),
    email: str(raw.email),
    telefone: str(raw.telefone),
    github: str(raw.github),
    linkedin: str(raw.linkedin),
    portfolio: str(raw.portfolio),
    objetivo: str(raw.objetivo),
    resumo: str(raw.resumo),
    skills: strArr(raw.skills),
    projetos: objArr(raw.projetos),
    experiencia: objArr(raw.experiencia),
    formacao: objArr(raw.formacao),
    certificados: strArr(raw.certificados),
    idiomas: strArr(raw.idiomas),
  };
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