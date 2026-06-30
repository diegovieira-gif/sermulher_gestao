// Corrige o nome do perfil "Jurídico" (gravado com encoding inválido) e garante
// que a policy "App Padrão" esteja anexada a ele. Idempotente.
// Uso: node scripts/fix-juridico-role.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnvLocal();

const URL_BASE = (process.env.DIRECTUS_API_URL || process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN || "";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function api(path, options = {}) {
  const res = await fetch(`${URL_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) { const e = new Error(data?.errors?.[0]?.message || `${res.status} ${res.statusText}`); e.status = res.status; throw e; }
  return data;
}

const POLICY_NAME = "App Padrão";

async function main() {
  // Localiza o perfil corrompido: o que NÃO está no conjunto de nomes válidos.
  const validos = new Set(["Administrator", "Gabinete", "Atendimento", "Psicossocial", "Jurídico"]);
  const rolesRes = await api("/roles?fields=id,name&limit=-1");
  const roles = rolesRes.data || rolesRes || [];
  const corrompido = roles.find((r) => !validos.has(r.name));

  if (!corrompido) {
    console.log("= Nenhum perfil com nome corrompido encontrado (já corrigido?).");
  } else {
    console.log(`→ Corrigindo perfil id=${corrompido.id} (nome atual: ${JSON.stringify(corrompido.name)})`);
    await api(`/roles/${corrompido.id}`, { method: "PATCH", body: JSON.stringify({ name: "Jurídico" }) });
    console.log("✔ Nome reparado para 'Jurídico'.");
  }

  const target = corrompido || roles.find((r) => r.name === "Jurídico");
  if (!target) { console.error("❌ Perfil Jurídico não encontrado."); process.exit(1); }

  const polRes = await api(`/policies?filter[name][_eq]=${encodeURIComponent(POLICY_NAME)}&fields=id&limit=1`);
  const policyId = (polRes.data || polRes || [])[0]?.id;
  if (!policyId) { console.error(`❌ Policy "${POLICY_NAME}" não encontrada.`); process.exit(1); }

  const accessRes = await api(`/access?filter[policy][_eq]=${policyId}&fields=role&limit=-1`);
  const attached = new Set((accessRes.data || accessRes || []).map((a) => a.role));
  if (attached.has(target.id)) {
    console.log("= Policy já anexada ao Jurídico.");
  } else {
    await api("/access", { method: "POST", body: JSON.stringify({ role: target.id, policy: policyId }) });
    console.log("✔ Policy 'App Padrão' anexada ao Jurídico.");
  }
  console.log("✅ Concluído.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
