// Peças comuns da produção das vídeo-aulas (docs/aulas/README.md).
//
// Tudo aqui é função pura ou leitura de arquivo — nada chama API, abre
// navegador ou roda ffmpeg. É o que os testes unitários exercitam
// (tests/unit/aulas-producao.spec.ts) e o que os três passos compartilham:
// narrar.mjs, capturar.mjs e montar.mjs.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export const RAIZ = process.cwd();
export const PASTA_AULAS = join(RAIZ, "docs", "aulas");
/** Tudo que é gerado (áudio, telas, vídeo) mora aqui — fora do Git. */
export const PASTA_SAIDA = join(PASTA_AULAS, "saida");

/** ~14 caracteres por segundo: ritmo observado de português instrutivo. */
export const CARACTERES_POR_SEG = 14;
/** Silêncio depois de cada cena, para a fala não emendar na próxima tela. */
export const RESPIRO_SEG = 0.6;
/** Cartão sem quase nenhuma fala ainda precisa ficar na tela para ser lido. */
export const CARTAO_MINIMO_SEG = 2.5;

export const lerJson = (caminho) => JSON.parse(readFileSync(caminho, "utf8"));

/** Lê o .env.local (fora do Git) sem sobrescrever o que já está no ambiente. */
export function carregarEnvLocal(raiz = RAIZ) {
  const caminho = join(raiz, ".env.local");
  if (!existsSync(caminho)) return;
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export const config = () => lerJson(join(PASTA_AULAS, "config.json"));
export const glossario = () => lerJson(join(PASTA_AULAS, "pronuncia.json"));

/** Todos os planos de aula, em ordem (0.1, 0.2, …, 8.6). */
export function planos() {
  return readdirSync(PASTA_AULAS)
    .filter((n) => /^\d+\.\d+-.+\.json$/.test(n))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
    .map((n) => ({ arquivo: join(PASTA_AULAS, n), ...lerJson(join(PASTA_AULAS, n)) }));
}

export function plano(id) {
  const achado = planos().find((p) => p.id === id);
  if (!achado) throw new Error(`aula ${id} não existe em docs/aulas`);
  return achado;
}

/** Ids pedidos na linha de comando, ou todos com `--todas`. */
export function idsDaLinhaDeComando(argv) {
  if (argv.includes("--todas")) return planos().map((p) => p.id);
  const ids = argv.filter((a) => /^\d+\.\d+$/.test(a));
  if (!ids.length) throw new Error("diga quais aulas (ex.: 1.1 2.3) ou use --todas");
  return ids;
}

export const pastaDaAula = (id) => join(PASTA_SAIDA, id);

/**
 * Aplica o glossário de pronúncia: "o CPF" vira "o cê pê éfe" para a voz.
 *
 * Palavra inteira e respeitando maiúsculas — "PIA" (o plano) muda, "pia" da
 * cozinha não. A fronteira é por letra Unicode, não `\b`: em JavaScript o `\b`
 * trata "é" como fim de palavra e cortaria "CPFé" ao meio.
 * Chaves começando por "_" são comentário do arquivo.
 */
export function aplicarPronuncia(texto, termos) {
  let saida = String(texto);
  const chaves = Object.keys(termos)
    .filter((k) => !k.startsWith("_"))
    .sort((a, b) => b.length - a.length); // "SUAS" antes de "SUS"
  for (const chave of chaves) {
    const escapada = chave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapada}(?![\\p{L}\\p{N}])`, "gu");
    saida = saida.replace(re, termos[chave]);
  }
  return saida;
}

/**
 * Marca de origem de um áudio: de qual texto e de qual voz ele nasceu.
 * Mudou o texto ou a voz, a marca muda e só aquela cena é regerada — lição
 * das novelinhas (criativos-sci): sem isso o arquivo continua "dizendo" o
 * texto antigo e ninguém percebe sem ouvir.
 */
export function marca(texto, voz) {
  return createHash("sha1").update(`${voz}\n${texto}`).digest("hex").slice(0, 12);
}

export function estimarSegundos(texto) {
  return Math.max(1.5, Math.round((String(texto).length / CARACTERES_POR_SEG) * 10) / 10);
}

/** Duração da cena na tela: a fala, mais o respiro; cartão tem piso. */
export function duracaoDaCena(cena, segundosDeAudio) {
  const base = segundosDeAudio + RESPIRO_SEG;
  return (cena.tipo === "cartao") ? Math.max(CARTAO_MINIMO_SEG, base) : base;
}

/**
 * Enquadramento do zoom de uma cena de tela.
 *
 * A captura tem a proporção da janela (1440×900 = 16:10) e o vídeo é 16:9.
 * Primeiro recorta uma FAIXA 16:9 da largura inteira, posicionada para conter
 * o foco; depois o zoom acontece dentro dela, centrado no foco. Assim nada é
 * esticado, e o elemento citado nunca cai fora do quadro.
 *
 * `foco` vem normalizado (0–1) em relação à imagem; `null` = tela inteira.
 * O zoom pedido é reduzido se o elemento não couber nele com folga (85%).
 */
export function enquadramento(foco, largura, altura, zoomPedido = 1.6) {
  const faixaAlt = Math.min(altura, Math.round((largura * 9) / 16));
  if (!foco) {
    // Tela inteira: a faixa encosta no TOPO. Num app, cabeçalho e título da
    // página estão em cima; centralizar cortava justamente eles.
    return { faixaY: 0, faixaAlt, cx: largura / 2, cy: faixaAlt / 2, zoom: 1 };
  }
  const caixa = {
    x: foco.x * largura, y: foco.y * altura,
    w: Math.max(1, foco.w * largura), h: Math.max(1, foco.h * altura),
  };
  const centroY = caixa.y + caixa.h / 2;
  const faixaY = Math.round(Math.min(Math.max(centroY - faixaAlt / 2, 0), altura - faixaAlt));
  const cabe = Math.min((0.85 * largura) / caixa.w, (0.85 * faixaAlt) / caixa.h);
  const zoom = Math.max(1, Math.min(zoomPedido, cabe, 2.5));
  return {
    faixaY,
    faixaAlt,
    cx: caixa.x + caixa.w / 2,
    cy: centroY - faixaY,
    zoom: Math.round(zoom * 100) / 100,
  };
}

/**
 * Legendas: quebra a fala de uma cena em blocos curtos e distribui o tempo
 * de áudio dela proporcionalmente ao tamanho de cada bloco.
 *
 * As legendas usam a NARRAÇÃO ESCRITA ("CPF"), não a falada ("cê pê éfe") —
 * quem lê a legenda está olhando a mesma tela que mostra "CPF".
 */
export function blocosDeLegenda(texto, inicio, segundos, maxCaracteres = 84) {
  const frases = String(texto).replace(/\s+/g, " ").trim().match(/[^.!?:;]+[.!?:;]*/g) ?? [];
  const blocos = [];
  for (const frase of frases.map((f) => f.trim()).filter(Boolean)) {
    if (frase.length <= maxCaracteres) { blocos.push(frase); continue; }
    let atual = "";
    for (const palavra of frase.split(" ")) {
      if ((atual + " " + palavra).trim().length > maxCaracteres) { blocos.push(atual.trim()); atual = palavra; }
      else atual += " " + palavra;
    }
    if (atual.trim()) blocos.push(atual.trim());
  }
  const total = blocos.reduce((s, b) => s + b.length, 0) || 1;
  let t = inicio;
  return blocos.map((b) => {
    const dur = (segundos * b.length) / total;
    const bloco = { inicio: t, fim: t + dur, texto: b };
    t += dur;
    return bloco;
  });
}

const tempoSrt = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  const seg = Math.floor((ms % 60000) / 1000), resto = ms % 1000;
  const p = (n, k = 2) => String(n).padStart(k, "0");
  return `${p(h)}:${p(m)}:${p(seg)},${p(resto, 3)}`;
};

/** Texto SRT; linhas acima de 42 caracteres quebram em duas. */
export function srt(blocos) {
  const quebrar = (t) => {
    if (t.length <= 42) return t;
    const meio = t.lastIndexOf(" ", Math.ceil(t.length / 2) + 6);
    return meio > 0 ? `${t.slice(0, meio)}\n${t.slice(meio + 1)}` : t;
  };
  return blocos
    .map((b, i) => `${i + 1}\n${tempoSrt(b.inicio)} --> ${tempoSrt(b.fim)}\n${quebrar(b.texto)}\n`)
    .join("\n");
}

/** Data (AAAA-MM-DD) de daqui a sete dias, para `{proxima_semana}` nos roteiros. */
export function proximaSemana(hoje = new Date()) {
  const d = new Date(hoje.getTime() + 7 * 24 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Todos os nomes de pessoa do elenco (qualquer campo `nome`, em qualquer
 * nível). Na captura em produção, linha de tabela sem um desses nomes é
 * borrada: o que não é do elenco é gente de verdade. Com `chaves`, só os
 * personagens daquela aula — em produção pode existir uma pessoa real com o
 * nome de um personagem que a aula nem usa.
 */
/** @param {unknown} elenco @param {string[] | null} [chaves] */
export function nomesDoElenco(elenco, chaves = null) {
  const nomes = new Set();
  const visitar = (v) => {
    if (Array.isArray(v)) v.forEach(visitar);
    else if (v && typeof v === "object") {
      const daAula = !chaves || (v.chave && chaves.includes(v.chave));
      for (const campo of ["nome", "titulo"]) {
        if (daAula && typeof v[campo] === "string" && v[campo].trim().split(/\s+/).length >= 2) nomes.add(v[campo].trim());
      }
      Object.values(v).forEach(visitar);
    }
  };
  visitar(elenco);
  // blocos sem `chave` (escola, sala_azul): pela chave de topo do elenco
  for (const [topo, bloco] of Object.entries(elenco ?? {})) {
    if (!bloco || typeof bloco !== "object" || Array.isArray(bloco)) continue;
    if (chaves && !chaves.includes(topo)) continue;
    for (const v of Object.values(bloco)) {
      if (typeof v === "string" && v.trim().split(/\s+/).length >= 2) nomes.add(v.trim());
    }
  }
  return [...nomes];
}

/**
 * Trocas de texto para a conta que grava aparecer como a usuária de
 * demonstração: nome completo, saudação pelo primeiro nome e iniciais do
 * avatar. `exatas` só trocam um nó de texto inteiro igual (iniciais "DV"
 * não podem virar "PD" no meio de outra palavra).
 */
export function trocasDeSessao(nomeReal, nomeDemo) {
  const real = String(nomeReal).trim().split(/\s+/);
  const demo = String(nomeDemo).trim().split(/\s+/);
  const iniciais = (p) => (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  return {
    parciais: [
      [real.join(" "), demo.join(" ")],
      [`Olá, ${real[0]}`, `Olá, ${demo[0]}`],
    ],
    // o React parte "Olá, {nome}!" em nós separados: o primeiro nome sozinho
    // também é trocado, mas só quando é o nó inteiro
    exatas: [[iniciais(real), iniciais(demo)], [real[0], demo[0]]],
  };
}

/**
 * A captura só pode rodar contra uma instância de DEMONSTRAÇÃO. Esta é a
 * trava: aceita apenas endereços locais. Uma instância de demonstração em
 * outra máquina exige confirmação explícita na linha de comando.
 */
export function hostEhLocal(url) {
  const { hostname } = new URL(url);
  return (
    ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".local")
  );
}
