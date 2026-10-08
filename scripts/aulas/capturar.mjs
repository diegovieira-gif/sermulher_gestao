// Passo 3 — captura das telas das aulas, uma imagem por cena.
//
// Para cada cena de tela: executa as ações do roteiro, tira um print da janela
// e mede a caixa do elemento em `foco` — é dela que o montar.mjs tira o ponto
// do zoom. Nada de coordenada marcada à mão: mudou o layout, a caixa acompanha.
//
// Uso:
//   BASE_URL=http://localhost:3000 node scripts/aulas/capturar.mjs 1.1
//   node scripts/aulas/capturar.mjs --todas
//
// Conta: TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.local — a conta demo@
// da instância de DEMONSTRAÇÃO. Nunca a credencial de uma servidora.
//
// ┌─ SÓ CONTRA A DEMONSTRAÇÃO ───────────────────────────────────────────────┐
// │ A captura recusa qualquer endereço que não seja local. Um vídeo com o   │
// │ nome real de uma mulher atendida é um vazamento que não se desfaz.      │
// │ Uma demonstração em outra máquina exige `--host-demo-confirmado`.       │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Cena cujo seletor não aparece FALHA ALTO, com o id da cena e o seletor —
// lição do curso_inteligente: âncora que desliza em silêncio é pior que erro.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  carregarEnvLocal, config, hostEhLocal, idsDaLinhaDeComando, pastaDaAula, plano, proximaSemana,
} from "./lib.mjs";

carregarEnvLocal();
const argv = process.argv.slice(2);
const cfg = config();
const BASE_URL = (process.env.BASE_URL || cfg.producao.base_url_demo).replace(/\/$/, "");
const ESPERA_MS = 10000;

if (!hostEhLocal(BASE_URL) && !argv.includes("--host-demo-confirmado")) {
  console.error(
    `Recusado: ${BASE_URL} não é um endereço local.\n` +
    "A captura só roda contra a instância de DEMONSTRAÇÃO (dados fictícios do elenco).\n" +
    "Se este endereço é mesmo uma demonstração, repita com --host-demo-confirmado.",
  );
  process.exit(1);
}

function substituir(texto) {
  return String(texto)
    .replaceAll("{senha_demo}", process.env.TEST_USER_PASSWORD ?? "")
    .replaceAll("{proxima_semana}", proximaSemana());
}

/** `rotulo=X` é pelo rótulo do campo; o resto é seletor do Playwright. */
function localizar(page, seletor) {
  if (seletor.startsWith("rotulo=")) return page.getByLabel(seletor.slice(7)).first();
  return page.locator(seletor).first();
}

async function esperarTela(page) {
  await page.waitForLoadState("networkidle", { timeout: ESPERA_MS }).catch(() => {});
  // telas que carregam dados no cliente mostram "Carregando..." antes
  await page.waitForFunction(
    () => !/Carregando/i.test(document.querySelector("main")?.innerText ?? ""),
    null, { timeout: ESPERA_MS },
  ).catch(() => {});
  // indicadores girando (busca de CPF, salvamento) ainda não terminaram
  await page.waitForFunction(
    () => ![...document.querySelectorAll(".animate-spin")].some((e) => e.getClientRects().length),
    null, { timeout: ESPERA_MS },
  ).catch(() => {});
  await page.waitForTimeout(400); // animações de entrada
}

async function executar(page, acao, onde) {
  const alvo = acao.seletor ? localizar(page, acao.seletor) : null;
  const falha = (e) => new Error(`${onde}: ação ${acao.tipo} em ${acao.seletor ?? acao.url ?? acao.tecla} — ${e.message.split("\n")[0]}`);
  try {
    switch (acao.tipo) {
      case "navegar":
        await page.goto(BASE_URL + acao.url, { waitUntil: "domcontentloaded" });
        break;
      case "clicar":
        await alvo.click({ timeout: ESPERA_MS });
        break;
      case "digitar":
        // Captura é imagem parada: o que importa é o campo preenchido.
        await alvo.fill(substituir(acao.texto), { timeout: ESPERA_MS });
        break;
      case "selecionar":
        await alvo.click({ timeout: ESPERA_MS });
        await page.getByRole("option", { name: acao.opcao }).first().click({ timeout: ESPERA_MS });
        break;
      case "marcar":
        await alvo.check({ timeout: ESPERA_MS });
        break;
      case "rolar":
        await alvo.scrollIntoViewIfNeeded({ timeout: ESPERA_MS });
        break;
      case "tecla":
        await page.keyboard.press(acao.tecla);
        break;
      case "nenhuma":
        break;
      default:
        throw new Error(`ação desconhecida`);
    }
  } catch (e) {
    throw falha(e);
  }
  await esperarTela(page);
}

async function capturarAula(navegador, id) {
  const aula = plano(id);
  const pasta = join(pastaDaAula(id), "telas");
  mkdirSync(pasta, { recursive: true });

  const { largura, altura } = cfg.video.viewport_captura;
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: cfg.video.escala_captura,
    locale: "pt-BR",
    timezoneId: "America/Maceio",
  });
  // Tema fixo nas capturas, e sem o indicador de desenvolvimento do Next.
  await contexto.addInitScript((tema) => {
    try { localStorage.setItem("tema", tema); } catch {}
    const estilo = document.createElement("style");
    estilo.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(estilo));
  }, cfg.video.tema_captura);

  if (aula.sessao !== "deslogada") {
    const email = process.env.TEST_USER_EMAIL;
    const senha = process.env.TEST_USER_PASSWORD;
    if (!email || !senha) throw new Error("faltam TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.local (conta demo@)");
    const r = await contexto.request.post(`${BASE_URL}/api/auth/login`, { data: { email, password: senha } });
    if (!r.ok()) throw new Error(`login da conta demo falhou (${r.status()})`);
  }

  const page = await contexto.newPage();
  const capturas = {};
  try {
    for (const cena of aula.cenas) {
      if ((cena.tipo ?? "tela") !== "tela") continue;
      const onde = `${id}/${cena.id}`;
      const acoes = cena.acao ? (Array.isArray(cena.acao) ? cena.acao : [cena.acao]) : [];
      for (const acao of acoes) await executar(page, acao, onde);

      let foco = null;
      if (cena.foco?.seletor) {
        const alvo = localizar(page, cena.foco.seletor);
        try {
          await alvo.scrollIntoViewIfNeeded({ timeout: ESPERA_MS });
        } catch (e) {
          throw new Error(`${onde}: foco ${cena.foco.seletor} não apareceu — ${e.message.split("\n")[0]}`);
        }
        await page.waitForTimeout(200);
        const caixa = await alvo.boundingBox();
        if (!caixa) throw new Error(`${onde}: foco ${cena.foco.seletor} não tem tamanho na tela`);
        // normalizado (0–1), independente da escala da captura
        foco = {
          x: Math.max(0, caixa.x / largura), y: Math.max(0, caixa.y / altura),
          w: Math.min(1, caixa.width / largura), h: Math.min(1, caixa.height / altura),
          zoom: cena.foco.zoom ?? cfg.video.zoom_padrao,
        };
      }
      const arquivo = `telas/${cena.id}.png`;
      await page.screenshot({ path: join(pastaDaAula(id), arquivo) });
      capturas[cena.id] = { arquivo, foco };
      console.log(`  ${onde} ✔${foco ? ` foco ${cena.foco.seletor}` : ""}`);
    }
  } finally {
    await contexto.close();
  }

  writeFileSync(join(pastaDaAula(id), "captura.json"), JSON.stringify({
    aula: id, base_url: BASE_URL, viewport: { largura, altura }, escala: cfg.video.escala_captura,
    capturado_em: new Date().toISOString(), cenas: capturas,
  }, null, 2));
  console.log(`${id}: ${Object.keys(capturas).length} telas capturadas`);
}

const navegador = await chromium.launch();
const falhas = [];
try {
  for (const id of idsDaLinhaDeComando(argv)) {
    try { await capturarAula(navegador, id); }
    catch (e) { falhas.push(id); console.error(`${id}: FALHOU — ${e.message}`); }
  }
} finally {
  await navegador.close();
}
if (falhas.length) {
  console.error(`\n${falhas.length} aula(s) com falha: ${falhas.join(", ")}`);
  process.exitCode = 1;
}
