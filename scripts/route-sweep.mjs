#!/usr/bin/env node
// Varredura de rotas sem browser: autentica uma vez e faz GET em cada página,
// reportando status HTTP e o "digest" de erro do Next quando há 500.
//
// Uso:
//   APP_URL=http://localhost:3000 \
//   LOGIN_EMAIL=admin@exemplo.com LOGIN_PASSWORD='...' \
//   node scripts/route-sweep.mjs
//
// Opcional (para resolver rotas dinâmicas [id]):
//   SAMPLE_ID=123 SAMPLE_PARTICIPACAO_ID=1
//
// Segredos vêm de variáveis de ambiente — nada é hardcoded/commitado.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.LOGIN_PASSWORD;
const SAMPLE_ID = process.env.SAMPLE_ID || "";
const SAMPLE_PART = process.env.SAMPLE_PARTICIPACAO_ID || "";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 25000);

// ---- 1. Descobre rotas escaneando src/app por page.tsx ----
function findPages(dir, base = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...findPages(full, `${base}/${entry}`));
    } else if (entry === "page.tsx" || entry === "page.ts") {
      out.push(base);
    }
  }
  return out;
}

function toRoute(p) {
  // remove route groups (admin)/(app) e normaliza
  let r = p.replace(/\/\([^)]+\)/g, "");
  return r === "" ? "/" : r;
}

function resolveDynamic(route) {
  // substitui [id] / [participacaoId] por amostras quando fornecidas
  return route
    .replace(/\[participacaoId\]/g, SAMPLE_PART)
    .replace(/\[[^\]]+\]/g, SAMPLE_ID);
}

const appDir = join(process.cwd(), "src", "app");
let routes = [...new Set(findPages(appDir).map(toRoute))].sort();

// ---- 2. Login (obtém cookie de sessão) ----
async function login() {
  if (!EMAIL || !PASSWORD) {
    console.log("⚠  LOGIN_EMAIL/LOGIN_PASSWORD não definidos — varrendo sem autenticação (rotas protegidas vão redirecionar).");
    return "";
  }
  const res = await fetch(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    console.error(`✖ Falha no login (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const m = setCookie.match(/directus_token=[^;]+/);
  if (!m) {
    console.error("✖ Login OK mas cookie directus_token não veio no Set-Cookie.");
    process.exit(1);
  }
  console.log("✓ Autenticado.");
  return m[0];
}

// ---- 3. Varredura ----
async function hit(route, cookie) {
  const url = `${APP_URL}${route}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: cookie ? { cookie } : {},
      signal: ctrl.signal,
    });
    let digest = "";
    if (res.status >= 500) {
      const html = await res.text();
      const d = html.match(/digest["\s:]+([0-9]{6,})/i);
      digest = d ? ` digest=${d[1]}` : "";
    }
    return { route, status: res.status, digest };
  } catch (e) {
    return { route, status: "ERR", digest: ` ${e.name || e.message}` };
  } finally {
    clearTimeout(t);
  }
}

const cookie = await login();
const results = [];
for (const raw of routes) {
  const route = resolveDynamic(raw);
  // pula rotas dinâmicas sem amostra
  if (route.includes("[")) {
    results.push({ route: raw, status: "SKIP", digest: " (sem SAMPLE_ID)" });
    continue;
  }
  results.push(await hit(route, cookie));
}

// ---- 4. Relatório ----
const icon = (s) =>
  s === 200 ? "✓" : s === 307 || s === 302 ? "→" : s === "SKIP" ? "·" : s === 404 ? "?" : "✖";
console.log("\nStatus  Rota");
console.log("──────────────────────────────────────");
for (const r of results) {
  console.log(`${icon(r.status)} ${String(r.status).padEnd(5)} ${r.route}${r.digest}`);
}
const bad = results.filter((r) => r.status === "ERR" || (typeof r.status === "number" && r.status >= 500));
console.log("\n" + (bad.length ? `✖ ${bad.length} rota(s) com erro de runtime (5xx/ERR).` : "✓ Nenhum 5xx encontrado."));
process.exit(bad.length ? 1 : 0);
