// Limpeza depois de gravar uma aula em PRODUÇÃO: exclui as fichas que a
// própria gravação cadastrou (personagens do elenco fictício).
//
// Uso:
//   node scripts/aulas/limpar-gravacao.mjs            (simula: só lista)
//   node scripts/aulas/limpar-gravacao.mjs --aplicar  (exclui)
//
// Credencial: DIRECTUS_ADMIN_TOKEN_ARQUIVO (CAMINHO do arquivo com o token,
// nunca o token) e DIRECTUS_API_URL, no ambiente ou no .env.local.
// Nada é impresso além de id e nome do personagem.
//
// ┌─ TRAVAS ─────────────────────────────────────────────────────────────────┐
// │ • Só toca em beneficiária cujo CPF está no elenco.json E cujo nome é     │
// │   o do personagem dono daquele CPF. Uma pessoa real nunca casa os dois. │
// │ • No máximo 10 fichas por execução; acima disso, recusa e não apaga nada.│
// │ • Vínculos (atendimentos, tramitações, entregas, participações, CRAM…)  │
// │   só são apagados quando apontam para uma dessas fichas.                 │
// └──────────────────────────────────────────────────────────────────────────┘
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { carregarEnvLocal, lerJson, PASTA_AULAS } from "./lib.mjs";

carregarEnvLocal();

const APLICAR = process.argv.includes("--aplicar");
const MAXIMO = 10;
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) {
  console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO.");
  process.exit(1);
}
const TOKEN = readFileSync(arquivo, "utf8").trim();
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

// personagens com CPF: cpf → nome
const elenco = lerJson(join(PASTA_AULAS, "elenco.json"));
const porCpf = new Map();
const visitar = (v) => {
  if (Array.isArray(v)) v.forEach(visitar);
  else if (v && typeof v === "object") {
    if (typeof v.cpf === "string" && typeof v.nome === "string") porCpf.set(v.cpf.replace(/\D/g, ""), v.nome.trim());
    Object.values(v).forEach(visitar);
  }
};
visitar(elenco);
if (!porCpf.size) { console.log("elenco sem CPFs: nada a fazer"); process.exit(0); }

const filtro = encodeURIComponent(JSON.stringify({ cpf: { _in: [...porCpf.keys()] } }));
const r = await fetch(`${URL_}/items/beneficiarias?fields=id,nome_completo,cpf&limit=-1&filter=${filtro}`, { headers: H });
if (!r.ok) { console.error(`consulta falhou: ${r.status}`); process.exit(1); }
const achadas = (await r.json()).data ?? [];
const alvos = achadas.filter((b) => porCpf.get(String(b.cpf).replace(/\D/g, "")) === String(b.nome_completo).trim());
const ignoradas = achadas.length - alvos.length;

console.log(`fichas do elenco encontradas: ${alvos.length}${ignoradas ? ` (${ignoradas} com CPF do elenco mas outro nome — NÃO tocadas)` : ""}`);
for (const b of alvos) console.log(`  #${b.id} ${b.nome_completo}`);
if (alvos.length > MAXIMO) { console.error(`acima de ${MAXIMO}: recusado, nada apagado`); process.exit(1); }
if (!APLICAR) { console.log("simulação: nada apagado (use --aplicar)"); process.exit(0); }

const ids = alvos.map((b) => b.id);

// --so-sessao-gravada: só a sessão que a aula 6.3 cria ("Masculinidades"),
// no ciclo do elenco — para regravar a 6.3 sem duplicá-la.
if (process.argv.includes("--so-sessao-gravada")) {
  const q = encodeURIComponent(JSON.stringify({ nome_ciclo: { _eq: elenco.sala_azul.ciclo } }));
  const ciclos = ((await (await fetch(`${URL_}/items/salas_azul?fields=id&filter=${q}`, { headers: H })).json()).data ?? []).map((c) => c.id);
  if (ciclos.length) {
    const qs = encodeURIComponent(JSON.stringify({ _and: [{ sala_id: { _in: ciclos } }, { tema: { _eq: "Masculinidades" } }] }));
    const sessoes = ((await (await fetch(`${URL_}/items/ciclo_sessoes?fields=id&filter=${qs}`, { headers: H })).json()).data ?? []).map((x) => x.id);
    if (sessoes.length) {
      await apagarOnde("sessoes_presenca", { sessao_id: { _in: sessoes } }, "presenças da sessão gravada");
      await apagarOnde("ciclo_sessoes", { id: { _in: sessoes } }, "sessão gravada (Masculinidades)");
    }
  }
  process.exit(0);
}

// --so-participacoes: só as participações em evento das fichas do elenco
// (para regravar uma aula de eventos sem desfazer o resto da semeadura).
if (process.argv.includes("--so-participacoes")) {
  if (ids.length) await apagarOnde("participacoes_evento", { beneficiaria: { _in: ids } }, "participações em evento");
  process.exit(0);
}

async function apagarOnde(colecao, filtro, rotulo) {
  // nunca um _in vazio: no Directus ele não pode virar "todos"
  if (/"_in":\[\]/.test(JSON.stringify(filtro))) return;
  const q = encodeURIComponent(JSON.stringify(filtro));
  const r = await fetch(`${URL_}/items/${colecao}?fields=id&limit=-1&filter=${q}`, { headers: H });
  if (!r.ok) { console.log(`  ${rotulo}: consulta falhou (${r.status}) — pulado`); return; }
  const itens = (await r.json()).data ?? [];
  if (!itens.length) return;
  const d = await fetch(`${URL_}/items/${colecao}`, { method: "DELETE", headers: H, body: JSON.stringify(itens.map((i) => i.id)) });
  console.log(`  ${rotulo}: ${itens.length} ${d.ok ? "excluído(s)" : `falhou (${d.status})`}`);
}

// Vínculos primeiro (alguns são NO ACTION e travariam a exclusão da ficha).
if (ids.length) {
await apagarOnde("tramitacoes", { atendimento_pai: { beneficiaria: { _in: ids } } }, "tramitações");
await apagarOnde("atendimentos", { beneficiaria: { _in: ids } }, "atendimentos");
await apagarOnde("entregas_beneficios", { beneficiaria: { _in: ids } }, "entregas de benefício");
await apagarOnde("participacoes_evento", { beneficiaria: { _in: ids } }, "participações em evento");
await apagarOnde("inscricoes_curso", { beneficiaria: { _in: ids } }, "inscrições em curso");
await apagarOnde("disparos", { beneficiaria_id: { _in: ids } }, "disparos de WhatsApp");
await apagarOnde("cram_pia", { beneficiaria: { _in: ids } }, "PIA");
await apagarOnde("cram_atendimentos", { beneficiaria: { _in: ids } }, "atendimentos CRAM");

for (const b of alvos) {
  const d = await fetch(`${URL_}/items/beneficiarias/${b.id}`, { method: "DELETE", headers: H });
  console.log(`  #${b.id} → ${d.ok ? "excluída" : `falhou (${d.status})`}`);
}
}

// Eventos do elenco: pelo título EXATO (nenhum evento real tem esse nome).
const titulos = (elenco.eventos ?? []).map((e) => e.titulo);
if (titulos.length) {
  const q = encodeURIComponent(JSON.stringify({ nome: { _in: titulos } }));
  const r = await fetch(`${URL_}/items/eventos_campanhas?fields=id,nome&limit=-1&filter=${q}`, { headers: H });
  const eventos = r.ok ? ((await r.json()).data ?? []) : [];
  if (eventos.length > MAXIMO) { console.error(`eventos do elenco acima de ${MAXIMO}: recusado`); process.exit(1); }
  const idsEv = eventos.map((e) => e.id);
  if (idsEv.length) {
    await apagarOnde("participacoes_evento", { evento: { _in: idsEv } }, "participações nos eventos do elenco");
    await apagarOnde("equipe_evento", { evento: { _in: idsEv } }, "equipe dos eventos do elenco");
    for (const e of eventos) {
      const d = await fetch(`${URL_}/items/eventos_campanhas/${e.id}`, { method: "DELETE", headers: H });
      console.log(`  evento #${e.id} ${e.nome} → ${d.ok ? "excluído" : `falhou (${d.status})`}`);
    }
  }
}

// Escola do elenco: turma e curso pelo nome EXATO, com matrículas e chamadas.
{
  const q = (f) => encodeURIComponent(JSON.stringify(f));
  const ler = async (col, f) => { const r = await fetch(`${URL_}/items/${col}?fields=id&limit=-1&filter=${q(f)}`, { headers: H }); return r.ok ? ((await r.json()).data ?? []) : []; };
  const turmas = (await ler("escola_turmas", { nome: { _eq: elenco.escola.turma } })).map((t) => t.id);
  if (turmas.length) {
    await apagarOnde("escola_frequencia", { turma: { _in: turmas } }, "chamadas da turma do elenco");
    await apagarOnde("escola_matriculas", { turma: { _in: turmas } }, "matrículas da turma do elenco");
    await apagarOnde("escola_turmas", { id: { _in: turmas } }, "turma do elenco");
  }
  const cursos = (await ler("escola_cursos", { nome: { _eq: elenco.escola.curso } })).map((c) => c.id);
  if (cursos.length) await apagarOnde("escola_cursos", { id: { _in: cursos } }, "curso do elenco");

  // Sala Azul do elenco: ciclo pelo nome EXATO; participantes por CPF + nome.
  const ciclos = (await ler("salas_azul", { nome_ciclo: { _eq: elenco.sala_azul.ciclo } })).map((c) => c.id);
  const pessoasSA = elenco.participantes_sala_azul;
  const infr = [];
  for (const p of pessoasSA) for (const i of await ler("infratores", { _and: [{ cpf: { _eq: p.cpf } }, { nome_completo: { _eq: p.nome } }] })) infr.push(i.id);
  const parts = (await ler("participacoes_sala_azul", { _or: [{ sala: { _in: ciclos.length ? ciclos : [-1] } }, { infrator: { _in: infr.length ? infr : [-1] } }] })).map((p) => p.id);
  const sessoes = ciclos.length ? (await ler("ciclo_sessoes", { sala_id: { _in: ciclos } })).map((s) => s.id) : [];
  if (parts.length) await apagarOnde("sessoes_presenca", { participacao_id: { _in: parts } }, "presenças da Sala Azul do elenco");
  if (sessoes.length) await apagarOnde("sessoes_presenca", { sessao_id: { _in: sessoes } }, "presenças das sessões do elenco");
  if (parts.length) await apagarOnde("participacoes_sala_azul", { id: { _in: parts } }, "participações da Sala Azul do elenco");
  if (sessoes.length) await apagarOnde("ciclo_sessoes", { id: { _in: sessoes } }, "sessões do ciclo do elenco");
  if (ciclos.length) await apagarOnde("salas_azul", { id: { _in: ciclos } }, "ciclo do elenco");
  if (infr.length) await apagarOnde("infratores", { id: { _in: infr } }, "participantes do elenco");
}
