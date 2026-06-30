// Migração: coleção config_permissoes_demanda (acesso a tipos de demanda por perfil).
//
// Espelha config_permissoes_menu: role (uuid), role_nome, permitir_tudo (bool),
// tipos (json: array de nomes de config_tipos_demanda).
//
// Idempotente. Uso: node scripts/add-config-permissoes-demanda.mjs
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
    /* sem .env.local */
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

async function api(path, options = {}) {
  const res = await fetch(`${URL_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}

const COLLECTION = "config_permissoes_demanda";

async function exists() {
  try { await api(`/collections/${COLLECTION}`); return true; }
  catch (e) { if (e.status === 403 || e.status === 404) return false; throw e; }
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);
  if (await exists()) {
    console.log(`= ${COLLECTION}: já existe, nada a fazer.`);
    return;
  }
  await api("/collections", {
    method: "POST",
    body: JSON.stringify({
      collection: COLLECTION,
      meta: { collection: COLLECTION, hidden: false, singleton: false, note: "Tipos de demanda permitidos por perfil (role)." },
      schema: { name: COLLECTION },
      fields: [
        { field: "id", type: "integer", meta: { hidden: true, interface: "input", readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
        { field: "role", type: "string", meta: { interface: "input", note: "UUID do perfil (directus_roles)." }, schema: {} },
        { field: "role_nome", type: "string", meta: { interface: "input" }, schema: {} },
        { field: "permitir_tudo", type: "boolean", meta: { interface: "boolean" }, schema: { default_value: false } },
        { field: "tipos", type: "json", meta: { interface: "tags", note: "Nomes dos tipos de demanda permitidos." }, schema: {} },
        { field: "date_updated", type: "timestamp", meta: { special: ["date-updated"], interface: "datetime", readonly: true, hidden: true }, schema: {} },
      ],
    }),
  });
  console.log(`✔ ${COLLECTION} criada.`);
}

main().then(() => console.log("✅ Migração concluída.")).catch((e) => { console.error("❌", e.message); process.exit(1); });
