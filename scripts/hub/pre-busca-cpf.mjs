// Pré-busca de CPF no Hub de Dados, de uma vez, para a tela "Localizar CPF".
//
// Para as fichas SEM CPF que têm telefone E nascimento, busca candidatos no
// `hub/findCidadao` e grava em `beneficiarias.cpf_sugestoes`. NÃO grava CPF:
// a equipe confirma cada um na tela (Beneficiárias → Localizar CPF).
//
// Existe porque o servidor do SIGMA ainda não alcança o Hub (bloqueio de rede);
// roda numa máquina com VPN, que alcança o Directus e o Hub.
//
// Uso (simula por padrão; nada sai na tela além de contagens):
//   HUB_CONSULTA_TOKEN=... node scripts/hub/pre-busca-cpf.mjs
//   HUB_CONSULTA_TOKEN=... node scripts/hub/pre-busca-cpf.mjs --aplicar
//   --refazer   busca de novo fichas que já têm sugestões
//   --todas     também fichas só com telefone ou só com nascimento (busca
//               por nome + telefone / nome + nascimento)
//   --limite=N  processa no máximo N fichas
//
// Credenciais: DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO (.env.local);
// HUB_CONSULTA_TOKEN no ambiente da sessão (nunca em arquivo do repo).
import { readFileSync } from "node:fs";
import { carregarEnvLocal } from "../aulas/lib.mjs";
import { combinarCandidatos, consultasDaFicha, lerSugestoes, recortarFichaHub } from "../../src/lib/busca-cpf.ts";

carregarEnvLocal();
const argv = process.argv.slice(2);
const APLICAR = argv.includes("--aplicar");
const REFAZER = argv.includes("--refazer");
const TODAS = argv.includes("--todas");
const LIMITE = Number((argv.find((a) => a.startsWith("--limite=")) ?? "").split("=")[1]) || Infinity;

const D = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const DT = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO ? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO, "utf8").trim() : "";
const HUB = process.env.HUB_CONSULTA_TOKEN?.trim();
const HUB_URL = process.env.HUB_BUSCA_URL || "https://portal.educacao.aju.br/webservice/hub/findCidadao";
const HUB_FICHA_URL = process.env.HUB_CONSULTA_URL || "https://portal.educacao.aju.br/webservice/hub/cidadao";
if (!D || !DT || !HUB) {
  console.error("Defina DIRECTUS_API_URL, DIRECTUS_ADMIN_TOKEN_ARQUIVO (.env.local) e HUB_CONSULTA_TOKEN (sessão).");
  process.exit(1);
}

async function directus(caminho, opcoes = {}) {
  const r = await fetch(D + caminho, {
    ...opcoes,
    headers: { Authorization: `Bearer ${DT}`, "Content-Type": "application/json" },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method || "GET"} ${caminho.split("?")[0]} → ${r.status}`);
  return j.data;
}

async function buscarNoHub(filtros) {
  const r = await fetch(HUB_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${HUB}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(filtros),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => null);
  if (r.status === 401 || r.status === 403) throw new Error("Hub recusou a chave");
  if (j?.status === "success") return { data: j.data ?? [], truncado: !!j.truncado };
  if (j?.status === "not found") return { data: [], truncado: false };
  throw new Error(`Hub: ${j?.message || "HTTP " + r.status}`);
}

/** Ficha do Hub de um candidato, recortada (nome da mãe, nascimento, endereço). */
async function fichaDoHub(cpf) {
  const r = await fetch(`${HUB_FICHA_URL.replace(/\/+$/, "")}/${cpf}`, {
    headers: { Authorization: `Bearer ${HUB}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 401 || r.status === 403) throw new Error("Hub recusou a chave");
  return recortarFichaHub(await r.json().catch(() => null));
}

/** Guarda a ficha do Hub nos candidatos de nome conferido que ainda não têm. */
async function anexarFichas(sug) {
  let n = 0;
  for (const c of sug.candidatos) {
    if (!c.nome_confere || c.hub_ficha) continue;
    c.hub_ficha = await fichaDoHub(c.cpf);
    if (c.hub_ficha) n++;
    await new Promise((ok) => setTimeout(ok, 300));
  }
  return n;
}

const filtro = {
  _and: [
    { _or: [{ cpf: { _null: true } }, { cpf: { _empty: true } }] },
    ...(TODAS
      ? [{ _or: [{ telefone: { _nnull: true, _nempty: true } }, { data_nascimento: { _nnull: true } }] }]
      : [{ telefone: { _nnull: true, _nempty: true } }, { data_nascimento: { _nnull: true } }]),
  ],
};
const fichas = await directus(
  `/items/beneficiarias?fields=id,nome_completo,telefone,data_nascimento,cpf_sugestoes&filter=${encodeURIComponent(JSON.stringify(filtro))}&sort=id&limit=-1`,
);

const t = { fichas: fichas.length, fichas_hub_anexadas: 0, enriquecidas: 0, puladas_ja_buscadas: 0, sem_busca_possivel: 0, buscadas: 0, com_candidatos: 0, candidatos: 0, com_nome_e_nasc_conferindo: 0, sem_resultado: 0, erros: 0 };
let feitas = 0;
for (const f of fichas) {
  if (feitas >= LIMITE) break;
  const existente = lerSugestoes(f.cpf_sugestoes);
  if (!REFAZER && existente) {
    // Já buscada: só completa a ficha do Hub dos candidatos pendentes.
    if (existente.situacao === "pendente" && existente.candidatos.some((c) => c.nome_confere && !c.hub_ficha)) {
      try {
        const n = await anexarFichas(existente);
        t.fichas_hub_anexadas += n;
        if (n) t.enriquecidas++;
        if (APLICAR && n) await directus(`/items/beneficiarias/${f.id}`, { method: "PATCH", body: JSON.stringify({ cpf_sugestoes: existente }) });
      } catch (e) { t.erros++; console.error(`ficha ${f.id}: ${e.message}`); }
    } else t.puladas_ja_buscadas++;
    continue;
  }
  const consultas = consultasDaFicha(f);
  if (!consultas.length) { t.sem_busca_possivel++; continue; }
  feitas++;
  try {
    const resultados = [];
    for (const c of consultas) {
      const r = await buscarNoHub(c.filtros);
      resultados.push({ rotulo: c.rotulo, ...r });
      await new Promise((ok) => setTimeout(ok, 500)); // gentil com o Hub
    }
    const sug = combinarCandidatos(f, resultados);
    t.fichas_hub_anexadas += await anexarFichas(sug);
    t.buscadas++;
    if (sug.candidatos.length) {
      t.com_candidatos++;
      t.candidatos += sug.candidatos.length;
      if (sug.candidatos.some((c) => c.nome_confere && c.nascimento_confere)) t.com_nome_e_nasc_conferindo++;
    } else t.sem_resultado++;
    if (feitas % 50 === 0) console.log(`… ${feitas} buscadas (${t.com_candidatos} com candidato)`);
    if (APLICAR) {
      await directus(`/items/beneficiarias/${f.id}`, { method: "PATCH", body: JSON.stringify({ cpf_sugestoes: sug }) });
    }
  } catch (e) {
    t.erros++;
    console.error(`ficha ${f.id}: ${e.message}`);
    if (/recusou/.test(e.message)) break;
  }
}
console.log(APLICAR ? "APLICADO:" : "SIMULAÇÃO (use --aplicar para gravar):", JSON.stringify(t));
