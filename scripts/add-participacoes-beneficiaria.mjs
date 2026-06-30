// Migração: estrutura para registrar eventos e cursos que a beneficiária participou.
//
// 1. Cria a coleção `participacoes_evento` (beneficiaria ↔ eventos_campanhas).
// 2. Adiciona `beneficiaria` e `observacao` à coleção existente `inscricoes_curso`.
//
// Para cada campo relacional cria também o registro em /relations (necessário para o
// deep-read `evento.nome` / `curso.nome` funcionar no SDK, como em entregas_beneficios).
//
// Idempotente — pula coleções/campos/relações que já existem.
//
// Uso:
//   node scripts/add-participacoes-beneficiaria.mjs
//
// Lê DIRECTUS_API_URL/DIRECTUS_URL e DIRECTUS_TOKEN do ambiente ou do .env.local.
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

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

const summary = {
  collectionsCreated: [],
  fieldsCreated: [],
  relationsCreated: [],
  skipped: [],
  errors: [],
};

async function api(path, options = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(message);
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
  // Cria a coleção com PK auto-increment e os campos de sistema user_created/date_created.
  await api("/collections", {
    method: "POST",
    body: JSON.stringify({
      collection: name,
      meta: { collection: name, hidden: false, singleton: false, note: note || null },
      schema: { name },
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "user_created",
          type: "string",
          meta: {
            special: ["user-created"],
            interface: "select-dropdown-m2o",
            readonly: true,
            hidden: true,
            width: "half",
            display: "user",
          },
          schema: {},
        },
        {
          field: "date_created",
          type: "timestamp",
          meta: {
            special: ["date-created"],
            interface: "datetime",
            readonly: true,
            hidden: true,
            width: "half",
            display: "datetime",
          },
          schema: {},
        },
      ],
    }),
  });
  summary.collectionsCreated.push(name);
}

async function getFields(collection) {
  try {
    const res = await api(`/fields/${collection}`);
    return new Set((res.data || []).map((f) => f.field));
  } catch {
    return new Set();
  }
}

// Cria a relação m2o em /relations (idempotente).
async function ensureRelation(collection, field, relatedCollection) {
  const existing = await api(`/relations/${collection}`).catch(() => ({ data: [] }));
  if ((existing.data || []).some((r) => r.field === field)) {
    summary.skipped.push(`relation ${collection}.${field}`);
    return;
  }
  await api("/relations", {
    method: "POST",
    body: JSON.stringify({
      collection,
      field,
      related_collection: relatedCollection,
      meta: { sort_field: null },
      schema: { on_delete: "SET NULL" },
    }),
  });
  summary.relationsCreated.push(`${collection}.${field} -> ${relatedCollection}.id`);
}

// Cria um campo m2o (coluna integer + FK) e a relação correspondente.
async function ensureM2oField(collection, field, relatedCollection, existing) {
  if (!existing.has(field)) {
    await api(`/fields/${collection}`, {
      method: "POST",
      body: JSON.stringify({
        field,
        type: "integer",
        meta: { interface: "select-dropdown-m2o", special: ["m2o"], width: "half" },
        schema: {
          is_nullable: true,
          foreign_key_table: relatedCollection,
          foreign_key_column: "id",
          on_update: "NO ACTION",
          on_delete: "SET NULL",
        },
      }),
    });
    summary.fieldsCreated.push(`${collection}.${field}`);
  } else {
    summary.skipped.push(`field ${collection}.${field}`);
  }
  await ensureRelation(collection, field, relatedCollection);
}

async function ensureSimpleField(collection, def, existing) {
  if (existing.has(def.field)) {
    summary.skipped.push(`field ${collection}.${def.field}`);
    return;
  }
  await api(`/fields/${collection}`, {
    method: "POST",
    body: JSON.stringify({
      field: def.field,
      type: def.type,
      meta: { interface: def.interface, note: def.note || null, width: def.width || "full" },
      schema: { is_nullable: true },
    }),
  });
  summary.fieldsCreated.push(`${collection}.${def.field}`);
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);

  // 1. Coleção participacoes_evento -----------------------------------------
  try {
    await ensureCollection(
      "participacoes_evento",
      "Registro de eventos/campanhas que a beneficiária participou.",
    );
    const f = await getFields("participacoes_evento");
    await ensureM2oField("participacoes_evento", "beneficiaria", "beneficiarias", f);
    await ensureM2oField("participacoes_evento", "evento", "eventos_campanhas", f);
    await ensureSimpleField(
      "participacoes_evento",
      { field: "data_participacao", type: "date", interface: "datetime", note: "Data em que a beneficiária participou do evento.", width: "half" },
      f,
    );
    await ensureSimpleField(
      "participacoes_evento",
      { field: "observacao", type: "text", interface: "input-multiline", note: "Observações sobre a participação." },
      f,
    );
  } catch (err) {
    summary.errors.push(`participacoes_evento: ${err.message}`);
  }

  // 2. inscricoes_curso: adicionar beneficiaria + observacao -----------------
  try {
    const f = await getFields("inscricoes_curso");
    await ensureM2oField("inscricoes_curso", "beneficiaria", "beneficiarias", f);
    await ensureSimpleField(
      "inscricoes_curso",
      { field: "observacao", type: "text", interface: "input-multiline", note: "Observações sobre a inscrição/participação no curso." },
      f,
    );
  } catch (err) {
    summary.errors.push(`inscricoes_curso: ${err.message}`);
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
