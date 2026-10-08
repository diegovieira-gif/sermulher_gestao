// Semeia, em PRODUÇÃO, o elenco fictício que os roteiros dão como "já
// existente" antes de gravar um módulo. Tudo sai do elenco.json; nada real.
//
// Uso:
//   node scripts/aulas/semear-gravacao.mjs modulo1            (simula)
//   node scripts/aulas/semear-gravacao.mjs modulo1 --aplicar
//
// Credencial: DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO (caminho), no
// ambiente ou no .env.local. Desfazer: limpar-gravacao.mjs --aplicar.
//
// ┌─ TRAVAS ─────────────────────────────────────────────────────────────────┐
// │ • Idempotente: personagem que já existe (CPF do elenco) não é recriado.  │
// │ • Toda ficha semeada sai com "não receber mensagens" marcado: nenhuma    │
// │   campanha real dispara para os telefones fictícios.                     │
// └──────────────────────────────────────────────────────────────────────────┘
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { carregarEnvLocal, lerJson, PASTA_AULAS } from "./lib.mjs";

carregarEnvLocal();
const [etapa] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APLICAR = process.argv.includes("--aplicar");
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) { console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO."); process.exit(1); }
const H = { Authorization: `Bearer ${readFileSync(arquivo, "utf8").trim()}`, "Content-Type": "application/json" };

async function api(caminho, opcoes = {}) {
  const r = await fetch(URL_ + caminho, { ...opcoes, headers: H });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method || "GET"} ${caminho.split("?")[0]} → ${r.status} ${JSON.stringify(corpo.errors?.[0]?.message ?? "")}`);
  return corpo.data;
}
const primeiro = async (colecao) => (await api(`/items/${colecao}?fields=id&sort=id&limit=1`))?.[0]?.id ?? null;
const digitos = (t) => String(t ?? "").replace(/\D/g, "");

const elenco = lerJson(join(PASTA_AULAS, "elenco.json"));
const pessoa = (chave) => elenco.beneficiarias.find((b) => b.chave === chave);

/** Ficha de beneficiária a partir do elenco. `completa` preenche tudo. */
async function ficha(chave, { completa = false, minima = false } = {}) {
  const b = pessoa(chave);
  const base = { nome_completo: b.nome, cpf: b.cpf, nao_receber_mensagens: true };
  if (minima) return base;
  Object.assign(base, {
    data_nascimento: b.nascimento,
    telefone: digitos(b.telefone) || null,
    endereco: { cep: "", logradouro: "", numero: "", bairro: b.bairro ?? "", cidade: b.bairro ? "Aracaju" : "" },
  });
  if (completa) {
    Object.assign(base, {
      telefone_validado: true,
      email: `${chave}@exemplo.sigma.local`,
      contato: { melhor_turno_contato: "Manhã" },
      endereco: { cep: "49000000", logradouro: "Rua Exemplo", numero: "100", bairro: b.bairro, cidade: "Aracaju" },
      raca_cor_id: await primeiro("config_raca_cor"),
      estado_civil_id: await primeiro("config_estado_civil"),
      escolaridade_id: await primeiro("config_escolaridade"),
      situacao_trabalho_id: await primeiro("config_situacao_trabalho"),
      quantidade_filhos: "2",
      numero_cad_unico: "00000000000",
      perfil_socioeconomico: "Perfil fictício para vídeo-aula.",
    });
  }
  return base;
}

const ETAPAS = {
  // Módulo 1: Joana como a 1.1 deixou (nome + CPF), Marta completa, Ana e
  // Rita com o básico, Cláudia incompleta de propósito (1.2 e 7.2).
  modulo1: async () => [
    await ficha("joana", { minima: true }),
    await ficha("marta", { completa: true }),
    await ficha("ana"),
    await ficha("rita"),
    await ficha("claudia", { minima: true }),
  ],
};

/*
  Etapas que não criam fichas: rodam DEPOIS de aulas que já gravaram algo
  (ex.: a tramitação vai no atendimento que a 2.1 criou para a Joana).
  Tudo fica ligado a uma ficha do elenco, então a limpeza alcança.
*/
const ALEM_DAS_FICHAS = {
  // 2.3 mostra a demanda da Joana no quadro: uma tramitação aguardando.
  modulo2: async () => {
    const joana = (await api(`/items/beneficiarias?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _eq: pessoa("joana").cpf } }))}`))[0];
    if (!joana) throw new Error("Joana não existe: semeie o módulo 1 e grave a 2.1 antes");
    const atend = (await api(`/items/atendimentos?fields=id&sort=-id&limit=1&filter=${encodeURIComponent(JSON.stringify({ beneficiaria: { _eq: joana.id } }))}`))[0];
    if (!atend) throw new Error("a Joana não tem atendimento: grave a 2.1 antes");
    const ja = await api(`/items/tramitacoes?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ atendimento_pai: { _eq: atend.id } }))}`);
    if (ja.length) { console.log(`= tramitação já existe no atendimento #${atend.id}`); return; }
    const setor = (await api(`/items/setores?fields=id,nome&limit=-1`)).find((x) => /jur[ií]dic/i.test(x.nome));
    const t = {
      atendimento_pai: atend.id, tipo_demanda: "Jurídica", status_etapa: "Aguardando",
      setor_responsavel: setor?.id ?? null, data_recebimento: new Date().toISOString(),
      relato_tecnico: "Orientação sobre medida protetiva. Registro fictício de vídeo-aula.",
    };
    if (!APLICAR) { console.log(`+ tramitação no atendimento #${atend.id} (simulação)`); return; }
    const criada = await api("/items/tramitacoes", { method: "POST", body: JSON.stringify(t) });
    console.log(`+ tramitação #${criada.id} no atendimento #${atend.id}`);
  },

  // 3.2 e 3.5: o Agosto Lilás já existe, com vários dias, a partir de hoje.
  // (A Roda de Conversa NÃO é semeada: a 3.1 a cria.)
  modulo3: async () => {
    const ev = elenco.eventos.find((e) => e.chave === "agosto");
    const ja = await api(`/items/eventos_campanhas?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ nome: { _eq: ev.titulo } }))}`);
    if (ja.length) { console.log(`= ${ev.titulo} já existe`); return; }
    const tipo = (await api(`/items/config_tipos_evento?fields=id,nome&limit=-1`)).find((t) => /campanha/i.test(t.nome));
    const dia = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
    const e = {
      nome: ev.titulo, local: ev.local, tipo: "campanha", tipo_id: tipo?.id ?? null, recorrencia: "nao_recorrente",
      data_inicio: dia(0, 8), data_fim: dia(2, 17),
      descricao: "Ação de conscientização (evento fictício de vídeo-aula).",
    };
    if (!APLICAR) { console.log(`+ ${ev.titulo} (simulação)`); return; }
    const criado = await api("/items/eventos_campanhas", { method: "POST", body: JSON.stringify(e) });
    console.log(`+ evento #${criado.id} ${ev.titulo}`);
  },

  // Escola (5.1–5.4): curso e turma do elenco; Rita já matriculada (a 5.2
  // matricula a Ana).
  modulo5: async () => {
    const e = elenco.escola;
    const um = async (col, filtro) => (await api(`/items/${col}?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify(filtro))}`))[0];
    const hoje = new Date();
    const data = (n) => { const d = new Date(hoje); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    let curso = await um("escola_cursos", { nome: { _eq: e.curso } });
    if (!curso && APLICAR) curso = await api("/items/escola_cursos", { method: "POST", body: JSON.stringify({
      nome: e.curso, area_atuacao: "tecnologia", carga_horaria: 40, status: "ativo",
      descricao: "Curso fictício de vídeo-aula.", ementa: "Uso do celular, e-mail e serviços públicos digitais." }) });
    console.log(`${curso ? "=" : "+"} curso ${e.curso}${curso?.id ? ` #${curso.id}` : " (simulação)"}`);
    let turma = await um("escola_turmas", { nome: { _eq: e.turma } });
    if (!turma && APLICAR) turma = await api("/items/escola_turmas", { method: "POST", body: JSON.stringify({
      nome: e.turma, curso: curso.id, instrutor: e.instrutor, status: "em_andamento", turno: "Manhã",
      vagas: 20, capacidade_maxima: 20, sala_aula: "Sala 1", data_inicio: data(-30), data_fim: data(30) }) });
    console.log(`${turma ? "=" : "+"} turma ${e.turma}${turma?.id ? ` #${turma.id}` : " (simulação)"}`);
    const rita = await um("beneficiarias", { cpf: { _eq: pessoa("rita").cpf } });
    if (!rita) throw new Error("Rita não existe: semeie o módulo 1 antes");
    if (turma?.id && !(await um("escola_matriculas", { _and: [{ turma: { _eq: turma.id } }, { beneficiaria: { _eq: rita.id } }] }))) {
      if (APLICAR) await api("/items/escola_matriculas", { method: "POST", body: JSON.stringify({
        turma: turma.id, beneficiaria: rita.id, status: "ativa", data_matricula: data(-30) }) });
      console.log(`+ matrícula da Rita${APLICAR ? "" : " (simulação)"}`);
    }
  },

  // Depois da 5.2 (que matricula a Ana) e da 5.3: turma concluída, Ana
  // aprovada e o diário lançado, para a 5.4.
  modulo5b: async () => {
    const turma = (await api(`/items/escola_turmas?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ nome: { _eq: elenco.escola.turma } }))}`))[0];
    const ana = (await api(`/items/beneficiarias?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _eq: pessoa("ana").cpf } }))}`))[0];
    const mat = turma && ana && (await api(`/items/escola_matriculas?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ _and: [{ turma: { _eq: turma.id } }, { beneficiaria: { _eq: ana.id } }] }))}`))[0];
    if (!mat) throw new Error("a Ana não está matriculada: grave a 5.2 antes");
    if (APLICAR) await api(`/items/escola_matriculas/${mat.id}`, { method: "PATCH", body: JSON.stringify({ status: "aprovada", frequencia_percentual: 92, nota_final: 9 }) });
    console.log(`~ matrícula #${mat.id} da Ana: aprovada${APLICAR ? "" : " (simulação)"}`);
    // o certificado só sai de turma concluída
    if (APLICAR) await api(`/items/escola_turmas/${turma.id}`, { method: "PATCH", body: JSON.stringify({ status: "concluida", data_fim: new Date(Date.now() - 864e5).toISOString().slice(0, 10) }) });
    // diário com 4 aulas passadas: Ana 4 de 4 (aprovada), Rita 2 de 4 (reprovada)
    const rita = (await api(`/items/beneficiarias?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _eq: pessoa("rita").cpf } }))}`))[0];
    const ja = await api(`/items/escola_frequencia?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ turma: { _eq: turma.id } }))}`);
    if (ja.length) { console.log("= diário da turma já lançado"); return; }
    const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    for (const [n, ritaPresente] of [[28, true], [21, false], [14, true], [7, false]]) {
      for (const [b, presente] of [[ana.id, true], [rita.id, ritaPresente]]) {
        if (APLICAR) await api("/items/escola_frequencia", { method: "POST", body: JSON.stringify({ turma: turma.id, beneficiaria: b, data: dia(n), presente }) });
      }
      console.log(`+ chamada de ${dia(n)}${APLICAR ? "" : " (simulação)"}`);
    }
  },

  // Sala Azul (6.1–6.4): João e Pedro, o ciclo, as participações e duas
  // sessões passadas com chamada (a 6.3 cria a terceira, "Masculinidades").
  modulo6: async () => {
    const um = async (col, filtro) => (await api(`/items/${col}?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify(filtro))}`))[0];
    const niveis = await api(`/items/config_niveis_periculosidade?fields=id,nome&limit=-1`);
    const status = (await api(`/items/config_status_legal?fields=id,nome&limit=-1`)).find((s) => /cumprimento/i.test(s.nome));
    const hoje = new Date();
    const dia = (n) => { const d = new Date(hoje); d.setDate(d.getDate() + n); return d; };
    const ids = {};
    for (const p of elenco.participantes_sala_azul) {
      let inf = await um("infratores", { cpf: { _eq: p.cpf } });
      if (!inf && APLICAR) inf = await api("/items/infratores", { method: "POST", body: JSON.stringify({
        nome_completo: p.nome, cpf: p.cpf, numero_processo: p.processo,
        nivel_id: niveis.find((n) => n.nome === p.nivel_risco)?.id ?? null, status_legal_id: status?.id ?? null,
        data_nascimento: "1985-01-01" }) });
      ids[p.chave] = inf?.id;
      console.log(`${inf ? "=" : "+"} participante ${p.nome}${inf?.id ? ` #${inf.id}` : " (simulação)"}`);
    }
    const c = elenco.sala_azul;
    let ciclo = await um("salas_azul", { nome_ciclo: { _eq: c.ciclo } });
    if (!ciclo && APLICAR) ciclo = await api("/items/salas_azul", { method: "POST", body: JSON.stringify({
      nome_ciclo: c.ciclo, facilitador: c.facilitador, status: "Em Andamento",
      data_inicio: dia(-21).toISOString().slice(0, 10), data_termino: dia(35).toISOString().slice(0, 10) }) });
    console.log(`${ciclo ? "=" : "+"} ciclo ${c.ciclo}${ciclo?.id ? ` #${ciclo.id}` : " (simulação)"}`);
    if (!APLICAR || !ciclo?.id) return;
    const part = {};
    for (const [chave, inf] of Object.entries(ids)) {
      part[chave] = (await um("participacoes_sala_azul", { _and: [{ sala: { _eq: ciclo.id } }, { infrator: { _eq: inf } }] }))
        ?? await api("/items/participacoes_sala_azul", { method: "POST", body: JSON.stringify({ sala: ciclo.id, infrator: inf, status_participacao: "Cursando", frequencia_percentual: 0 }) });
    }
    const temas = [["Violência e cultura", -14, { joao: true, pedro: true }], ["Lei Maria da Penha", -7, { joao: true, pedro: false }]];
    for (const [tema, n, presenca] of temas) {
      let s = await um("ciclo_sessoes", { _and: [{ sala_id: { _eq: ciclo.id } }, { tema: { _eq: tema } }] });
      if (!s) {
        const d = dia(n); d.setHours(18, 0, 0, 0);
        s = await api("/items/ciclo_sessoes", { method: "POST", body: JSON.stringify({ sala_id: ciclo.id, tema, data: d.toISOString(), relatorio: "Sessão fictícia de vídeo-aula." }) });
        for (const [chave, presente] of Object.entries(presenca)) {
          await api("/items/sessoes_presenca", { method: "POST", body: JSON.stringify({ sessao_id: s.id, participacao_id: part[chave].id, presente }) });
        }
        console.log(`+ sessão "${tema}" #${s.id} com chamada`);
      }
    }
    // frequência gravada igual à calculada (2 de 2 e 1 de 2)
    await api(`/items/participacoes_sala_azul/${part.joao.id}`, { method: "PATCH", body: JSON.stringify({ frequencia_percentual: 100 }) });
    await api(`/items/participacoes_sala_azul/${part.pedro.id}`, { method: "PATCH", body: JSON.stringify({ frequencia_percentual: 50 }) });
  },
};

if (ALEM_DAS_FICHAS[etapa]) {
  await ALEM_DAS_FICHAS[etapa]();
  if (!APLICAR) console.log("simulação: nada gravado (use --aplicar)");
  process.exit(0);
}
if (!ETAPAS[etapa]) { console.error(`etapa desconhecida. Use: ${[...Object.keys(ETAPAS), ...Object.keys(ALEM_DAS_FICHAS)].join(", ")}`); process.exit(1); }
const fichas = await ETAPAS[etapa]();
const existentes = await api(`/items/beneficiarias?fields=id,cpf&limit=-1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _in: fichas.map((f) => f.cpf) } }))}`);
const jaTem = new Set(existentes.map((e) => digitos(e.cpf)));
for (const f of fichas) {
  if (jaTem.has(f.cpf)) { console.log(`= ${f.nome_completo} já existe`); continue; }
  if (!APLICAR) { console.log(`+ ${f.nome_completo} (simulação)`); continue; }
  const criada = await api("/items/beneficiarias", { method: "POST", body: JSON.stringify(f) });
  console.log(`+ #${criada.id} ${f.nome_completo}`);
}
if (!APLICAR) console.log("simulação: nada gravado (use --aplicar)");
