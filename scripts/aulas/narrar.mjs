// Passo 2 — narração das aulas com a ElevenLabs (voz em docs/aulas/config.json).
//
// Um mp3 por cena, em docs/aulas/saida/<aula>/audio/, e um tempos.json com a
// duração REAL de cada um: é o relógio que o montar.mjs usa.
//
// Uso:
//   node scripts/aulas/narrar.mjs 1.1 --estimar   (ensaio: silêncio, sem API, sem custo)
//   node scripts/aulas/narrar.mjs 1.1             (narração de verdade)
//   node scripts/aulas/narrar.mjs --todas         (curso inteiro)
//   … --forcar                                    (regera mesmo o que não mudou)
//
// Credencial: ELEVENLABS_API_KEY na sessão do terminal — não é configuração do
// sistema, não vai no .env.local nem no Coolify. Lida só quando
// há narração de verdade — o modo --estimar roda sem ela.
//
// ┌─ O QUE APRENDEMOS COM OS OUTROS PROJETOS ────────────────────────────────┐
// │ • Corpo da requisição como Buffer UTF-8: mandado como string, a API     │
// │   devolveu `invalid_unicode` em toda frase com acento (novelinhas,      │
// │   11/09/2026).                                                          │
// │ • A chave vai no cabeçalho, nunca na URL — URL vaza em log e em erro.   │
// │ • Não confie no "ok" do TTS (curso_inteligente): áudio mudo, lido duas  │
// │   vezes ou cortado saíram todos com status 200. Por isso as GUARDAS     │
// │   abaixo medem o arquivo; reprovado, tenta uma vez mais e então falha   │
// │   alto, apontando a cena.                                               │
// │ • Cada mp3 guarda a marca do texto e da voz que o geraram; só a cena    │
// │   que mudou é regerada (o modelo não é determinístico — renarrar tudo   │
// │   faria a voz variar de graça).                                         │
// └──────────────────────────────────────────────────────────────────────────┘
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  aplicarPronuncia, carregarEnvLocal, config, estimarSegundos, glossario,
  idsDaLinhaDeComando, marca, pastaDaAula, plano,
} from "./lib.mjs";

carregarEnvLocal();
const argv = process.argv.slice(2);
const ESTIMAR = argv.includes("--estimar");
const FORCAR = argv.includes("--forcar");

const voz = config().voz;
const termos = glossario();
const assinaturaVoz = ESTIMAR ? "estimado" : `${voz.provedor}:${voz.voz_id}:${voz.modelo}`;

const segundos = (arquivo) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", arquivo], { encoding: "utf8" }).trim());

/** Guardas medidas no arquivo. Devolve a lista de problemas (vazia = aprovado). */
function conferirAudio(arquivo, texto) {
  const problemas = [];
  const bytes = statSync(arquivo).size;
  if (bytes < 4000) problemas.push(`arquivo de ${bytes} bytes — áudio vazio`);
  const dur = segundos(arquivo);
  const esperado = estimarSegundos(texto);
  if (dur > esperado * 1.8 + 1) problemas.push(`${dur.toFixed(1)}s para ~${esperado}s esperados — leitura em dobro?`);
  if (dur < esperado * 0.45) problemas.push(`${dur.toFixed(1)}s para ~${esperado}s esperados — fala cortada?`);
  // O silencedetect escreve só no STDERR, e o ffmpeg sai com código 0 —
  // execFileSync devolveria o stdout vazio e a guarda passaria sempre.
  const saida = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", arquivo,
    "-af", "silencedetect=noise=-40dB:d=1.8", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  for (const m of saida.matchAll(/silence_start: ([\d.]+)/g)) {
    const inicio = Number(m[1]);
    if (inicio > 0.5 && inicio < dur - 2) problemas.push(`silêncio longo aos ${inicio.toFixed(1)}s`);
  }
  return { problemas, dur };
}

async function falarEleven(texto, anterior, seguinte, destino) {
  const chave = process.env.ELEVENLABS_API_KEY;
  if (!chave) {
    throw new Error("falta ELEVENLABS_API_KEY na sessão do terminal (ou rode com --estimar para ensaiar sem custo)");
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voz.voz_id}?output_format=${voz.formato}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json" },
    body: Buffer.from(JSON.stringify({
      text: texto,
      model_id: voz.modelo,
      voice_settings: voz.ajustes,
      // Contexto vizinho: a entonação de uma cena continua a da anterior em
      // vez de "recomeçar" a cada arquivo, sem que essas frases sejam lidas.
      previous_text: anterior || undefined,
      next_text: seguinte || undefined,
    }), "utf8"),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 160)}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

function silencio(segs, destino) {
  execFileSync("ffmpeg", ["-nostdin", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
    "-t", String(segs), "-c:a", "libmp3lame", "-q:a", "4", destino], { stdio: "ignore" });
}

async function narrarAula(id) {
  const aula = plano(id);
  const pasta = join(pastaDaAula(id), "audio");
  mkdirSync(pasta, { recursive: true });
  const arquivoTempos = join(pastaDaAula(id), "tempos.json");
  const anteriores = existsSync(arquivoTempos)
    ? Object.fromEntries(JSON.parse(readFileSync(arquivoTempos, "utf8")).cenas.map((c) => [c.id, c]))
    : {};

  const falas = aula.cenas.map((c) => aplicarPronuncia(c.narracao, termos));
  const cenas = [];
  let geradas = 0;
  for (const [i, cena] of aula.cenas.entries()) {
    const texto = falas[i];
    const mp3 = join(pasta, `${cena.id}.mp3`);
    const assinatura = marca(texto, assinaturaVoz);
    const antes = anteriores[cena.id];
    const precisa = FORCAR || !existsSync(mp3) || !antes || antes.marca !== assinatura;

    if (precisa) {
      if (ESTIMAR) {
        silencio(estimarSegundos(texto), mp3);
      } else {
        let tentativa = 0;
        for (;;) {
          tentativa++;
          await falarEleven(texto, falas[i - 1], falas[i + 1], mp3);
          const { problemas } = conferirAudio(mp3, texto);
          if (!problemas.length) break;
          if (tentativa >= 2) throw new Error(`cena ${cena.id} reprovada duas vezes: ${problemas.join("; ")}`);
          console.warn(`  ${id}/${cena.id}: ${problemas.join("; ")} — tentando de novo`);
        }
      }
      geradas++;
    }
    cenas.push({ id: cena.id, arquivo: `audio/${cena.id}.mp3`, audio: +segundos(mp3).toFixed(2), marca: assinatura });
  }

  writeFileSync(arquivoTempos, JSON.stringify({ aula: id, voz: assinaturaVoz, modo: ESTIMAR ? "estimado" : "narrado", cenas }, null, 2));
  const total = cenas.reduce((s, c) => s + c.audio, 0);
  console.log(`${id}: ${geradas} de ${cenas.length} cenas ${ESTIMAR ? "estimadas" : "narradas"} · ${Math.floor(total / 60)}min${String(Math.round(total % 60)).padStart(2, "0")} de fala`);
}

const ids = idsDaLinhaDeComando(argv);
const falhas = [];
for (const id of ids) {
  try { await narrarAula(id); }
  catch (e) { falhas.push(id); console.error(`${id}: FALHOU — ${e.message}`); }
}
if (falhas.length) {
  console.error(`\n${falhas.length} aula(s) com falha: ${falhas.join(", ")}`);
  process.exitCode = 1;
}
