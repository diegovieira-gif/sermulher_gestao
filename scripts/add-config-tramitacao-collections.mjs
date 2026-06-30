// Migração: coleções de configuração para o módulo de Tramitações.
//
// 1. config_tipos_demanda  → alimenta o dropdown "Tipo de Demanda".
//    Seeds: Jurídica, Terapia, Medida Protetiva, Exame.
// 2. config_status_etapa   → alimenta o dropdown "Status da Etapa" e as colunas do Kanban.
//    Seeds: Aguardando, Em atendimento, Finalizado.
//
// Estrutura de cada coleção: id (pk), nome (string), status (string, default "Ativo").
// Idempotente: pula coleção/campos já existentes e só insere seeds se a coleção estiver vazia.
//
// Uso: node scripts/add-config-tramitacao-collections.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* sem .env.local: usa apenas process.env */
  }
}

loadEnvLocal();

const URL_BASE = (
  process.env.DIRECTUS_API_URL ||
  process.env.DIRECTUS_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  ""
).replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN || "";

if (!URL_BASE || !TOKEN) {
  console.error("❌ Defina DIRECTUS_API_URL e DIRECTUS_TOKEN (ou .env.local).");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const summary = { collectionsCreated: [], fieldsCreated: [], seeded: [], skipped: [], errors: [] };

async function api(path, options = {}) {
  const res = await fetch(`${URL_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function collectionExists(name) {
  try {
    await api(`/collections/${name}`);
    return true;
  } catch (err) {
    if (err.status === 403 || err.status === 404) return false;
    throw err;
  }
}

async function ensureCollection(name, note) {
  if (await collectionExists(name)) {
    summary.skipped.push(`collection ${name}`);
    return;
  }
  await api("/collections", {
    method: "POST",
    body: JSON.stringify({
      collection: name,
      meta: { collection: name, hidden: false, singleton: false, note: note || null, sort_field: "nome" },
      schema: { name },
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "nome",
          type: "string",
          meta: { interface: "input", required: true, width: "full" },
          schema: { is_nullable: false },
        },
        {
          field: "status",
          type: "string",
          meta: { interface: "select-dropdown", width: "half", options: { choices: [
            { text: "Ativo", value: "Ativo" },
            { text: "Inativo", value: "Inativo" },
          ] } },
          schema: { default_value: "Ativo" },
        },
      ],
    }),
  });
  summary.collectionsCreated.push(name);
  summary.fieldsCreated.push(`${name}.nome`, `${name}.status`);
}

async function seedIfEmpty(name, nomes) {
  const existing = await api(`/items/${name}?fields[]=id&limit=1`).catch(() => ({ data: [] }));
  if ((existing.data || []).length > 0) {
    summary.skipped.push(`seed ${name} (já possui dados)`);
    return;
  }
  await api(`/items/${name}`, {
    method: "POST",
    body: JSON.stringify(nomes.map((nome) => ({ nome, status: "Ativo" }))),
  });
  summary.seeded.push(`${name}: ${nomes.join(", ")}`);
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);
  try {
    await ensureCollection("config_tipos_demanda", "Tipos de demanda das tramitações (dropdown 'Tipo de Demanda').");
    await seedIfEmpty("config_tipos_demanda", ["Jurídica", "Terapia", "Medida Protetiva", "Exame"]);
  } catch (err) {
    summary.errors.push(`config_tipos_demanda: ${err.message}`);
  }
  try {
    await ensureCollection("config_status_etapa", "Status das etapas de tramitação (dropdown e colunas do Kanban).");
    await seedIfEmpty("config_status_etapa", ["Aguardando", "Em atendimento", "Finalizado"]);
  } catch (err) {
    summary.errors.push(`config_status_etapa: ${err.message}`);
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors.length > 0) process.exitCode = 2;
  else console.log("\n✅ Migração concluída.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
