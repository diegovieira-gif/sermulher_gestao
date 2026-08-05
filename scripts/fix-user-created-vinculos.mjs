// Corrige o "Registrado por" das abas Eventos e Cursos da ficha da beneficiária.
//
// Diagnóstico: `participacoes_evento.user_created` existe e é preenchido com o
// UUID de quem registrou, mas NÃO tem relação declarada com `directus_users` —
// então o Directus devolve o UUID cru e `user_created.first_name` volta vazio.
// Em `inscricoes_curso` o campo sequer existe. A coleção `entregas_beneficios`
// tem os dois (campo + relação), e é por isso que a aba Benefícios funciona.
// Este script espelha aquela configuração nas outras duas.
//
// Só cria o que falta — nunca altera nem remove nada existente.
//
// Uso:
//   node scripts/fix-user-created-vinculos.mjs           (aplica)
//   node scripts/fix-user-created-vinculos.mjs --dry-run (só relata)
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

const DRY_RUN = process.argv.includes("--dry-run");

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
const summary = { fieldsCreated: [], relationsCreated: [], skipped: [], errors: [] };

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
    const msg = data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function campoExiste(colecao, campo) {
  try {
    await api(`/fields/${colecao}/${campo}`);
    return true;
  } catch (err) {
    if (err.status === 403 || err.status === 404) return false;
    throw err;
  }
}

async function relacaoExiste(colecao, campo) {
  try {
    await api(`/relations/${colecao}/${campo}`);
    return true;
  } catch (err) {
    if (err.status === 403 || err.status === 404) return false;
    throw err;
  }
}

/** Campo `user_created` no mesmo formato de `entregas_beneficios`. */
async function garantirCampo(colecao) {
  if (await campoExiste(colecao, "user_created")) {
    summary.skipped.push(`campo ${colecao}.user_created`);
    return;
  }
  if (DRY_RUN) {
    summary.fieldsCreated.push(`${colecao}.user_created (dry-run)`);
    return;
  }
  await api(`/fields/${colecao}`, {
    method: "POST",
    body: JSON.stringify({
      field: "user_created",
      type: "string",
      meta: {
        interface: "select-dropdown-m2o",
        special: ["user-created"],
        readonly: true,
        hidden: true,
        width: "half",
        options: { template: "{{avatar}} {{first_name}} {{last_name}}" },
      },
      schema: { is_nullable: true },
    }),
  });
  summary.fieldsCreated.push(`${colecao}.user_created`);
}

/** Relação user_created → directus_users, espelhando entregas_beneficios. */
async function garantirRelacao(colecao) {
  if (await relacaoExiste(colecao, "user_created")) {
    summary.skipped.push(`relação ${colecao}.user_created`);
    return;
  }
  if (DRY_RUN) {
    summary.relationsCreated.push(`${colecao}.user_created → directus_users (dry-run)`);
    return;
  }
  await api("/relations", {
    method: "POST",
    body: JSON.stringify({
      collection: colecao,
      field: "user_created",
      related_collection: "directus_users",
      schema: { on_delete: "SET NULL" },
    }),
  });
  summary.relationsCreated.push(`${colecao}.user_created → directus_users`);
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}${DRY_RUN ? "  [DRY RUN — nada será gravado]" : ""}`);

  for (const colecao of ["participacoes_evento", "inscricoes_curso"]) {
    try {
      await garantirCampo(colecao);
      await garantirRelacao(colecao);
    } catch (err) {
      summary.errors.push(`${colecao}: ${err.message}`);
    }
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));

  console.log(
    "\nℹ️  Registros criados ANTES desta correção continuarão sem autor em" +
      " inscricoes_curso (o campo não existia). Eles seguirão exibindo" +
      " 'Sistema / Importação', o que é verdadeiro para eles.",
  );

  if (summary.errors.length > 0) process.exitCode = 2;
  else console.log(DRY_RUN ? "\n✅ Dry-run concluído." : "\n✅ Correção aplicada.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
