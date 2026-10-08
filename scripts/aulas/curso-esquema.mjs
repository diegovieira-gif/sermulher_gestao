// Cria no Directus as coleções do Curso Sigma (player das vídeo-aulas dentro
// do SIGMA). Idempotente: coleção ou relação que já existe é mantida.
//
// Uso:
//   node scripts/aulas/curso-esquema.mjs            (mostra o que faria)
//   node scripts/aulas/curso-esquema.mjs --aplicar  (salva snapshot e cria)
//
// Credencial: DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO (caminho), no
// ambiente ou no .env.local. Snapshot do esquema em BACKUP_DIR (padrão:
// ~/Documents/backups-directus) antes de qualquer mudança.
//
//   curso_sigma_aulas     — uma linha por aula publicada (vídeo e capa ficam
//                           na biblioteca de arquivos, pasta "Curso Sigma").
//   curso_sigma_progresso — uma linha por usuária e aula: trechos assistidos,
//                           percentual, última posição.
//
// Nenhum perfil precisa de permissão nessas coleções: o SIGMA lê e grava com
// o token administrativo, sempre filtrando pela usuária da sessão.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { carregarEnvLocal } from "./lib.mjs";

carregarEnvLocal();
const APLICAR = process.argv.includes("--aplicar");
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) { console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO."); process.exit(1); }
const H = { Authorization: `Bearer ${readFileSync(arquivo, "utf8").trim()}`, "Content-Type": "application/json" };

async function api(caminho, opcoes = {}) {
  const r = await fetch(URL_ + caminho, { ...opcoes, headers: H });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method || "GET"} ${caminho} → ${r.status} ${JSON.stringify(corpo.errors?.[0]?.message ?? "")}`);
  return corpo.data;
}

const datas = [
  { field: "date_created", type: "timestamp", meta: { special: ["date-created"], interface: "datetime", readonly: true, hidden: true } },
  { field: "date_updated", type: "timestamp", meta: { special: ["date-updated"], interface: "datetime", readonly: true, hidden: true } },
];
const id = { field: "id", type: "integer", meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } };

const COLECOES = [
  {
    collection: "curso_sigma_aulas",
    meta: { icon: "smart_display", note: "Curso Sigma: vídeo-aulas exibidas no SIGMA", sort_field: "ordem" },
    schema: {},
    fields: [
      id,
      { field: "codigo", type: "string", meta: { interface: "input", note: "Número da aula na trilha, ex.: 1.2" }, schema: { is_nullable: false, is_unique: true } },
      { field: "modulo", type: "string", meta: { interface: "input", note: "Ex.: 1 — Beneficiárias, o coração do sistema" }, schema: { is_nullable: false } },
      { field: "titulo", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
      { field: "descricao", type: "text", meta: { interface: "input-multiline" } },
      { field: "video", type: "uuid", meta: { interface: "file", special: ["file"] } },
      { field: "capa", type: "uuid", meta: { interface: "file-image", special: ["file"] } },
      { field: "duracao_segundos", type: "integer", meta: { interface: "input" }, schema: { is_nullable: false, default_value: 0 } },
      { field: "ordem", type: "integer", meta: { interface: "input" }, schema: { is_nullable: false, default_value: 0 } },
      { field: "publicada", type: "boolean", meta: { interface: "boolean", special: ["cast-boolean"] }, schema: { is_nullable: false, default_value: false } },
      ...datas,
    ],
  },
  {
    collection: "curso_sigma_progresso",
    meta: { icon: "trending_up", note: "Curso Sigma: quanto cada usuária assistiu de cada aula" },
    schema: {},
    fields: [
      id,
      { field: "usuario", type: "uuid", meta: { interface: "select-dropdown-m2o", special: ["m2o"] }, schema: { is_nullable: false } },
      { field: "aula", type: "integer", meta: { interface: "select-dropdown-m2o", special: ["m2o"] }, schema: { is_nullable: false } },
      { field: "trechos", type: "json", meta: { interface: "input-code", special: ["cast-json"], note: "Intervalos assistidos, em segundos: [[início, fim], …]" } },
      { field: "posicao_segundos", type: "float", meta: { interface: "input", note: "Onde parou (para retomar)" }, schema: { default_value: 0 } },
      { field: "percentual", type: "float", meta: { interface: "input" }, schema: { is_nullable: false, default_value: 0 } },
      { field: "concluida", type: "boolean", meta: { interface: "boolean", special: ["cast-boolean"] }, schema: { is_nullable: false, default_value: false } },
      { field: "concluida_em", type: "timestamp", meta: { interface: "datetime" } },
      ...datas,
    ],
  },
];

const RELACOES = [
  { collection: "curso_sigma_aulas", field: "video", related_collection: "directus_files", schema: { on_delete: "SET NULL" } },
  { collection: "curso_sigma_aulas", field: "capa", related_collection: "directus_files", schema: { on_delete: "SET NULL" } },
  { collection: "curso_sigma_progresso", field: "usuario", related_collection: "directus_users", schema: { on_delete: "CASCADE" } },
  { collection: "curso_sigma_progresso", field: "aula", related_collection: "curso_sigma_aulas", schema: { on_delete: "CASCADE" } },
];

const existentes = new Set((await api("/collections")).map((c) => c.collection));
const relacoes = await api("/relations");
const temRelacao = (r) => relacoes.some((x) => x.collection === r.collection && x.field === r.field);

if (APLICAR) {
  const pasta = join(process.env.BACKUP_DIR || join(homedir(), "Documents", "backups-directus"),
    `${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}-antes-curso-sigma`);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, "schema-snapshot.json"), JSON.stringify(await api("/schema/snapshot"), null, 2));
  console.log(`snapshot do esquema: ${pasta}`);
}

for (const c of COLECOES) {
  if (existentes.has(c.collection)) { console.log(`= ${c.collection} já existe`); continue; }
  if (APLICAR) await api("/collections", { method: "POST", body: JSON.stringify(c) });
  console.log(`+ ${c.collection}${APLICAR ? "" : " (simulação)"}`);
}
for (const r of RELACOES) {
  if (temRelacao(r)) { console.log(`= relação ${r.collection}.${r.field}`); continue; }
  if (APLICAR) await api("/relations", { method: "POST", body: JSON.stringify(r) });
  console.log(`+ relação ${r.collection}.${r.field} → ${r.related_collection}${APLICAR ? "" : " (simulação)"}`);
}

// Pasta da biblioteca de arquivos onde ficam vídeos e capas.
const pastas = await api(`/folders?filter=${encodeURIComponent(JSON.stringify({ name: { _eq: "Curso Sigma" } }))}`);
if (pastas.length) console.log(`= pasta "Curso Sigma" (${pastas[0].id})`);
else if (APLICAR) console.log(`+ pasta "Curso Sigma" (${(await api("/folders", { method: "POST", body: JSON.stringify({ name: "Curso Sigma" }) })).id})`);
else console.log(`+ pasta "Curso Sigma" (simulação)`);
