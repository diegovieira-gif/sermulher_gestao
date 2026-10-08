// Publica aulas montadas no Curso Sigma (menu Sistema → Curso Sigma).
//
// Para cada aula: sobe o vídeo e a capa (o cartão de abertura) para a pasta
// "Curso Sigma" da biblioteca do Directus e cria/atualiza a linha em
// curso_sigma_aulas, já publicada. Republicar troca o vídeo e apaga o antigo;
// o progresso de quem já assistiu é mantido.
//
// Uso:
//   node scripts/aulas/publicar-curso.mjs 0.1 0.2            (mostra o que faria)
//   node scripts/aulas/publicar-curso.mjs 0.1 0.2 --aplicar
//
// Só publique aula APROVADA: o vídeo fica visível para todas as usuárias.
// Credencial: DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO (caminho).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { carregarEnvLocal, idsDaLinhaDeComando, pastaDaAula, plano } from "./lib.mjs";

carregarEnvLocal();
const APLICAR = process.argv.includes("--aplicar");
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) { console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO."); process.exit(1); }
const AUTH = { Authorization: `Bearer ${readFileSync(arquivo, "utf8").trim()}` };

async function api(caminho, opcoes = {}) {
  const r = await fetch(URL_ + caminho, { ...opcoes, headers: { ...AUTH, ...(opcoes.body instanceof FormData ? {} : { "Content-Type": "application/json" }) } });
  const corpo = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method || "GET"} ${caminho.split("?")[0]} → ${r.status} ${JSON.stringify(corpo.errors?.[0]?.message ?? "")}`);
  return corpo.data;
}

async function subir(caminho, tipo, titulo, pasta) {
  const form = new FormData();
  form.append("folder", pasta);
  form.append("title", titulo);
  form.append("file", new Blob([readFileSync(caminho)], { type: tipo }), basename(caminho));
  return (await api("/files", { method: "POST", body: form })).id;
}

const segundos = (mp4) => Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim()));
// "1.2" → 102: a ordem da trilha
const ordem = (codigo) => { const [m, a] = codigo.split(".").map(Number); return m * 100 + a; };

const ids = idsDaLinhaDeComando(process.argv.slice(2));
if (!ids.length) { console.error("Informe as aulas: node scripts/aulas/publicar-curso.mjs 0.1 0.2 [--aplicar]"); process.exit(1); }

const [pastaCurso] = await api(`/folders?filter=${encodeURIComponent(JSON.stringify({ name: { _eq: "Curso Sigma" } }))}`);
if (!pastaCurso) { console.error('Pasta "Curso Sigma" não existe: rode scripts/aulas/curso-esquema.mjs --aplicar'); process.exit(1); }

for (const id of ids) {
  const roteiro = plano(id);
  const pasta = pastaDaAula(id);
  const mp4 = existsSync(pasta) && readdirSync(pasta).find((f) => f.endsWith(".mp4"));
  const cartao = join(pasta, "cartoes", "c01.png");
  if (!mp4) { console.error(`✘ ${id}: vídeo não montado em ${pasta}`); process.exitCode = 1; continue; }
  const video = join(pasta, mp4);
  const capa = join(pasta, "capa.jpg");
  if (existsSync(cartao)) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", cartao, "-vf", "scale=1280:-2", "-q:v", "3", capa]);

  const dados = {
    codigo: id,
    modulo: roteiro.modulo,
    titulo: roteiro.titulo,
    descricao: roteiro.objetivo ?? null,
    duracao_segundos: segundos(video),
    ordem: ordem(id),
    publicada: true,
  };
  const [atual] = await api(`/items/curso_sigma_aulas?fields=id,video,capa&limit=1&filter=${encodeURIComponent(JSON.stringify({ codigo: { _eq: id } }))}`);
  if (!APLICAR) { console.log(`${atual ? "~" : "+"} ${id} ${dados.titulo} · ${dados.duracao_segundos}s (simulação)`); continue; }

  const novoVideo = await subir(video, "video/mp4", `Aula ${id} — ${dados.titulo}`, pastaCurso.id);
  const novaCapa = existsSync(capa) ? await subir(capa, "image/jpeg", `Capa da aula ${id}`, pastaCurso.id) : null;
  const corpo = JSON.stringify({ ...dados, video: novoVideo, capa: novaCapa });
  const linha = atual
    ? await api(`/items/curso_sigma_aulas/${atual.id}`, { method: "PATCH", body: corpo })
    : await api("/items/curso_sigma_aulas", { method: "POST", body: corpo });
  // arquivos da versão anterior saem da biblioteca
  for (const velho of [atual?.video, atual?.capa].filter(Boolean)) await api(`/files/${velho}`, { method: "DELETE" }).catch(() => {});
  console.log(`${atual ? "~" : "+"} ${id} ${dados.titulo} · ${dados.duracao_segundos}s → aula #${linha.id}`);
}
