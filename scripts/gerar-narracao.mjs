// Gera a narração de um plano de aula com a API de TTS da OpenAI.
//
// Roda ANTES da gravação, e não por acaso: o áudio é o relógio da aula. Cada
// cena vira um arquivo, a duração real de cada um é medida, e é ela que diz ao
// Playwright quanto tempo a tela deve permanecer em cada passo. O caminho
// inverso — gravar solto e depois esticar o áudio — desmonta a cada mudança de
// tela.
//
// Uso:
//   OPENAI_API_KEY=... node scripts/gerar-narracao.mjs docs/aulas/1.1-*.json
//   node scripts/gerar-narracao.mjs <plano> --estimar   (sem API: só estima)
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";

const PLANO = process.argv[2];
const SO_ESTIMAR = process.argv.includes("--estimar");

if (!PLANO) {
  console.error("uso: node scripts/gerar-narracao.mjs <plano.json> [--estimar]");
  process.exit(1);
}

const plano = JSON.parse(readFileSync(PLANO, "utf8"));
const saida = join(dirname(PLANO), "audio", plano.id);
mkdirSync(saida, { recursive: true });

/**
 * Duração estimada da narração, em segundos.
 *
 * Serve de plano B quando não há chave da API (permite testar a gravação
 * inteira sem gastar crédito) e de conferência: se a duração real fugir muito
 * da estimativa, o texto provavelmente tem algo que o TTS lê de forma
 * inesperada — sigla, número, abreviação.
 *
 * ~14 caracteres por segundo é a taxa observada para português falado em ritmo
 * instrutivo.
 */
function estimarSegundos(texto) {
  return Math.max(2, Math.round((texto.length / 14) * 10) / 10);
}

/** Duração real do mp3 via ffprobe. Retorna null se não estiver instalado. */
function medirSegundos(arquivo) {
  try {
    const saida = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo],
      { encoding: "utf8" },
    );
    const s = parseFloat(saida.trim());
    return Number.isFinite(s) ? Math.round(s * 10) / 10 : null;
  } catch {
    return null;
  }
}

async function sintetizar(texto, destino) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) throw new Error("OPENAI_API_KEY não definida");

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: plano.voz?.modelo || "gpt-4o-mini-tts",
      voice: plano.voz?.voz || "nova",
      input: texto,
      speed: plano.voz?.velocidade ?? 1.0,
      ...(plano.voz?.instrucao ? { instructions: plano.voz.instrucao } : {}),
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    throw new Error(`TTS falhou (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }

  writeFileSync(destino, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  console.log(`→ aula ${plano.id}: ${plano.titulo}`);
  console.log(`→ ${plano.cenas.length} cenas | saída: ${saida}`);
  if (SO_ESTIMAR) console.log("→ modo estimativa: nenhum áudio será gerado\n");

  const tempos = {};
  let total = 0;

  for (const cena of plano.cenas) {
    const destino = join(saida, `${cena.id}.mp3`);
    const estimado = estimarSegundos(cena.narracao);
    let real = null;

    if (!SO_ESTIMAR) {
      if (existsSync(destino) && statSync(destino).size > 0) {
        console.log(`  ${cena.id}  (já existe, pulado)`);
      } else {
        await sintetizar(cena.narracao, destino);
        console.log(`  ${cena.id}  gerado`);
      }
      real = medirSegundos(destino);
    }

    const duracao = real ?? estimado;
    tempos[cena.id] = { duracao, estimado, real, caracteres: cena.narracao.length };
    total += duracao;

    if (real !== null && Math.abs(real - estimado) > Math.max(3, estimado * 0.4)) {
      console.log(
        `     ⚠ duração real ${real}s destoa da estimativa ${estimado}s — confira como o texto é lido`,
      );
    }
  }

  const mapa = join(saida, "tempos.json");
  writeFileSync(mapa, JSON.stringify({ aula: plano.id, total, cenas: tempos }, null, 2));

  const alvo = plano.duracao_alvo_seg;
  console.log(`\n→ duração total: ${Math.round(total)}s (${(total / 60).toFixed(1)} min)`);
  if (alvo && total > alvo * 1.2) {
    console.log(
      `⚠ passou do alvo de ${alvo}s. Vídeo longo demais é vídeo que ninguém reassiste — considere cortar texto ou dividir a aula.`,
    );
  }
  console.log(`→ tempos gravados em ${basename(mapa)}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
