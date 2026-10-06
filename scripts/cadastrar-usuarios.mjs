// Cadastra usuárias novas no Directus a partir de um CSV, todas num perfil.
//
// O login do app É o login do Directus — então "cadastrar no app" é criar o
// usuário no Directus com o perfil (role) certo. Este script faz isso em lote.
//
// SIMULA por padrão. Só grava com `--aplicar`: são contas reais, num sistema
// com dados de atendimento a mulheres, e conferir a lista antes custa nada.
//
// Idempotente: quem já existe (mesmo e-mail, sem diferenciar maiúsculas) é
// pulado e nunca alterado. Rodar duas vezes não duplica ninguém.
//
// ┌─ SENHA INICIAL ──────────────────────────────────────────────────────────┐
// │ O app não tem "esqueci a senha", e a troca em Meu Perfil exige a senha   │
// │ atual — usuária criada sem senha não entraria nunca. Então:              │
// │                                                                          │
// │ • padrão: gera uma senha aleatória por pessoa e grava num arquivo local  │
// │   em scripts/dados/ (fora do Git). Nada de senha vai para a tela. Quem   │
// │   administra entrega a cada uma, e ela troca em Meu Perfil no 1º acesso. │
// │ • `--convite`: usa o convite do Directus (/users/invite), que manda um   │
// │   e-mail com link para a pessoa definir a própria senha. Melhor, mas só  │
// │   funciona se o e-mail e o PUBLIC_URL do Directus estiverem de pé — o    │
// │   README marca esse canal como NÃO verificado.                           │
// └──────────────────────────────────────────────────────────────────────────┘
//
// ┌─ PERFIL SEM MENU CONFIGURADO = MENU COMPLETO ────────────────────────────┐
// │ Em `src/lib/permissions.ts`, perfil sem linha em config_permissoes_menu  │
// │ vê TODOS os módulos. O script se recusa a aplicar nesse caso, a menos    │
// │ que receba `--aceitar-menu-completo`: configure antes o menu do perfil   │
// │ em Configurações → Permissões.                                           │
// └──────────────────────────────────────────────────────────────────────────┘
//
// CSV: uma pessoa por linha, separador `;` ou `,`, cabeçalho opcional.
//   email;nome;sobrenome
//   maria.silva@aracaju.se.gov.br;Maria;Silva
// Nome e sobrenome são opcionais: sem eles, saem do e-mail ("maria.silva" →
// Maria Silva) — SEM acento, então prefira preenchê-los.
//
// Uso:
//   node scripts/cadastrar-usuarios.mjs <arquivo.csv> --perfil CRAM            (simula)
//   node scripts/cadastrar-usuarios.mjs <arquivo.csv> --perfil CRAM --aplicar  (grava)
//   … --aplicar --convite                (convite por e-mail em vez de senha)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomInt } from "node:crypto";

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

// ── argumentos ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APLICAR = args.includes("--aplicar");
const CONVITE = args.includes("--convite");
const ACEITAR_MENU_COMPLETO = args.includes("--aceitar-menu-completo");
const iPerfil = args.indexOf("--perfil");
const PERFIL = iPerfil >= 0 ? args[iPerfil + 1] : null;
const ARQUIVO = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--perfil");

if (!ARQUIVO || !PERFIL) {
  console.error("Uso: node scripts/cadastrar-usuarios.mjs <arquivo.csv> --perfil <nome> [--aplicar] [--convite]");
  process.exit(1);
}

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
    const e = new Error(data?.errors?.[0]?.message || `${res.status} ${res.statusText}`);
    e.status = res.status;
    throw e;
  }
  return data?.data ?? data;
}

// ── leitura do CSV ──────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/;

function capitalizar(parte) {
  return parte ? parte[0].toLocaleUpperCase("pt-BR") + parte.slice(1).toLocaleLowerCase("pt-BR") : "";
}

/** "maria.de.souza" → { nome: "Maria", sobrenome: "De Souza" } */
function nomeDoEmail(email) {
  const partes = email.split("@")[0].split(/[._-]+/).filter(Boolean).map(capitalizar);
  return { nome: partes[0] || "", sobrenome: partes.slice(1).join(" ") };
}

function lerCsv(caminho) {
  const linhas = readFileSync(resolve(caminho), "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const pessoas = [];
  const vistos = new Set();
  const problemas = [];

  linhas.forEach((linha, i) => {
    const [emailBruto = "", nome = "", sobrenome = ""] = linha.split(/[;,]/).map((c) => c.trim());
    const email = emailBruto.toLowerCase();
    if (i === 0 && email === "email") return; // cabeçalho
    if (!EMAIL_RE.test(email)) {
      problemas.push(`linha ${i + 1}: e-mail inválido (${JSON.stringify(emailBruto)})`);
      return;
    }
    if (vistos.has(email)) {
      problemas.push(`linha ${i + 1}: ${email} repetido no arquivo`);
      return;
    }
    vistos.add(email);
    const derivado = nomeDoEmail(email);
    pessoas.push({
      email,
      nome: nome || derivado.nome,
      sobrenome: sobrenome || derivado.sobrenome,
      nomeDerivado: !nome,
    });
  });

  return { pessoas, problemas };
}

/** Senha aleatória sem caracteres ambíguos (0/O, 1/l/I), fácil de ditar. */
function gerarSenha(tamanho = 14) {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < tamanho; i++) s += alfabeto[randomInt(alfabeto.length)];
  return s;
}

// ── principal ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`Directus: ${URL_BASE}`);
  console.log(APLICAR ? "Modo: APLICAR (grava no Directus)\n" : "Modo: SIMULAÇÃO (nada é gravado — use --aplicar)\n");

  const { pessoas, problemas } = lerCsv(ARQUIVO);
  if (problemas.length) {
    console.error("❌ Corrija o arquivo antes de seguir:");
    for (const p of problemas) console.error(`   • ${p}`);
    process.exit(1);
  }
  if (!pessoas.length) {
    console.error("❌ Nenhuma pessoa no arquivo.");
    process.exit(1);
  }

  // 1. Perfil: nome exato (sem diferenciar maiúsculas), e só um.
  const roles = await api("/roles?fields=id,name&limit=-1");
  const candidatos = roles.filter((r) => r.name?.trim().toLowerCase() === PERFIL.trim().toLowerCase());
  if (candidatos.length !== 1) {
    console.error(
      candidatos.length
        ? `❌ Há ${candidatos.length} perfis chamados "${PERFIL}" — ambíguo.`
        : `❌ Perfil "${PERFIL}" não existe. Perfis disponíveis: ${roles.map((r) => r.name).join(", ")}`,
    );
    process.exit(1);
  }
  const role = candidatos[0];
  console.log(`✔ Perfil "${role.name}" (${role.id})`);

  // 2. Policies do perfil: sem nenhuma, a pessoa não lê nem o próprio role e o
  //    app cai no fail-closed (menu mínimo). Com admin_access, vira admin.
  const acessos = await api(
    `/access?filter[role][_eq]=${role.id}&fields=policy.name,policy.admin_access&limit=-1`,
  );
  const policies = acessos.map((a) => a.policy).filter(Boolean);
  if (!policies.length) {
    console.warn(`⚠️  O perfil não tem nenhuma policy anexada — as usuárias entrariam sem conseguir usar o app.`);
  } else {
    console.log(`✔ Policies: ${policies.map((p) => p.name).join(", ")}`);
  }
  if (policies.some((p) => p.admin_access)) {
    console.warn(`⚠️  O perfil tem acesso de ADMINISTRADOR no Directus. Confirme se é isso mesmo.`);
  }

  // 3. Menu: perfil sem configuração vê todos os módulos (ver cabeçalho).
  const menu = await api(
    `/items/config_permissoes_menu?filter[role][_eq]=${role.id}&fields=permitir_tudo,menus&limit=1`,
  );
  const configMenu = menu[0];
  let bloqueado = false;
  if (!configMenu) {
    console.warn(`⚠️  O perfil NÃO tem menu configurado — as usuárias veriam TODOS os módulos do app.`);
    console.warn(`    Configure em Configurações → Permissões, ou rode com --aceitar-menu-completo.`);
    bloqueado = !ACEITAR_MENU_COMPLETO;
  } else if (configMenu.permitir_tudo) {
    console.warn(`⚠️  O menu do perfil está como "permitir tudo".`);
  } else {
    console.log(`✔ Menu configurado: ${(configMenu.menus || []).join(", ") || "(vazio)"}`);
  }

  // 4. Quem já existe.
  const existentes = await api("/users?fields=id,email,status,role.name&limit=-1");
  const porEmail = new Map(existentes.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u]));

  const novas = [];
  console.log("");
  for (const p of pessoas) {
    const ja = porEmail.get(p.email);
    if (ja) {
      const outroPerfil = ja.role?.name && ja.role.name !== role.name;
      console.log(
        `= ${p.email} já existe (perfil ${ja.role?.name ?? "nenhum"}, ${ja.status}) — pulada` +
          (outroPerfil ? "  ⚠️ perfil diferente, não alterado" : ""),
      );
    } else {
      novas.push(p);
      console.log(`+ ${p.email} → ${p.nome} ${p.sobrenome}${p.nomeDerivado ? "  (nome tirado do e-mail, sem acento)" : ""}`);
    }
  }

  console.log(`\n${novas.length} a criar, ${pessoas.length - novas.length} já existentes.`);
  if (!novas.length) return;

  if (!APLICAR) {
    console.log("\nSimulação concluída. Para gravar, rode de novo com --aplicar.");
    if (bloqueado) console.log("(E resolva antes o aviso do menu acima.)");
    return;
  }
  if (bloqueado) {
    console.error("\n❌ Nada gravado: o perfil não tem menu configurado (ver aviso acima).");
    process.exit(1);
  }

  // 5. Grava.
  const credenciais = [];
  const falhas = [];
  for (const p of novas) {
    try {
      if (CONVITE) {
        await api("/users/invite", { method: "POST", body: JSON.stringify({ email: p.email, role: role.id }) });
        const [criada] = await api(`/users?filter[email][_eq]=${encodeURIComponent(p.email)}&fields=id&limit=1`);
        if (criada) {
          await api(`/users/${criada.id}`, {
            method: "PATCH",
            body: JSON.stringify({ first_name: p.nome, last_name: p.sobrenome }),
          });
        }
        console.log(`✔ convite enviado: ${p.email}`);
      } else {
        const senha = gerarSenha();
        await api("/users", {
          method: "POST",
          body: JSON.stringify({
            email: p.email,
            first_name: p.nome,
            last_name: p.sobrenome,
            role: role.id,
            status: "active",
            password: senha,
          }),
        });
        credenciais.push({ ...p, senha });
        console.log(`✔ criada: ${p.email}`);
      }
    } catch (e) {
      falhas.push(p.email);
      console.error(`✖ ${p.email}: ${e.message}`);
    }
  }

  if (credenciais.length) {
    const pasta = resolve("scripts/dados");
    mkdirSync(pasta, { recursive: true });
    const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const arquivo = resolve(pasta, `senhas-iniciais-${carimbo}.csv`);
    const csv = ["email;nome;senha_inicial", ...credenciais.map((c) => `${c.email};${c.nome} ${c.sobrenome};${c.senha}`)];
    writeFileSync(arquivo, "﻿" + csv.join("\r\n") + "\r\n", { encoding: "utf8", mode: 0o600 });
    console.log(`\n🔑 Senhas iniciais gravadas em: ${arquivo}`);
    console.log("   Entregue a cada pessoa por canal individual, peça a troca em Meu Perfil");
    console.log("   no primeiro acesso, e APAGUE o arquivo depois.");
  }

  if (falhas.length) {
    console.error(`\n❌ ${falhas.length} falha(s): ${falhas.join(", ")}. Rodar de novo tenta só as que faltam.`);
    process.exit(1);
  }
  console.log("\n✅ Concluído.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
