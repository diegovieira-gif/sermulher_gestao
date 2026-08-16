// Migração: campos de contato e consentimento em `directus_users`.
//
// Necessários para o canal WhatsApp das notificações de escala. Duas coisas,
// e a segunda importa tanto quanto a primeira:
//
//   telefone_notificacao  — o número. `directus_users` não tem campo de
//                           telefone de fábrica.
//   notificar_whatsapp    — o CONSENTIMENTO. WhatsApp é aparelho pessoal;
//                           mandar mensagem de trabalho para lá sem a pessoa
//                           ter dito que aceita é invasivo. Nasce `false`:
//                           quem não se manifestou não recebe.
//
// O canal in-app e o e-mail institucional não dependem disto e funcionam para
// todo mundo desde o primeiro dia.
//
// Idempotente. Uso:
//   node scripts/add-campos-notificacao-usuario.mjs
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
    /* usa apenas process.env */
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

const summary = { fieldsCreated: [], skipped: [], errors: [] };

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

async function getFields(collection) {
  const res = await api(`/fields/${collection}`);
  return new Set((res.data || []).map((f) => f.field));
}

async function ensureField(collection, def, existing) {
  if (existing.has(def.field)) {
    summary.skipped.push(`${collection}.${def.field}`);
    return;
  }
  await api(`/fields/${collection}`, {
    method: "POST",
    body: JSON.stringify({
      field: def.field,
      type: def.type,
      meta: {
        interface: def.interface,
        note: def.note,
        width: def.width || "half",
        options: def.options || null,
        special: def.special || null,
      },
      schema: {
        is_nullable: true,
        ...(def.defaultValue !== undefined ? { default_value: def.defaultValue } : {}),
      },
    }),
  });
  summary.fieldsCreated.push(`${collection}.${def.field}`);
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);

  try {
    const f = await getFields("directus_users");

    await ensureField(
      "directus_users",
      {
        field: "telefone_notificacao",
        type: "string",
        interface: "input",
        note: "Celular com DDD para avisos por WhatsApp. Só dígitos.",
      },
      f,
    );

    await ensureField(
      "directus_users",
      {
        field: "notificar_whatsapp",
        type: "boolean",
        interface: "boolean",
        special: ["cast-boolean"],
        defaultValue: false,
        note: "A pessoa autoriza receber avisos de escala por WhatsApp.",
      },
      f,
    );
  } catch (err) {
    summary.errors.push(err.message);
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 2;
  } else {
    console.log("\n✅ Migração concluída.");
    console.log(
      "\nOs campos ficam vazios até alguém preenchê-los. Enquanto isso, os\n" +
        "avisos seguem pelo sino e pelo e-mail — o WhatsApp só sai para quem\n" +
        "tiver número E consentimento marcado.",
    );
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
