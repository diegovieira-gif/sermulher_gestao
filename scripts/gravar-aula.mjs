// Grava o vídeo de um plano de aula, sincronizado com a narração já gerada.
//
// Cada cena permanece na tela pelo tempo exato do seu áudio (lido de
// audio/<aula>/tempos.json). Sem o arquivo de tempos, usa a estimativa por
// tamanho do texto — o que permite ensaiar a aula inteira sem gastar TTS.
//
// IMPORTANTE — grave contra uma instância LOCAL com dados fictícios:
//  - A produção fica atrás de um WAF que bloqueia navegador headless
//    ("Web Page Blocked"), então a gravação simplesmente falha lá.
//  - E, sobretudo, um vídeo institucional com o nome real de uma mulher em
//    situação de violência é um vazamento permanente.
//
// Uso:
//   BASE_URL=http://localhost:3000 \
//   TEST_USER_EMAIL=demo@... TEST_USER_PASSWORD=... \
//   node scripts/gravar-aula.mjs docs/aulas/1.1-cadastrar-beneficiaria.json
import { chromium } from "@playwright/test";
import { readFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { dirname, join, basename } from "node:path";

const PLANO = process.argv[2];
if (!PLANO) {
  console.error("uso: node scripts/gravar-aula.mjs <plano.json>");
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL;
const SENHA = process.env.TEST_USER_PASSWORD;

const plano = JSON.parse(readFileSync(PLANO, "utf8"));
const pastaAula = dirname(PLANO);
const arquivoTempos = join(pastaAula, "audio", plano.id, "tempos.json");
const saidaVideo = join(pastaAula, "video");
mkdirSync(saidaVideo, { recursive: true });

const tempos = existsSync(arquivoTempos)
  ? JSON.parse(readFileSync(arquivoTempos, "utf8")).cenas
  : null;

if (!tempos) {
  console.log("⚠ tempos.json ausente — usando estimativa por tamanho do texto.");
  console.log("  Rode gerar-narracao.mjs antes para sincronizar com o áudio real.\n");
}

const duracaoCena = (cena) =>
  (tempos?.[cena.id]?.duracao ?? Math.max(2, cena.narracao.length / 14)) * 1000;

/**
 * Cursor falso.
 *
 * O Playwright não desenha o ponteiro no vídeo gravado — sem isto, o
 * espectador vê campos se preenchendo sozinhos, o que não ensina nada. Este
 * cursor segue as coordenadas reais do mouse e pulsa no clique.
 *
 * Injetado por addInitScript para sobreviver a cada navegação.
 */
const CURSOR = `(() => {
  if (window.__cursorPronto__) return;
  window.__cursorPronto__ = true;
  const add = () => {
    if (document.getElementById('__cursor__')) return;
    const c = document.createElement('div');
    c.id = '__cursor__';
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;pointer-events:none;background:rgba(147,51,234,.35);border:2px solid rgba(147,51,234,.95);box-shadow:0 0 0 2px rgba(255,255,255,.6);transition:transform .09s ease-out;left:-99px;top:-99px';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', e => {
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    }, true);
  };
  window.__pulso__ = () => {
    const c = document.getElementById('__cursor__');
    if (!c) return;
    c.style.transform = 'scale(1.9)';
    setTimeout(() => { c.style.transform = 'scale(1)'; }, 170);
  };
  window.__destacar__ = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const h = document.createElement('div');
    h.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #a855f7;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.28);transition:opacity .3s';
    h.style.left = (r.left - 6) + 'px'; h.style.top = (r.top - 6) + 'px';
    h.style.width = (r.width + 12) + 'px'; h.style.height = (r.height + 12) + 'px';
    h.id = '__destaque__';
    document.querySelectorAll('#__destaque__').forEach(n => n.remove());
    document.documentElement.appendChild(h);
    return true;
  };
  window.__limparDestaque__ = () => {
    document.querySelectorAll('#__destaque__').forEach(n => {
      n.style.opacity = '0'; setTimeout(() => n.remove(), 320);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})()`;

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: saidaVideo, size: { width: 1280, height: 720 } },
  locale: "pt-BR",
  timezoneId: "America/Maceio",
});
await contexto.addInitScript(CURSOR);
const pagina = await contexto.newPage();

/**
 * Move o mouse até o elemento antes de clicar, para o gesto ser legível.
 *
 * Timeout curto de propósito: o padrão do Playwright é 30s, e um seletor errado
 * congelaria a cena por meia minuto de vídeo morto antes de sequer reclamar.
 * Aqui o movimento é enfeite — se o elemento não está lá, a falha real vem logo
 * depois, no clique, com mensagem melhor.
 */
async function mouseAte(seletor) {
  try {
    const caixa = await pagina.locator(seletor).first().boundingBox({ timeout: 2500 });
    if (!caixa) return;
    await pagina.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2, { steps: 24 });
    await pagina.waitForTimeout(220);
    await pagina.evaluate(() => window.__pulso__ && window.__pulso__());
  } catch {
    // Sem posição não há gesto a fazer; segue para a ação em si.
  }
}

async function login() {
  if (!EMAIL || !SENHA) {
    console.log("⚠ TEST_USER_EMAIL/TEST_USER_PASSWORD ausentes — seguindo sem login.");
    console.log("  A aula precisa de sessão; use uma conta de DEMONSTRAÇÃO, nunca a real.\n");
    return false;
  }
  await pagina.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await pagina.locator('input[name="email"]').fill(EMAIL);
  await pagina.locator('input[name="password"]').fill(SENHA);
  await pagina.locator('button[type="submit"]').click();
  await pagina.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });
  return true;
}

async function executar(acao) {
  if (!acao || acao.tipo === "nenhuma") return;

  switch (acao.tipo) {
    case "navegar":
      await pagina.goto(`${BASE_URL}${acao.url}`, { waitUntil: "domcontentloaded" });
      await pagina.waitForTimeout(700);
      break;

    case "clicar":
      await mouseAte(acao.seletor);
      await pagina.locator(acao.seletor).first().click();
      await pagina.waitForTimeout(500);
      break;

    case "digitar":
      await mouseAte(acao.seletor);
      await pagina.locator(acao.seletor).first().click();
      // Caractere a caractere: preencher de uma vez não mostra o que está
      // sendo digitado, e a aula perde justamente o que precisa ensinar.
      await pagina.locator(acao.seletor).first().pressSequentially(acao.texto, { delay: 55 });
      break;

    case "destacar": {
      await mouseAte(acao.seletor);
      const achou = await pagina.evaluate((s) => window.__destacar__(s), acao.seletor);
      if (!achou) console.log(`     ⚠ seletor não encontrado para destaque: ${acao.seletor}`);
      break;
    }

    case "rolar":
      await pagina.locator(acao.seletor).first().scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(400);
      break;

    case "esperar":
      await pagina.waitForTimeout(acao.ms || 1000);
      break;

    default:
      console.log(`     ⚠ tipo de ação desconhecido: ${acao.tipo}`);
  }
}

console.log(`→ aula ${plano.id}: ${plano.titulo}`);
console.log(`→ ${plano.cenas.length} cenas | base: ${BASE_URL}\n`);

const inicio = Date.now();
let falhas = 0;

try {
  await login();

  for (const cena of plano.cenas) {
    const alvo = duracaoCena(cena);
    const t0 = Date.now();
    process.stdout.write(`  ${cena.id}  ${(alvo / 1000).toFixed(1)}s  `);

    try {
      await executar(cena.acao);
    } catch (e) {
      falhas++;
      console.log(`\n     ❌ ${String(e.message).split("\n")[0].slice(0, 120)}`);
    }

    // Completa o tempo da cena para casar com a narração. Se a ação demorou
    // mais que o áudio, a cena estoura — registrado para ajuste do texto.
    const restante = alvo - (Date.now() - t0);
    if (restante > 0) await pagina.waitForTimeout(restante);
    else console.log(`     ⚠ cena estourou ${Math.abs(restante / 1000).toFixed(1)}s`);

    await pagina.evaluate(() => window.__limparDestaque__ && window.__limparDestaque__());
    if (restante > 0) console.log("ok");
  }
} finally {
  await contexto.close();
  await navegador.close();
}

// O Playwright nomeia o vídeo com um hash; renomeia para o id da aula.
const brutos = readdirSync(saidaVideo).filter((f) => /^[0-9a-f]{16,}\.webm$/.test(f));
for (const bruto of brutos) {
  const destino = join(saidaVideo, `${plano.id}-${basename(PLANO, ".json")}.webm`);
  renameSync(join(saidaVideo, bruto), destino);
  const kb = Math.round(statSync(destino).size / 1024);
  console.log(`\n✅ vídeo: ${destino} (${kb} KB)`);
}

console.log(`→ duração: ${Math.round((Date.now() - inicio) / 1000)}s | cenas com falha: ${falhas}`);
if (falhas > 0) {
  console.log("⚠ Há cenas que falharam — o vídeo saiu, mas com passos ausentes.");
  process.exitCode = 1;
}
