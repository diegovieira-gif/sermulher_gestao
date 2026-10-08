// Passo 4 e 5 — monta o vídeo de cada aula a partir da narração (tempos.json)
// e das telas capturadas (captura.json).
//
//   cena de tela   → zoom suave sobre o elemento em foco, pela duração da fala
//   cena de cartão → tela de texto renderizada em HTML (título, linhas)
//   tudo junto     → narração com volume nivelado + legendas → <aula>.mp4
//
// Uso:
//   node scripts/aulas/montar.mjs 1.1
//   node scripts/aulas/montar.mjs --todas
//   … --legendas-queimadas   (legenda gravada na imagem, para mandar por
//                             WhatsApp; o padrão é faixa de legenda ligável)
//
// Saída em docs/aulas/saida/<aula>/: <aula>-<titulo>.mp4, legendas.srt e
// conferencia.jpg (miniaturas a cada cinco segundos, para revisar sem assistir).
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  blocosDeLegenda, config, duracaoDaCena, enquadramento, idsDaLinhaDeComando,
  lerJson, pastaDaAula, plano, RAIZ, srt,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const QUEIMAR = argv.includes("--legendas-queimadas");
const cfg = config();
const { largura: L, altura: A, fps: FPS } = cfg.video;

const ffmpeg = (args, opcoes = {}) =>
  execFileSync("ffmpeg", ["-nostdin", "-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit", ...opcoes });

const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/*
  Cartão no padrão visual do SIGMA (paleta clara do app). Corpo ≥ 34px e
  título ≥ 60px, e os 15% de baixo ficam livres para a legenda — regras do
  curso_inteligente, que testou isso em tela de celular.

  Identidade: o selo da Prefeitura (public/logo.png, o mesmo da barra lateral
  e do login) com "SERMULHER" e o nome da Secretaria, como no cabeçalho do
  app. Na CAPA (o primeiro cartão da aula) o selo aparece também em destaque.
*/
const LOGO = `data:image/png;base64,${readFileSync(join(RAIZ, "public", "logo.png")).toString("base64")}`;

function htmlDoCartao(cartao, aula, ehCapa) {
  const linhas = (cartao.linhas ?? []).map((l) => `<li>${escapar(l)}</li>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{width:${L}px;height:${A}px;font-family:"Segoe UI",system-ui,sans-serif;
      background:linear-gradient(135deg,#f7f5fa 0%,#efe9f7 100%);color:#2a2533;
      padding:70px 150px ${Math.round(A * cfg.video.rodape_livre_legenda) + 40}px;display:flex;flex-direction:column}
    .topo{display:flex;align-items:center;justify-content:space-between}
    .orgao{display:flex;align-items:center;gap:22px}
    .orgao img{width:92px;height:92px}
    .orgao b{display:block;font-size:30px;font-weight:700;color:#1f1a29;letter-spacing:.02em}
    .orgao span{display:block;font-size:21px;color:#6c6478;white-space:nowrap}
    .marca{font-size:28px;font-weight:600;color:#7b2fd6;letter-spacing:.06em;text-transform:uppercase}
    .corpo{flex:1;display:flex;align-items:center;gap:80px}
    .miolo{flex:1;display:flex;flex-direction:column;justify-content:center;gap:36px}
    .selo{width:420px;height:420px;flex:none;filter:drop-shadow(0 18px 40px rgba(31,26,41,.12))}
    .sub{font-size:36px;color:#6c6478;font-weight:500}
    h1{font-size:${(cartao.linhas?.length ?? 0) > 3 ? 72 : 88}px;line-height:1.08;font-weight:750;color:#1f1a29;
      border-left:14px solid #7b2fd6;padding-left:36px}
    ul{list-style:none;display:flex;flex-direction:column;gap:22px;padding-left:50px}
    li{font-size:42px;line-height:1.25;position:relative}
    li::before{content:"";position:absolute;left:-40px;top:.45em;width:16px;height:16px;border-radius:50%;background:#7b2fd6}
  </style></head><body>
    <div class="topo">
      <div class="orgao"><img src="${LOGO}" alt="">
        <div><b>SERMULHER</b><span>Secretaria Municipal do Respeito às Políticas para as Mulheres</span></div></div>
      <div class="marca">SIGMA · Aula ${escapar(aula.id)}</div>
    </div>
    <div class="corpo">
      <div class="miolo">
        ${cartao.subtitulo ? `<div class="sub">${escapar(cartao.subtitulo)}</div>` : ""}
        <h1>${escapar(cartao.titulo)}</h1>
        ${linhas ? `<ul>${linhas}</ul>` : ""}
      </div>
      ${ehCapa ? `<img class="selo" src="${LOGO}" alt="">` : ""}
    </div></body></html>`;
}

async function renderizarCartoes(navegador, aula, pasta) {
  const page = await navegador.newPage({ viewport: { width: L, height: A } });
  try {
    for (const cena of aula.cenas.filter((c) => c.tipo === "cartao")) {
      const ehCapa = cena === aula.cenas[0];
      await page.setContent(htmlDoCartao(cena.cartao, aula, ehCapa));
      await page.screenshot({ path: join(pasta, "cartoes", `${cena.id}.png`) });
    }
  } finally {
    await page.close();
  }
}

/** Filtro de vídeo de uma cena de tela: faixa 16:9 + zoom suave no foco. */
function filtroDaTela(captura, dur) {
  const largura = captura.viewport.largura * captura.escala;
  const altura = captura.viewport.altura * captura.escala;
  const quadros = Math.max(1, Math.round(dur * FPS));
  const e = enquadramento(captura.foco, largura, altura, captura.foco?.zoom);
  // Ampliar antes do zoompan evita o "tremido" do arredondamento de pixels.
  const k = 3840 / largura;
  const cx = (e.cx * k).toFixed(1), cy = (e.cy * k).toFixed(1);
  const facilitar = Math.max(1, Math.round(Math.min(1.4, dur * 0.45) * FPS));
  const z = e.zoom === 1 ? "1" : `if(lte(on,${facilitar}),1+${(e.zoom - 1).toFixed(3)}*(0.5-0.5*cos(PI*on/${facilitar})),${e.zoom})`;
  return [
    `crop=${largura}:${e.faixaAlt}:0:${e.faixaY}`,
    `scale=3840:-2`,
    `zoompan=z='${z}':x='max(0,min(${cx}-iw/zoom/2,iw-iw/zoom))':y='max(0,min(${cy}-ih/zoom/2,ih-ih/zoom))':d=${quadros}:s=${L}x${A}:fps=${FPS}`,
    "format=yuv420p",
  ].join(",");
}

async function montarAula(navegador, id) {
  const aula = plano(id);
  const pasta = pastaDaAula(id);
  const arquivoTempos = join(pasta, "tempos.json");
  if (!existsSync(arquivoTempos)) throw new Error(`falta a narração: rode narrar.mjs ${id} (ou --estimar para ensaiar)`);
  const tempos = Object.fromEntries(lerJson(arquivoTempos).cenas.map((c) => [c.id, c]));
  const modo = lerJson(arquivoTempos).modo;
  const temTela = aula.cenas.some((c) => (c.tipo ?? "tela") === "tela");
  const arquivoCaptura = join(pasta, "captura.json");
  if (temTela && !existsSync(arquivoCaptura)) throw new Error(`faltam as telas: rode capturar.mjs ${id}`);
  const captura = temTela ? lerJson(arquivoCaptura) : { cenas: {} };

  for (const sub of ["cartoes", "trechos"]) mkdirSync(join(pasta, sub), { recursive: true });
  await renderizarCartoes(navegador, aula, pasta);

  const lista = [];
  const blocos = [];
  let relogio = 0;
  for (const cena of aula.cenas) {
    const t = tempos[cena.id];
    if (!t) throw new Error(`cena ${cena.id} sem áudio no tempos.json — rode narrar.mjs ${id} de novo`);
    const dur = +duracaoDaCena(cena, t.audio).toFixed(3);
    const trecho = join(pasta, "trechos", `${cena.id}.mp4`);
    const audio = join(pasta, t.arquivo);
    const saidaComum = ["-t", String(dur), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-r", String(FPS), "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "1", trecho];

    if (cena.tipo === "cartao") {
      ffmpeg(["-loop", "1", "-framerate", String(FPS), "-i", join(pasta, "cartoes", `${cena.id}.png`),
        "-i", audio, "-filter_complex", `[0:v]format=yuv420p[v];[1:a]apad[a]`, "-map", "[v]", "-map", "[a]", ...saidaComum]);
    } else {
      const c = captura.cenas[cena.id];
      if (!c) throw new Error(`cena ${cena.id} sem tela capturada — rode capturar.mjs ${id} de novo`);
      const filtro = filtroDaTela({ ...c, viewport: captura.viewport, escala: captura.escala }, dur);
      ffmpeg(["-i", join(pasta, c.arquivo), "-i", audio,
        "-filter_complex", `[0:v]${filtro}[v];[1:a]apad[a]`, "-map", "[v]", "-map", "[a]", ...saidaComum]);
    }
    lista.push(`file '${trecho.replace(/\\/g, "/")}'`);
    blocos.push(...blocosDeLegenda(cena.narracao, relogio + 0.05, t.audio));
    relogio += dur;
  }

  writeFileSync(join(pasta, "trechos.txt"), lista.join("\n") + "\n");
  writeFileSync(join(pasta, "legendas.srt"), srt(blocos), "utf8");
  const junto = join(pasta, "junto.mp4");
  ffmpeg(["-f", "concat", "-safe", "0", "-i", join(pasta, "trechos.txt"), "-c", "copy", junto]);

  const nome = `${id}-${slug(aula.titulo)}.mp4`;
  const titulo = `SIGMA · ${id} — ${aula.titulo}`;
  // Volume nivelado em -16 LUFS (padrão de fala em plataformas de vídeo).
  const audioFinal = ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k"];
  if (QUEIMAR) {
    // cwd na pasta: o filtro `subtitles` não aceita bem o "C:" do Windows.
    ffmpeg(["-i", "junto.mp4", "-vf", "subtitles=legendas.srt:force_style='FontName=Segoe UI,FontSize=13,Outline=2,MarginV=36'",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", ...audioFinal, "-metadata", `title=${titulo}`, nome], { cwd: pasta });
  } else {
    ffmpeg(["-i", junto, "-i", join(pasta, "legendas.srt"), "-map", "0:v", "-map", "0:a", "-map", "1",
      "-c:v", "copy", ...audioFinal, "-c:s", "mov_text", "-metadata:s:s:0", "language=por",
      "-metadata", `title=${titulo}`, join(pasta, nome)]);
  }
  ffmpeg(["-i", join(pasta, nome), "-vf", "fps=1/5,scale=480:-2,tile=4x4:padding=6:color=white", "-frames:v", "1", join(pasta, "conferencia.jpg")]);
  rmSync(junto);

  const aviso = modo === "estimado" ? " — ENSAIO: narração estimada (silêncio), sem voz" : "";
  console.log(`${id}: ${nome} · ${Math.floor(relogio / 60)}min${String(Math.round(relogio % 60)).padStart(2, "0")}${aviso}`);
}

const navegador = await chromium.launch();
const falhas = [];
try {
  for (const id of idsDaLinhaDeComando(argv)) {
    try { await montarAula(navegador, id); }
    catch (e) { falhas.push(id); console.error(`${id}: FALHOU — ${e.message}`); }
  }
} finally {
  await navegador.close();
}
if (falhas.length) {
  console.error(`\n${falhas.length} aula(s) com falha: ${falhas.join(", ")}`);
  process.exitCode = 1;
}
