// Migração: adiciona campos de agendamento à coleção `campanhas` no Directus.
// Idempotente — pula campos já existentes.
//
// Uso:
//   node scripts/add-campanha-scheduling-fields.mjs
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

const COLLECTION = "campanhas";

// Definições dos campos a criar.
const FIELDS = [
  {
    field: "tipo",
    type: "string",
    schema: { default_value: "manual" },
    meta: {
      interface: "select-dropdown",
      options: {
        choices: [
          { text: "Manual", value: "manual" },
          { text: "Automática (agendada)", value: "automatica" },
        ],
      },
      note: "Manual = disparo sob demanda. Automática = enviada pelo agendador.",
      width: "half",
    },
  },
  {
    field: "ativa",
    type: "boolean",
    schema: { default_value: true },
    meta: {
      interface: "boolean",
      note: "Liga/desliga a execução automática desta campanha.",
      width: "half",
    },
  },
  {
    field: "horario",
    type: "string",
    schema: {},
    meta: {
      interface: "input",
      options: { placeholder: "HH:MM (ex.: 08:00)" },
      note: "Hora do dia para envio automático (formato 24h, HH:MM).",
      width: "half",
    },
  },
  {
    field: "dias_semana",
    type: "json",
    schema: {},
    meta: {
      interface: "select-multiple-checkbox",
      options: {
        choices: [
          { text: "Dom", value: 0 },
          { text: "Seg", value: 1 },
          { text: "Ter", value: 2 },
          { text: "Qua", value: 3 },
          { text: "Qui", value: 4 },
          { text: "Sex", value: 5 },
          { text: "Sáb", value: 6 },
        ],
      },
      note: "Dias em que a campanha automática roda. Vazio = todos os dias.",
      width: "half",
    },
  },
  {
    field: "filtro_json",
    type: "json",
    schema: {},
    meta: {
      interface: "input-code",
      options: { language: "json" },
      note: "Filtro estruturado de público (definido pela aplicação).",
      width: "full",
    },
  },
  {
    field: "ultima_execucao",
    type: "date",
    schema: {},
    meta: {
      interface: "datetime",
      readonly: true,
      note: "Última data em que a campanha automática foi executada (idempotência).",
      width: "half",
    },
  },
];

async function getExistingFields() {
  const res = await fetch(`${URL_BASE}/fields/${COLLECTION}?fields[]=field`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET fields falhou: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return new Set((json.data || []).map((f) => f.field));
}

async function createField(def) {
  const res = await fetch(`${URL_BASE}/fields/${COLLECTION}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(def),
  });
  if (!res.ok) {
    throw new Error(`POST ${def.field} falhou: ${res.status} ${await res.text()}`);
  }
}

(async () => {
  console.log(`→ Directus: ${URL_BASE} | coleção: ${COLLECTION}`);
  const existing = await getExistingFields();
  for (const def of FIELDS) {
    if (existing.has(def.field)) {
      console.log(`= ${def.field}: já existe, pulando.`);
      continue;
    }
    await createField(def);
    console.log(`✔ ${def.field}: criado.`);
  }
  console.log("✅ Migração concluída.");
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
