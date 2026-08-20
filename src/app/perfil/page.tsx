'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { carregarPerfil, salvarPerfil } from '@/lib/perfil-store';
import { UserProfile, PROFILE_VAZIO, PERFIL_RODRIGO } from '@/lib/user-profile';

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<UserProfile>(PROFILE_VAZIO);
  const [carregado, setCarregado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    (async () => {
      const p = await carregarPerfil(user.uid);
      if (p.nome) {
        setPerfil(p);
      } else {
        setPerfil(PERFIL_RODRIGO);
        setPreenchido(true);
      }
      setCarregado(true);
    })();
  }, [user, loading, router]);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setPerfil(prev => ({ ...prev, [key]: value }));
    setSalvo(false);
  };

  const salvar = async () => {
    if (!user) return;
    setSalvando(true);
    try {
      await salvarPerfil(user.uid, perfil);
      setSalvo(true);
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !carregado) {
    return <div className="page center">Carregando...</div>;
  }

  return (
    <div>
      <header className="site-header no-print">
        <div className="inner">
          <div className="brand">
            <span className="logo">⚡</span>
            Vagas CV
          </div>
          <nav className="site-nav">
            <a href="/" className="nav-link">Início</a>
            <a href="/vagas" className="nav-link">Buscar Vagas</a>
            <a href="/curriculo" className="nav-link">Gerar Currículo</a>
          </nav>
        </div>
      </header>

      <div className="page" style={{ maxWidth: '860px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Meu Perfil</h1>
            <p className="muted" style={{ margin: 0 }}>Seus dados aparecem no currículo ATS. Salve antes de gerar.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={salvar} disabled={salvando} className="btn btn-primary">
              {salvando ? 'Salvando...' : '💾 Salvar perfil'}
            </button>
            <a href="/curriculo" className="btn btn-outline">← Gerar currículo</a>
          </div>
        </header>

        {salvo && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            Perfil salvo com sucesso!
          </div>
        )}

        {preenchido && (
          <div className="alert alert-warn" style={{ marginBottom: '16px' }}>
            ⚠️ Este é o perfil de exemplo (<NOME COMPLETO>). Substitua pelos seus dados e clique em <strong>Salvar perfil</strong> para usar o seu.
          </div>
        )}

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Identificação</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Nome completo</label>
              <input className="input" value={perfil.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="field">
              <label>Cargo alvo</label>
              <input className="input" value={perfil.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Desenvolvedor Front-End Júnior" />
            </div>
            <div className="field">
              <label>Cidade / Localização</label>
              <input className="input" value={perfil.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: São Paulo, SP" />
            </div>
            <div className="field">
              <label>E-mail</label>
              <input className="input" value={perfil.email} onChange={e => set('email', e.target.value)} placeholder="voce@exemplo.com" />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" value={perfil.telefone} onChange={e => set('telefone', e.target.value)} placeholder="+55 11 99999-9999" />
            </div>
            <div className="field">
              <label>GitHub (URL)</label>
              <input className="input" value={perfil.github} onChange={e => set('github', e.target.value)} placeholder="https://github.com/voce" />
            </div>
            <div className="field">
              <label>LinkedIn (URL)</label>
              <input className="input" value={perfil.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/voce" />
            </div>
            <div className="field">
              <label>Portfólio (URL)</label>
              <input className="input" value={perfil.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="https://seu-portfolio.com" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Objetivo e Resumo</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="field">
              <label>Objetivo (frase curta)</label>
              <textarea className="textarea" rows={2} value={perfil.objetivo} onChange={e => set('objetivo', e.target.value)} placeholder="Ex: Desenvolvedor Front-End Júnior buscando oportunidade remota..." />
            </div>
            <div className="field">
              <label>Resumo profissional</label>
              <textarea className="textarea" rows={4} value={perfil.resumo} onChange={e => set('resumo', e.target.value)} placeholder="Seu resumo com palavras-chave de mercado..." />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Skills</h2>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>Uma skill por linha — vira uma linha no currículo (ATS-safe).</p>
          <div className="field">
            <textarea
              className="textarea"
              rows={8}
              value={perfil.skills.join('\n')}
              onChange={e => set('skills', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              placeholder={'React\nTypeScript\nNext.js'}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Projetos</h2>
          {perfil.projetos.map((pr, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '12px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field">
                  <label>Nome</label>
                  <input className="input" value={pr.nome} onChange={e => {
                    const projetos = [...perfil.projetos]; projetos[i] = { ...pr, nome: e.target.value }; set('projetos', projetos);
                  }} />
                </div>
                <div className="field">
                  <label>Período</label>
                  <input className="input" value={pr.periodo} onChange={e => {
                    const projetos = [...perfil.projetos]; projetos[i] = { ...pr, periodo: e.target.value }; set('projetos', projetos);
                  }} />
                </div>
              </div>
              <div className="field">
                <label>Descrição</label>
                <textarea className="textarea" rows={3} value={pr.descricao} onChange={e => {
                  const projetos = [...perfil.projetos]; projetos[i] = { ...pr, descricao: e.target.value }; set('projetos', projetos);
                }} />
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => set('projetos', perfil.projetos.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline" onClick={() => set('projetos', [...perfil.projetos, { nome: '', periodo: '', descricao: '' }])}>
            + Adicionar projeto
          </button>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Experiência</h2>
          {perfil.experiencia.map((e, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '12px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field">
                  <label>Cargo</label>
                  <input className="input" value={e.cargo} onChange={ev => {
                    const experiencia = [...perfil.experiencia]; experiencia[i] = { ...e, cargo: ev.target.value }; set('experiencia', experiencia);
                  }} />
                </div>
                <div className="field">
                  <label>Empresa</label>
                  <input className="input" value={e.empresa} onChange={ev => {
                    const experiencia = [...perfil.experiencia]; experiencia[i] = { ...e, empresa: ev.target.value }; set('experiencia', experiencia);
                  }} />
                </div>
              </div>
              <div className="field">
                <label>Período</label>
                <input className="input" value={e.periodo} onChange={ev => {
                  const experiencia = [...perfil.experiencia]; experiencia[i] = { ...e, periodo: ev.target.value }; set('experiencia', experiencia);
                }} />
              </div>
              <div className="field">
                <label>Descrição</label>
                <textarea className="textarea" rows={3} value={e.descricao} onChange={ev => {
                  const experiencia = [...perfil.experiencia]; experiencia[i] = { ...e, descricao: ev.target.value }; set('experiencia', experiencia);
                }} />
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => set('experiencia', perfil.experiencia.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline" onClick={() => set('experiencia', [...perfil.experiencia, { cargo: '', empresa: '', periodo: '', descricao: '' }])}>
            + Adicionar experiência
          </button>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Formação</h2>
          {perfil.formacao.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', marginBottom: '12px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field">
                  <label>Curso</label>
                  <input className="input" value={f.curso} onChange={ev => {
                    const formacao = [...perfil.formacao]; formacao[i] = { ...f, curso: ev.target.value }; set('formacao', formacao);
                  }} />
                </div>
                <div className="field">
                  <label>Instituição</label>
                  <input className="input" value={f.instituicao} onChange={ev => {
                    const formacao = [...perfil.formacao]; formacao[i] = { ...f, instituicao: ev.target.value }; set('formacao', formacao);
                  }} />
                </div>
              </div>
              <div className="field">
                <label>Período</label>
                <input className="input" value={f.periodo} onChange={ev => {
                  const formacao = [...perfil.formacao]; formacao[i] = { ...f, periodo: ev.target.value }; set('formacao', formacao);
                }} />
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => set('formacao', perfil.formacao.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
          ))}
          <button className="btn btn-sm btn-outline" onClick={() => set('formacao', [...perfil.formacao, { curso: '', instituicao: '', periodo: '' }])}>
            + Adicionar formação
          </button>
        </div>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Certificados e Idiomas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Certificados (um por linha)</label>
              <textarea className="textarea" rows={6} value={perfil.certificados.join('\n')} onChange={e => set('certificados', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} />
            </div>
            <div className="field">
              <label>Idiomas (um por linha)</label>
              <textarea className="textarea" rows={6} value={perfil.idiomas.join('\n')} onChange={e => set('idiomas', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <button onClick={salvar} disabled={salvando} className="btn btn-primary">
            {salvando ? 'Salvando...' : '💾 Salvar perfil'}
          </button>
        </div>
      </div>

      <footer className="site-footer no-print">
        Vagas CV · Currículo ATS multi-usuário
      </footer>
    </div>
  );
}