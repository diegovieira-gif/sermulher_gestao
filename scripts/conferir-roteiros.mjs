// Confere os roteiros de vídeo-aula (docs/aulas/*.json) ANTES de gastar com
// voz ou captura. Roda sem servidor e sem API.
//
// O que confere, e por quê:
//  - Estrutura: campos obrigatórios, ids únicos, aula listada na trilha.
//  - Âncoras no CÓDIGO: todo texto citado num seletor (nome de botão, rótulo,
//    placeholder, title, aria-label) precisa existir em src/. Seletor que não
//    existe é cena que não captura — e descobrir isso na hora de gravar custa
//    a sessão inteira. Toda rota de `navegar` precisa ter page.tsx.
//  - Regras da trilha (docs/trilha-videos.md):
//      números por extenso na narração (o texto vai direto à voz sintética);
//      sigla em maiúsculas só se estiver em pronuncia.json;
//      nada de posição ("à direita", "terceiro item") — a fala cita o NOME.
//  - Duração estimada (~14 caracteres por segundo) contra o alvo da aula.
//
// Uso:
//   node scripts/conferir-roteiros.mjs            (todas as aulas)
//   node scripts/conferir-roteiros.mjs 1.1 2.3    (só estas)
// Sai com código 1 se houver ERRO; AVISO não reprova.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const PASTA = join(RAIZ, "docs", "aulas");
const SRC = join(RAIZ, "src");
const CARACTERES_POR_SEG = 14;

const pronuncia = JSON.parse(readFileSync(join(PASTA, "pronuncia.json"), "utf8"));
const trilha = readFileSync(join(RAIZ, "docs", "trilha-videos.md"), "utf8");
const idsNaTrilha = new Set([...trilha.matchAll(/^### (\d+\.\d+) —/gm)].map((m) => m[1]));

// ── corpus do código: todo .ts/.tsx de src, para procurar as âncoras ───────
function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}
const corpus = arquivos(SRC).map((p) => readFileSync(p, "utf8")).join("\n");

// Textos do elenco fictício (nomes, títulos de evento…): aparecem na tela
// porque a instância de demonstração é povoada com eles, não porque estão no código.
const doElenco = new Set();
(function coletar(v) {
  if (typeof v === "string") {
    doElenco.add(v);
    // CPF do elenco aparece na tela com máscara (123.456.789-09)
    if (/^\d{11}$/.test(v)) doElenco.add(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
  }
  else if (v && typeof v === "object") Object.values(v).forEach(coletar);
})(JSON.parse(readFileSync(join(PASTA, "elenco.json"), "utf8")));

// Rotas existentes: todo page.tsx sob src/app, sem os grupos "(x)"; [param] vira coringa.
const rotas = arquivos(join(SRC, "app"))
  .filter((p) => p.endsWith("page.tsx"))
  .map((p) =>
    "/" +
    relative(join(SRC, "app"), p)
      .replace(/\\/g, "/")
      .replace(/(^|\/)\([^)]+\)/g, "")
      .replace(/\/?page\.tsx$/, "")
      .replace(/^\//, ""),
  )
  .map((r) => new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\/$/, "") + "/?$"));

function rotaExiste(url) {
  const caminho = url.split("?")[0].split("#")[0];
  return rotas.some((re) => re.test(caminho === "/" ? "/" : caminho));
}

/** Textos que um seletor exige que existam na tela (e portanto no código). */
function ancoras(seletor) {
  const s = String(seletor);
  const achados = [];
  const pegar = (re) => { for (const m of s.matchAll(re)) achados.push(m[1]); };
  pegar(/^text=(.+)$/g);
  pegar(/^rotulo=(.+)$/g);
  pegar(/name=["']([^"']+)["']/g);
  pegar(/\[placeholder=["']([^"']+)["']\]/g);
  pegar(/\[aria-label=["']([^"']+)["']\]/g);
  pegar(/\[title=["']([^"']+)["']\]/g);
  pegar(/:has-text\(["']([^"']+)["']\)/g);
  pegar(/\[data-testid=["']([^"']+)["']\]/g);
  return achados.map((a) => a.replace(/\s*\*$/, "").trim()).filter(Boolean);
}

/**
 * A âncora existe no código? Aceita também rótulo MONTADO, como
 * `Selecionar ${b.nome_completo}`: "Selecionar Joana Ribeiro" passa se o
 * código tiver "Selecionar ${". O nome da pessoa vem do elenco, não do código.
 */
function existeNoCodigo(texto) {
  if (corpus.includes(texto) || doElenco.has(texto)) return true;
  const palavras = texto.split(" ");
  for (let i = palavras.length - 1; i > 0; i--) {
    if (corpus.includes(palavras.slice(0, i).join(" ") + " ${")) return true;
  }
  return false;
}

const ACOES = {
  navegar: ["url"],
  clicar: ["seletor"],
  digitar: ["seletor", "texto"],
  selecionar: ["seletor", "opcao"],
  marcar: ["seletor"],
  rolar: ["seletor"],
  tecla: ["tecla"],
  nenhuma: [],
};

const POSICAO = /\b(à direita|à esquerda|no canto|canto superior|canto inferior|no topo|lá em cima|lá embaixo|em cima|embaixo|primeiro item|segundo item|terceiro item|quarto item|terceiro botão|segundo botão)\b/i;

function conferir(arquivo, plano, todosIds) {
  const erros = [];
  const avisos = [];
  const E = (m) => erros.push(m);
  const A = (m) => avisos.push(m);

  for (const campo of ["id", "modulo", "titulo", "publico", "objetivo", "tarefa_final", "duracao_alvo_seg", "cenas"]) {
    if (plano[campo] === undefined || plano[campo] === "") E(`campo obrigatório ausente: ${campo}`);
  }
  if (plano.id && !arquivo.startsWith(plano.id + "-")) E(`nome do arquivo não começa pelo id "${plano.id}-"`);
  if (plano.id && !idsNaTrilha.has(plano.id)) E(`aula ${plano.id} não está na trilha (docs/trilha-videos.md)`);
  if (plano.id && todosIds.get(plano.id) > 1) E(`id ${plano.id} repetido em mais de um arquivo`);
  for (const p of plano.pre_requisitos || []) {
    if (!idsNaTrilha.has(p)) E(`pré-requisito ${p} não existe na trilha`);
  }
  if (plano.voz) A(`"voz" no plano é ignorado: a voz é uma só para o curso (docs/aulas/config.json)`);

  const cenas = Array.isArray(plano.cenas) ? plano.cenas : [];
  if (!cenas.length) E("nenhuma cena");
  const idsCena = new Set();
  let caracteres = 0;

  cenas.forEach((c, i) => {
    const onde = `cena ${c.id || "#" + (i + 1)}`;
    if (!c.id) E(`${onde}: sem id`);
    else if (idsCena.has(c.id)) E(`${onde}: id repetido`);
    idsCena.add(c.id);

    const tipo = c.tipo || "tela";
    if (!["tela", "cartao"].includes(tipo)) E(`${onde}: tipo "${tipo}" desconhecido (tela | cartao)`);

    const fala = String(c.narracao || "").trim();
    if (!fala) E(`${onde}: narração vazia`);
    caracteres += fala.length;

    // números por extenso
    const numero = fala.match(/\d+/);
    if (numero) E(`${onde}: número "${numero[0]}" na narração — escreva por extenso`);
    // siglas fora do glossário
    for (const m of fala.matchAll(/\b[A-ZÀ-Ú]{2,}\b/g)) {
      if (!(m[0] in pronuncia)) A(`${onde}: sigla "${m[0]}" fora de pronuncia.json — como a voz deve falar?`);
    }
    // posição em vez de nome
    const pos = fala.match(POSICAO);
    if (pos) A(`${onde}: "${pos[0]}" ancora pela POSIÇÃO; cite o nome do botão ou campo`);

    if (tipo === "cartao") {
      if (!c.cartao?.titulo) E(`${onde}: cartão sem "cartao.titulo"`);
    } else {
      if (!("foco" in c)) E(`${onde}: cena de tela sem "foco" (use null para a tela inteira)`);
    }

    const acoes = c.acao ? (Array.isArray(c.acao) ? c.acao : [c.acao]) : [];
    if (tipo === "tela" && i === 0 && !acoes.some((a) => a.tipo === "navegar")) {
      A(`${onde}: primeira cena de tela sem "navegar" — de onde a captura começa?`);
    }
    for (const a of acoes) {
      const campos = ACOES[a.tipo];
      if (!campos) { E(`${onde}: ação "${a.tipo}" desconhecida`); continue; }
      for (const f of campos) if (a[f] === undefined || a[f] === "") E(`${onde}: ação ${a.tipo} sem "${f}"`);
      if (a.tipo === "navegar" && a.url && !rotaExiste(a.url)) E(`${onde}: rota ${a.url} não existe em src/app`);
      if (a.seletor) for (const t of ancoras(a.seletor)) {
        if (!existeNoCodigo(t)) E(`${onde}: "${t}" (seletor de ${a.tipo}) não aparece no código`);
      }
    }
    if (c.foco?.seletor) {
      for (const t of ancoras(c.foco.seletor)) {
        if (!existeNoCodigo(t)) E(`${onde}: "${t}" (foco) não aparece no código`);
      }
      if (c.foco.zoom !== undefined && (c.foco.zoom < 1 || c.foco.zoom > 2.5)) {
        E(`${onde}: zoom ${c.foco.zoom} fora de 1 a 2,5`);
      }
    }
  });

  const estimado = Math.round(caracteres / CARACTERES_POR_SEG);
  const alvo = Number(plano.duracao_alvo_seg) || 0;
  if (estimado > 360) E(`duração estimada ${estimado}s passa de 6 minutos`);
  else if (alvo && estimado > alvo * 1.3) A(`duração estimada ${estimado}s bem acima do alvo ${alvo}s`);
  else if (alvo && estimado < alvo * 0.5) A(`duração estimada ${estimado}s bem abaixo do alvo ${alvo}s`);

  return { erros, avisos, estimado, cenas: cenas.length };
}

// ── execução ────────────────────────────────────────────────────────────────
const filtro = process.argv.slice(2);
const json = readdirSync(PASTA)
  .filter((n) => /^\d+\.\d+-.+\.json$/.test(n))
  .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

const planos = json.map((n) => [n, JSON.parse(readFileSync(join(PASTA, n), "utf8"))]);
const contagem = new Map();
for (const [, p] of planos) contagem.set(p.id, (contagem.get(p.id) || 0) + 1);

let totalErros = 0;
let totalSeg = 0;
for (const [nome, plano] of planos) {
  if (filtro.length && !filtro.includes(plano.id)) continue;
  const r = conferir(nome, plano, contagem);
  totalErros += r.erros.length;
  totalSeg += r.estimado;
  const selo = r.erros.length ? "✖" : r.avisos.length ? "!" : "✔";
  console.log(`${selo} ${plano.id} ${plano.titulo} — ${r.cenas} cenas, ~${Math.floor(r.estimado / 60)}min${String(r.estimado % 60).padStart(2, "0")}`);
  for (const e of r.erros) console.log(`    ERRO  ${e}`);
  for (const a of r.avisos) console.log(`    aviso ${a}`);
}

const semRoteiro = [...idsNaTrilha].filter((id) => !contagem.has(id));
if (!filtro.length && semRoteiro.length) {
  console.log(`\nAulas da trilha ainda sem roteiro (${semRoteiro.length}): ${semRoteiro.join(", ")}`);
}
console.log(`\nTotal estimado: ~${Math.round(totalSeg / 60)} min. ${totalErros ? `${totalErros} erro(s).` : "Sem erros."}`);
process.exit(totalErros ? 1 : 0);
