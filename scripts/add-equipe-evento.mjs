// Migração: equipe que atuou em cada evento.
//
// Cria a coleção `equipe_evento`, ligando um evento (eventos_campanhas) a um
// usuário do próprio Directus (directus_users) — são as servidoras da
// secretaria, que já têm conta no sistema; não há cadastro paralelo.
//
// Modelo deliberadamente enxuto: apenas o VÍNCULO pessoa↔evento. Sem função e
// sem data de atuação — decisão de produto tomada antes da migração, porque
// mexer em schema depois de haver dado é caro.
//
// Cada campo relacional também recebe o registro em /relations. Sem isso o
// deep-read (`usuario.first_name`) devolve o UUID cru em vez do objeto — foi
// exatamente o que quebrou a coluna "Registrado por" em participacoes_evento e
// exigiu o script fix-user-created-vinculos.mjs. Aqui `user_created` já nasce
// com a relação declarada.
//
// Atenção: `directus_users` tem chave primária UUID, não integer — por isso o
// campo `usuario` é do tipo uuid, diferente dos M2O comuns do projeto.
//
// Idempotente — pula coleção/campos/relações que já existem.
//
// Uso:
//   node scripts/add-equipe-evento.mjs
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

const COLLECTION = "equipe_evento";

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
          type: "uuid",
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

/** M2O para coleção com PK integer (o caso comum do projeto). */
async function ensureM2oField(collection, field, relatedCollection, existing, note) {
  if (!existing.has(field)) {
    await api(`/fields/${collection}`, {
      method: "POST",
      body: JSON.stringify({
        field,
        type: "integer",
        meta: {
          interface: "select-dropdown-m2o",
          special: ["m2o"],
          width: "half",
          note: note || null,
        },
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

/**
 * M2O para `directus_users`, cuja PK é UUID.
 *
 * `on_delete: SET NULL` de propósito: se a conta de uma servidora for excluída
 * do Directus, o registro histórico do evento permanece (com o nome em
 * branco), em vez de sumir junto. Apagar o histórico de quem trabalhou num
 * evento por causa de um desligamento seria perda de informação institucional.
 */
async function ensureUserM2oField(collection, field, existing, note) {
  if (!existing.has(field)) {
    await api(`/fields/${collection}`, {
      method: "POST",
      body: JSON.stringify({
        field,
        type: "uuid",
        meta: {
          interface: "select-dropdown-m2o",
          special: ["m2o"],
          width: "half",
          display: "user",
          note: note || null,
        },
        schema: {
          is_nullable: true,
          foreign_key_table: "directus_users",
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
  await ensureRelation(collection, field, "directus_users");
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);

  try {
    await ensureCollection(
      COLLECTION,
      "Servidoras/servidores que atuaram em cada evento (equipe).",
    );

    const f = await getFields(COLLECTION);

    await ensureM2oField(
      COLLECTION,
      "evento",
      "eventos_campanhas",
      f,
      "Evento em que a pessoa atuou.",
    );

    await ensureUserM2oField(
      COLLECTION,
      "usuario",
      f,
      "Usuário do sistema que atuou no evento.",
    );

    // `user_created` já existe (criado junto da coleção), mas a RELAÇÃO precisa
    // ser declarada para que `user_created.first_name` seja legível.
    await ensureRelation(COLLECTION, "user_created", "directus_users");
  } catch (err) {
    summary.errors.push(`${COLLECTION}: ${err.message}`);
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 2;
  } else {
    console.log("\n✅ Migração concluída.");
    console.log(
      "\nLembrete: rode `node scripts/setup-app-padrao-policy.mjs` para que os\n" +
        "perfis não-administradores recebam permissão na nova coleção.",
    );
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
