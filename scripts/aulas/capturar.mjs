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
// ┌─ MODO PRODUÇÃO (--producao) ─────────────────────────────────────────────┐
// │ Para gravar com o SIGMA rodando NESTA máquina (localhost) apontado para │
// │ o Directus de produção, com o elenco cadastrado nele:                   │
// │ • sessão por token estático (SESSAO_TOKEN_ARQUIVO), nunca senha;        │
// │ • antes de cada print, toda linha de tabela sem um nome do elenco é     │
// │   BORRADA, e o nome da conta (NOME_SESSAO) vira o da usuária demo;      │
// │ • os prints DEVEM ser revistos um a um antes de montar o vídeo.         │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Cena cujo seletor não aparece FALHA ALTO, com o id da cena e o seletor —
// lição do curso_inteligente: âncora que desliza em silêncio é pior que erro.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  carregarEnvLocal, config, hostEhLocal, idsDaLinhaDeComando, lerJson, nomesDoElenco, pastaDaAula,
  PASTA_AULAS, plano, proximaSemana, trocasDeSessao,
} from "./lib.mjs";

carregarEnvLocal();
const argv = process.argv.slice(2);
const cfg = config();
const BASE_URL = (process.env.BASE_URL || cfg.producao.base_url_demo).replace(/\/$/, "");
const ESPERA_MS = 10000;
const PRODUCAO = argv.includes("--producao");
const elenco = lerJson(join(PASTA_AULAS, "elenco.json"));
const TROCAS = PRODUCAO ? trocasDeSessao(process.env.NOME_SESSAO || "", elenco.usuaria_demo.nome) : null;
if (TROCAS && process.env.EMAIL_SESSAO) TROCAS.parciais.push([process.env.EMAIL_SESSAO, elenco.usuaria_demo.email]);
let MASCARA = null; // por aula: só os personagens dela ficam legíveis

/*
  TRAVA DE VAZAMENTO (modo produção): os nomes das beneficiárias reais são
  lidos do Directus e ficam SÓ na memória — nunca em arquivo nem na tela.
  Antes de cada print, se algum deles aparece em texto visível e não borrado,
  a cena falha e o print não é gravado. A máscara pode deixar escapar um
  componente novo; a trava não deixa o vazamento virar vídeo.
*/
let NOMES_REAIS = [];
if (PRODUCAO) {
  const url = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
  const tok = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO ? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO, "utf8").trim() : "";
  if (!url || !tok) { console.error("--producao exige DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO para a trava de vazamento."); process.exit(1); }
  const r = await fetch(`${url}/items/beneficiarias?fields=nome_completo,nome_social&limit=-1`, { headers: { Authorization: `Bearer ${tok}` } });
  if (!r.ok) { console.error(`trava de vazamento: não consegui ler os nomes (${r.status})`); process.exit(1); }
  const doElenco = nomesDoElenco(elenco);
  const norm = (t) => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const elencoNorm = doElenco.map(norm);
  NOMES_REAIS = [...new Set((await r.json()).data.flatMap((b) => [b.nome_completo, b.nome_social]).map(norm))]
    .filter((n) => n.split(" ").length >= 2 && n.length >= 8)
    .filter((n) => !elencoNorm.some((e) => e.includes(n)));
  console.log(`trava de vazamento: ${NOMES_REAIS.length} nomes reais carregados (só em memória)`);
}

/** Quantos nomes reais estão visíveis e sem borrão na tela (0 = seguro). */
async function nomesReaisVisiveis(page) {
  if (!NOMES_REAIS.length) return 0;
  return page.evaluate((nomes) => {
    const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    const borrado = (el) => { for (let e = el; e; e = e.parentElement) if ((e.style?.filter || "").includes("blur")) return true; return false; };
    let achados = 0;
    const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let no; (no = andar.nextNode()); ) {
      const el = no.parentElement;
      if (!el || borrado(el) || !el.getClientRects().length) continue;
      const t = norm(no.nodeValue);
      if (t.length >= 8 && nomes.some((n) => t.includes(n))) achados++;
    }
    return achados;
  }, NOMES_REAIS);
}
if (PRODUCAO && (!process.env.SESSAO_TOKEN_ARQUIVO || !process.env.NOME_SESSAO)) {
  console.error("--producao exige SESSAO_TOKEN_ARQUIVO (token estático da conta) e NOME_SESSAO (nome dela, para trocar pelo da usuária demo).");
  process.exit(1);
}

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
    .replaceAll("{senha_demo}", PRODUCAO ? "senha-ficticia" : (process.env.TEST_USER_PASSWORD ?? ""))
    .replaceAll("{proxima_semana}", proximaSemana());
}

/** `rotulo=X` é pelo rótulo do campo; o resto é seletor do Playwright. */
function localizar(page, seletor) {
  if (seletor.startsWith("rotulo=")) return page.getByLabel(seletor.slice(7)).first();
  // só o que está visível: janelas fechadas continuam no DOM, escondidas
  return page.locator(`${seletor} >> visible=true`).first();
}

async function esperarTela(page) {
  await page.waitForLoadState("networkidle", { timeout: ESPERA_MS }).catch(() => {});
  // telas que carregam dados no cliente mostram "Carregando..." antes
  await page.waitForFunction(
    () => !/Carregando/i.test(document.querySelector("main")?.innerText ?? ""),
    null, { timeout: ESPERA_MS },
  ).catch(() => {});
  // indicadores girando (busca de CPF, salvamento) ou barra/esqueleto de
  // carregamento pulsando (a lista de beneficiárias ao filtrar) ainda não terminaram
  await page.waitForFunction(
    () => ![...document.querySelectorAll(".animate-spin, .animate-pulse")].some((e) => e.getClientRects().length),
    null, { timeout: ESPERA_MS },
  ).catch(() => {});
  await page.waitForTimeout(400); // animações de entrada
}

/**
 * Modo produção: borra toda linha de tabela que não cite alguém do elenco e
 * troca o nome da conta que grava pelo da usuária de demonstração.
 */
/**
 * Por cena, no roteiro:
 *   "mascara": false   → tabelas desta tela não têm dado pessoal (conferido
 *                        num print): não borra linhas. A troca de nome segue.
 *   "borrar": [css…]   → borra também estes elementos (ex.: notificações).
 */
async function mascarar(page, cena) {
  if (!MASCARA) return;
  await page.evaluate(({ permitidos, parciais, exatas, linhas, extras }) => {
    const doElenco = (t) => permitidos.some((n) => t.includes(n));
    for (const el of extras.flatMap((sel) => [...document.querySelectorAll(sel)])) el.style.filter = "blur(8px)";
    // linhas de tabela, opções de listas (busca de beneficiária) e cartões
    // do quadro de demandas (colunas .custom-scrollbar do kanban)
    const ITENS = "tbody tr, [role=row], [role=option], [role=listbox] > *, .bg-popover button, .custom-scrollbar > *:not(:has(table)):not(:has(input))";
    for (const linha of document.querySelectorAll(ITENS)) {
      // cena sem máscara: desfaz o borrão que uma cena anterior deixou
      if (!linhas) { if ((linha.style.filter || "").includes("blur")) linha.style.filter = ""; continue; }
      if (linha.closest("thead")) continue;
      // linha de célula única = aviso da tabela ("nenhum registro"), não pessoa
      if (linha.querySelectorAll("td").length === 1) continue;
      linha.style.filter = doElenco(linha.innerText || "") ? "" : "blur(8px)";
    }
    const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let no; (no = andar.nextNode()); ) {
      let v = no.nodeValue;
      for (const [de, para] of parciais) if (de && v.includes(de)) v = v.split(de).join(para);
      for (const [de, para] of exatas) if (de && v.trim() === de) v = para;
      if (v !== no.nodeValue) no.nodeValue = v;
    }
  }, { ...MASCARA, linhas: cena?.mascara !== false, extras: cena?.borrar ?? [] });
}

async function executar(page, acao, onde) {
  const alvo = acao.seletor ? localizar(page, acao.seletor) : null;
  const falha = (e) => new Error(`${onde}: ação ${acao.tipo} em ${acao.seletor ?? acao.url ?? acao.tecla} — ${e.message.split("\n")[0]}`);
  try {
    switch (acao.tipo) {
      case "navegar":
        await page.goto(BASE_URL + acao.url, { waitUntil: "domcontentloaded" });
        break;
      case "clicar": {
        if (PRODUCAO && /Entrar no Sistema/.test(acao.seletor ?? "")) {
          await entrarPorToken(page.context());
          await page.goto(BASE_URL + "/dashboard", { waitUntil: "domcontentloaded" });
          break;
        }
        // Link interno: espera a rota mudar. O Next mantém a tela antiga até
        // a nova chegar, e o print saía da página anterior.
        const href = await alvo.getAttribute("href", { timeout: ESPERA_MS }).catch(() => null);
        // link que abre em outra aba (relatórios, certificados): abre aqui
        const novaAba = await alvo.evaluate((el) => {
          const a = el.closest("a");
          return a && a.target === "_blank" && a.getAttribute("href")?.startsWith("/") ? a.getAttribute("href") : null;
        }).catch(() => null);
        if (novaAba) {
          await page.goto(BASE_URL + novaAba, { waitUntil: "domcontentloaded" });
          break;
        }
        await alvo.click({ timeout: ESPERA_MS });
        if (href && href.startsWith("/")) {
          await page.waitForURL((u) => u.pathname === href.split(/[?#]/)[0], { timeout: 30000 });
        }
        break;
      }
      case "digitar":
        // Captura é imagem parada: o que importa é o campo preenchido.
        // Quase tudo de uma vez e as últimas letras teclada a tecla: com poucos eventos
        // de mudança o formulário ainda não se considera alterado (o rascunho
        // automático, por exemplo, não grava).
        {
          const texto = substituir(acao.texto);
          // data/hora não aceitam valor parcial: vão inteiros
          const tipoCampo = await alvo.getAttribute("type", { timeout: ESPERA_MS }).catch(() => null);
          const resto = /^(date|datetime-local|time|month|week)$/.test(tipoCampo ?? "") ? 0 : Math.min(3, texto.length);
          await alvo.fill(texto.slice(0, texto.length - resto), { timeout: ESPERA_MS });
          if (resto) await alvo.pressSequentially(texto.slice(texto.length - resto), { delay: 60, timeout: ESPERA_MS });
        }
        // busca com espera (debounce): o filtro só dispara depois de uma
        // pausa na digitação, e o print saía com a lista antiga carregando
        await page.waitForTimeout(1200);
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

/** Sessão por token estático: o cookie que o login gravaria. Sem senha. */
async function entrarPorToken(contexto) {
  const token = readFileSync(process.env.SESSAO_TOKEN_ARQUIVO, "utf8").trim();
  await contexto.addCookies([{ name: "directus_token", value: token, url: BASE_URL, httpOnly: true, sameSite: "Lax" }]);
}

async function capturarAula(navegador, id) {
  const aula = plano(id);
  if (PRODUCAO) MASCARA = { permitidos: nomesDoElenco(elenco, aula.elenco ?? []), ...TROCAS };
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

  if (aula.sessao !== "deslogada" && PRODUCAO) {
    await entrarPorToken(contexto);
  } else if (aula.sessao !== "deslogada") {
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

      await mascarar(page, cena);
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
      await mascarar(page, cena); // o scroll até o foco pode ter carregado linhas novas
      const vazando = await nomesReaisVisiveis(page);
      if (vazando) throw new Error(`${onde}: ${vazando} nome(s) de beneficiária REAL visível(is) sem borrão — print NÃO gravado`);
      const arquivo = `telas/${cena.id}.png`;
      await page.screenshot({ path: join(pastaDaAula(id), arquivo) });
      capturas[cena.id] = { arquivo, foco };
      console.log(`  ${onde} ✔${foco ? ` foco ${cena.foco.seletor}` : ""}`);
    }
  } catch (e) {
    // print do estado da falha (mascarado) para diagnóstico: <aula>/falha.png
    await mascarar(page, null).catch(() => {});
    if (!(await nomesReaisVisiveis(page).catch(() => 1))) {
      await page.screenshot({ path: join(pastaDaAula(id), "falha.png") }).catch(() => {});
    }
    throw e;
  } finally {
    await contexto.close();
  }

  writeFileSync(join(pastaDaAula(id), "captura.json"), JSON.stringify({
    aula: id, base_url: BASE_URL, modo: PRODUCAO ? "producao-mascarada" : "demonstracao", viewport: { largura, altura }, escala: cfg.video.escala_captura,
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
