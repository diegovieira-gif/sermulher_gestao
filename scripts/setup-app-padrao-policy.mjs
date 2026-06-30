// Cria a policy "App Padrão" (usuário de app, sem admin) e a anexa aos perfis
// não-admin, concedendo acesso aos dados de negócio. O controle de MENU e de
// TIPOS DE DEMANDA continua sendo feito na camada de aplicação (fail-open).
//
// Segurança:
//  - admin_access: false  → o gate de menu/demanda do app se aplica.
//  - Coleções de permissão (config_permissoes_*) → SOMENTE LEITURA (impede que
//    o usuário altere o próprio gate via Directus Studio).
//  - directus_users → update apenas do PRÓPRIO usuário e sem os campos role/
//    policies/status (impede auto-escalonamento de privilégio). Permite troca
//    de senha e edição do próprio perfil.
//
// Idempotente. NÃO reatribui usuários (isso é decisão do operador).
// Uso: node scripts/setup-app-padrao-policy.mjs
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
if (!URL_BASE || !TOKEN) { console.error("❌ Defina DIRECTUS_API_URL e DIRECTUS_TOKEN."); process.exit(1); }

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

const POLICY_NAME = "App Padrão";
const ROLE_NAMES = ["Jurídico", "Gabinete", "Atendimento", "Psicossocial"];
const READONLY_COLLECTIONS = new Set(["config_permissoes_menu", "config_permissoes_demanda"]);
// Campos que o usuário pode editar do próprio cadastro (exclui role/policies/status).
const SELF_USER_FIELDS = [
  "first_name", "last_name", "email", "password", "title", "location",
  "avatar", "language", "theme", "description",
];

const summary = { policy: null, permissionsCreated: 0, permissionsSkipped: 0, accessCreated: [], accessSkipped: [], errors: [] };

async function ensurePolicy() {
  const found = await api(`/policies?filter[name][_eq]=${encodeURIComponent(POLICY_NAME)}&fields=id&limit=1`).catch(() => ({ data: [] }));
  const existing = (found.data || found || [])[0];
  if (existing?.id) { summary.policy = `${POLICY_NAME} (existente: ${existing.id})`; return existing.id; }
  const created = await api("/policies", {
    method: "POST",
    body: JSON.stringify({
      name: POLICY_NAME,
      icon: "badge",
      description: "Usuário padrão do app (sem admin). Acesso a dados; menus/demandas controlados pela aplicação.",
      app_access: true,
      admin_access: false,
      enforce_tfa: false,
    }),
  });
  const id = created.id || created.data?.id;
  summary.policy = `${POLICY_NAME} (criada: ${id})`;
  return id;
}

async function listBusinessCollections() {
  const res = await api("/collections?limit=-1&fields=collection,schema,meta.singleton");
  const rows = res.data || res || [];
  // Apenas tabelas reais (schema != null) e não-sistema (directus_*).
  return rows
    .filter((c) => c.collection && !c.collection.startsWith("directus_") && c.schema)
    .map((c) => c.collection);
}

function permRow(policyId, collection, action, { fields = ["*"], permissions = {}, validation = {} } = {}) {
  return { policy: policyId, collection, action, fields, permissions, validation };
}

async function ensurePermissions(policyId) {
  // Conjunto já existente (collection|action) para idempotência.
  const existing = await api(`/permissions?filter[policy][_eq]=${policyId}&fields=collection,action&limit=-1`).catch(() => ({ data: [] }));
  const have = new Set((existing.data || existing || []).map((p) => `${p.collection}|${p.action}`));

  const rows = [];
  const add = (r) => { if (!have.has(`${r.collection}|${r.action}`)) rows.push(r); else summary.permissionsSkipped++; };

  const business = await listBusinessCollections();
  for (const col of business) {
    if (READONLY_COLLECTIONS.has(col)) {
      add(permRow(policyId, col, "read"));
    } else {
      for (const action of ["read", "create", "update", "delete"]) add(permRow(policyId, col, action));
    }
  }

  // Sistema: arquivos (uploads), perfis (exibição), usuários (self).
  for (const action of ["read", "create", "update", "delete"]) add(permRow(policyId, "directus_files", action));
  add(permRow(policyId, "directus_roles", "read"));
  add(permRow(policyId, "directus_users", "read"));
  add(permRow(policyId, "directus_users", "update", {
    fields: SELF_USER_FIELDS,
    permissions: { id: { _eq: "$CURRENT_USER" } },
  }));

  // Cria em lotes.
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    await api("/permissions", { method: "POST", body: JSON.stringify(chunk) });
    summary.permissionsCreated += chunk.length;
  }
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

async function attachToRoles(policyId) {
  const rolesRes = await api(`/roles?fields=id,name&limit=-1`);
  const allRoles = rolesRes.data || rolesRes || [];
  // Casa por nome sem acento (robusto a encoding) com os nomes canônicos.
  const roles = [];
  for (const canonical of ROLE_NAMES) {
    const match = allRoles.find((r) => norm(r.name) === norm(canonical));
    if (!match) continue;
    // Repara nome corrompido (encoding) para o canônico em UTF-8.
    if (match.name !== canonical) {
      await api(`/roles/${match.id}`, { method: "PATCH", body: JSON.stringify({ name: canonical }) });
      summary.errors.push(`nome do perfil reparado: "${match.name}" → "${canonical}"`);
      match.name = canonical;
    }
    roles.push(match);
  }
  const accessRes = await api(`/access?filter[policy][_eq]=${policyId}&fields=role&limit=-1`).catch(() => ({ data: [] }));
  const attached = new Set((accessRes.data || accessRes || []).map((a) => a.role));
  for (const r of roles) {
    if (attached.has(r.id)) { summary.accessSkipped.push(r.name); continue; }
    await api("/access", { method: "POST", body: JSON.stringify({ role: r.id, policy: policyId }) });
    summary.accessCreated.push(r.name);
  }
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);
  const policyId = await ensurePolicy();
  await ensurePermissions(policyId);
  await attachToRoles(policyId);
  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\nℹ️  Usuários NÃO foram reatribuídos. Atribua cada usuário ao perfil desejado no Directus (ou peça ao assistente).");
  console.log("✅ Concluído.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
