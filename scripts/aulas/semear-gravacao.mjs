// Semeia, em PRODUÇÃO, o elenco fictício que os roteiros dão como "já
// existente" antes de gravar um módulo. Tudo sai do elenco.json; nada real.
//
// Uso:
//   node scripts/aulas/semear-gravacao.mjs modulo1            (simula)
//   node scripts/aulas/semear-gravacao.mjs modulo1 --aplicar
//
// Credencial: DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO (caminho), no
// ambiente ou no .env.local. Desfazer: limpar-gravacao.mjs --aplicar.
//
// ┌─ TRAVAS ─────────────────────────────────────────────────────────────────┐
// │ • Idempotente: personagem que já existe (CPF do elenco) não é recriado.  │
// │ • Toda ficha semeada sai com "não receber mensagens" marcado: nenhuma    │
// │   campanha real dispara para os telefones fictícios.                     │
// └──────────────────────────────────────────────────────────────────────────┘
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { carregarEnvLocal, lerJson, PASTA_AULAS } from "./lib.mjs";

carregarEnvLocal();
const [etapa] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APLICAR = process.argv.includes("--aplicar");
const URL_ = (process.env.DIRECTUS_API_URL || "").replace(/\/$/, "");
const arquivo = process.env.DIRECTUS_ADMIN_TOKEN_ARQUIVO;
if (!URL_ || !arquivo) { console.error("Defina DIRECTUS_API_URL e DIRECTUS_ADMIN_TOKEN_ARQUIVO."); process.exit(1); }
const H = { Authorization: `Bearer ${readFileSync(arquivo, "utf8").trim()}`, "Content-Type": "application/json" };

async function api(caminho, opcoes = {}) {
  const r = await fetch(URL_ + caminho, { ...opcoes, headers: H });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opcoes.method || "GET"} ${caminho.split("?")[0]} → ${r.status} ${JSON.stringify(corpo.errors?.[0]?.message ?? "")}`);
  return corpo.data;
}
const primeiro = async (colecao) => (await api(`/items/${colecao}?fields=id&sort=id&limit=1`))?.[0]?.id ?? null;
const digitos = (t) => String(t ?? "").replace(/\D/g, "");

const elenco = lerJson(join(PASTA_AULAS, "elenco.json"));
const pessoa = (chave) => elenco.beneficiarias.find((b) => b.chave === chave);

/** Ficha de beneficiária a partir do elenco. `completa` preenche tudo. */
async function ficha(chave, { completa = false, minima = false } = {}) {
  const b = pessoa(chave);
  const base = { nome_completo: b.nome, cpf: b.cpf, nao_receber_mensagens: true };
  if (minima) return base;
  Object.assign(base, {
    data_nascimento: b.nascimento,
    telefone: digitos(b.telefone) || null,
    endereco: { cep: "", logradouro: "", numero: "", bairro: b.bairro ?? "", cidade: b.bairro ? "Aracaju" : "" },
  });
  if (completa) {
    Object.assign(base, {
      telefone_validado: true,
      email: `${chave}@exemplo.sigma.local`,
      contato: { melhor_turno_contato: "Manhã" },
      endereco: { cep: "49000000", logradouro: "Rua Exemplo", numero: "100", bairro: b.bairro, cidade: "Aracaju" },
      raca_cor_id: await primeiro("config_raca_cor"),
      estado_civil_id: await primeiro("config_estado_civil"),
      escolaridade_id: await primeiro("config_escolaridade"),
      situacao_trabalho_id: await primeiro("config_situacao_trabalho"),
      quantidade_filhos: "2",
      numero_cad_unico: "00000000000",
      perfil_socioeconomico: "Perfil fictício para vídeo-aula.",
    });
  }
  return base;
}

const ETAPAS = {
  // Módulo 1: Joana como a 1.1 deixou (nome + CPF), Marta completa, Ana e
  // Rita com o básico, Cláudia incompleta de propósito (1.2 e 7.2).
  modulo1: async () => [
    await ficha("joana", { minima: true }),
    await ficha("marta", { completa: true }),
    await ficha("ana"),
    await ficha("rita"),
    await ficha("claudia", { minima: true }),
  ],
};

/*
  Etapas que não criam fichas: rodam DEPOIS de aulas que já gravaram algo
  (ex.: a tramitação vai no atendimento que a 2.1 criou para a Joana).
  Tudo fica ligado a uma ficha do elenco, então a limpeza alcança.
*/
const ALEM_DAS_FICHAS = {
  // 2.3 mostra a demanda da Joana no quadro: uma tramitação aguardando.
  modulo2: async () => {
    const joana = (await api(`/items/beneficiarias?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _eq: pessoa("joana").cpf } }))}`))[0];
    if (!joana) throw new Error("Joana não existe: semeie o módulo 1 e grave a 2.1 antes");
    const atend = (await api(`/items/atendimentos?fields=id&sort=-id&limit=1&filter=${encodeURIComponent(JSON.stringify({ beneficiaria: { _eq: joana.id } }))}`))[0];
    if (!atend) throw new Error("a Joana não tem atendimento: grave a 2.1 antes");
    const ja = await api(`/items/tramitacoes?fields=id&limit=1&filter=${encodeURIComponent(JSON.stringify({ atendimento_pai: { _eq: atend.id } }))}`);
    if (ja.length) { console.log(`= tramitação já existe no atendimento #${atend.id}`); return; }
    const setor = (await api(`/items/setores?fields=id,nome&limit=-1`)).find((x) => /jur[ií]dic/i.test(x.nome));
    const t = {
      atendimento_pai: atend.id, tipo_demanda: "Jurídica", status_etapa: "Aguardando",
      setor_responsavel: setor?.id ?? null, data_recebimento: new Date().toISOString(),
      relato_tecnico: "Orientação sobre medida protetiva. Registro fictício de vídeo-aula.",
    };
    if (!APLICAR) { console.log(`+ tramitação no atendimento #${atend.id} (simulação)`); return; }
    const criada = await api("/items/tramitacoes", { method: "POST", body: JSON.stringify(t) });
    console.log(`+ tramitação #${criada.id} no atendimento #${atend.id}`);
  },
};

if (ALEM_DAS_FICHAS[etapa]) {
  await ALEM_DAS_FICHAS[etapa]();
  if (!APLICAR) console.log("simulação: nada gravado (use --aplicar)");
  process.exit(0);
}
if (!ETAPAS[etapa]) { console.error(`etapa desconhecida. Use: ${[...Object.keys(ETAPAS), ...Object.keys(ALEM_DAS_FICHAS)].join(", ")}`); process.exit(1); }
const fichas = await ETAPAS[etapa]();
const existentes = await api(`/items/beneficiarias?fields=id,cpf&limit=-1&filter=${encodeURIComponent(JSON.stringify({ cpf: { _in: fichas.map((f) => f.cpf) } }))}`);
const jaTem = new Set(existentes.map((e) => digitos(e.cpf)));
for (const f of fichas) {
  if (jaTem.has(f.cpf)) { console.log(`= ${f.nome_completo} já existe`); continue; }
  if (!APLICAR) { console.log(`+ ${f.nome_completo} (simulação)`); continue; }
  const criada = await api("/items/beneficiarias", { method: "POST", body: JSON.stringify(f) });
  console.log(`+ #${criada.id} ${f.nome_completo}`);
}
if (!APLICAR) console.log("simulação: nada gravado (use --aplicar)");
