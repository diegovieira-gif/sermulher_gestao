// Limpeza depois de gravar uma aula em PRODUÇÃO: exclui as fichas que a
// própria gravação cadastrou (personagens do elenco fictício).
//
// Uso:
//   node scripts/aulas/limpar-gravacao.mjs            (simula: só lista)
//   node scripts/aulas/limpar-gravacao.mjs --aplicar  (exclui)
//
// Credencial: DIRECTUS_ADMIN_TOKEN_ARQUIVO (CAMINHO do arquivo com o token,
// nunca o token) e DIRECTUS_API_URL, no ambiente ou no .env.local.
// Nada é impresso além de id e nome do personagem.
//
// ┌─ TRAVAS ─────────────────────────────────────────────────────────────────┐
// │ • Só toca em beneficiária cujo CPF está no elenco.json E cujo nome é     │
// │   o do personagem dono daquele CPF. Uma pessoa real nunca casa os dois. │
// │ • No máximo 10 fichas por execução; acima disso, recusa e não apaga nada.│
// └──────────────────────────────────────────────────────────────────────────┘
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { carregarEnvLocal, lerJson, PASTA_AULAS } from "./lib.mjs";

carregarEnvLocal();

const APLICAR = process.argv.includes("--aplicar");
const MAXIMO = 10;
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) {
  console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO.");
  process.exit(1);
}
const TOKEN = readFileSync(arquivo, "utf8").trim();
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

// personagens com CPF: cpf → nome
const elenco = lerJson(join(PASTA_AULAS, "elenco.json"));
const porCpf = new Map();
const visitar = (v) => {
  if (Array.isArray(v)) v.forEach(visitar);
  else if (v && typeof v === "object") {
    if (typeof v.cpf === "string" && typeof v.nome === "string") porCpf.set(v.cpf.replace(/\D/g, ""), v.nome.trim());
    Object.values(v).forEach(visitar);
  }
};
visitar(elenco);
if (!porCpf.size) { console.log("elenco sem CPFs: nada a fazer"); process.exit(0); }

const filtro = encodeURIComponent(JSON.stringify({ cpf: { _in: [...porCpf.keys()] } }));
const r = await fetch(`${URL_}/items/beneficiarias?fields=id,nome_completo,cpf&limit=-1&filter=${filtro}`, { headers: H });
if (!r.ok) { console.error(`consulta falhou: ${r.status}`); process.exit(1); }
const achadas = (await r.json()).data ?? [];
const alvos = achadas.filter((b) => porCpf.get(String(b.cpf).replace(/\D/g, "")) === String(b.nome_completo).trim());
const ignoradas = achadas.length - alvos.length;

console.log(`fichas do elenco encontradas: ${alvos.length}${ignoradas ? ` (${ignoradas} com CPF do elenco mas outro nome — NÃO tocadas)` : ""}`);
for (const b of alvos) console.log(`  #${b.id} ${b.nome_completo}`);
if (alvos.length > MAXIMO) { console.error(`acima de ${MAXIMO}: recusado, nada apagado`); process.exit(1); }
if (!APLICAR) { console.log("simulação: nada apagado (use --aplicar)"); process.exit(0); }

for (const b of alvos) {
  const d = await fetch(`${URL_}/items/beneficiarias/${b.id}`, { method: "DELETE", headers: H });
  console.log(`  #${b.id} → ${d.ok ? "excluída" : `falhou (${d.status})`}`);
}
