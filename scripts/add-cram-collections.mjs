// Migração: coleções do módulo CRAM (Instrumental de Atendimento + PIA).
//
// 1. cram_atendimentos          → o Instrumental de Atendimento (1 por atendimento).
// 2. cram_composicao_domiciliar → linhas da tabela "Composição Domiciliar" (O2M).
// 3. cram_pia                   → Plano Individual de Atendimento (1 por acompanhamento).
// 4. cram_pia_pactuacoes        → tabela "Pactuações com a usuária" (O2M do PIA).
// 5. cram_pia_evolucoes         → "Evolução do acompanhamento técnico" (O2M do PIA).
//
// Os dados pessoais NÃO são duplicados: `cram_atendimentos.beneficiaria` é uma
// M2O para `beneficiarias`. Só o que o instrumental pede a mais (RG, Cartão SUS,
// habitação, saúde, autor da violência, etc.) vive aqui.
//
// Idempotente: pula coleções e campos que já existem. Só cria — nunca altera nem
// remove nada que esteja no Directus.
//
// Uso:
//   node scripts/add-cram-collections.mjs           (aplica)
//   node scripts/add-cram-collections.mjs --dry-run (só mostra o que faria)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* sem .env.local: usa apenas process.env */
  }
}

loadEnvLocal();

const DRY_RUN = process.argv.includes("--dry-run");

const URL_BASE = (
  process.env.DIRECTUS_API_URL ||
  process.env.DIRECTUS_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  ""
).replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN || "";

if (!URL_BASE || !TOKEN) {
  console.error("❌ Defina DIRECTUS_API_URL e DIRECTUS_TOKEN (ou .env.local).");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const summary = {
  collectionsCreated: [],
  fieldsCreated: [],
  relationsCreated: [],
  skipped: [],
  errors: [],
};

async function api(path, options = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function collectionExists(name) {
  try {
    await api(`/collections/${name}`);
    return true;
  } catch (err) {
    if (err.status === 403 || err.status === 404) return false;
    throw err;
  }
}

async function listFields(collection) {
  try {
    const res = await api(`/fields/${collection}`);
    return (res.data || []).map((f) => f.field);
  } catch {
    return [];
  }
}

// --- Construtores de campo (açúcar sintático) -------------------------------

const pk = () => ({
  field: "id",
  type: "integer",
  meta: { hidden: true, interface: "input", readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true },
});

const texto = (field, opts = {}) => ({
  field,
  type: "string",
  meta: { interface: "input", width: opts.width || "half", note: opts.note || null },
  schema: { is_nullable: true },
});

const textoLongo = (field, opts = {}) => ({
  field,
  type: "text",
  meta: { interface: "input-multiline", width: "full", note: opts.note || null },
  schema: { is_nullable: true },
});

const inteiro = (field, opts = {}) => ({
  field,
  type: "integer",
  meta: { interface: "input", width: opts.width || "half" },
  schema: { is_nullable: true },
});

const booleano = (field) => ({
  field,
  type: "boolean",
  meta: { interface: "boolean", width: "half" },
  schema: { is_nullable: true, default_value: false },
});

const data = (field, opts = {}) => ({
  field,
  type: "date",
  meta: { interface: "datetime", width: "half" },
  schema: { is_nullable: opts.required !== true },
});

const json = (field, opts = {}) => ({
  field,
  type: "json",
  meta: {
    interface: opts.interface || "input-code",
    width: "full",
    note: opts.note || null,
  },
  schema: { is_nullable: true },
});

const dropdown = (field, choices, opts = {}) => ({
  field,
  type: "string",
  meta: {
    interface: "select-dropdown",
    width: opts.width || "half",
    options: { choices: choices.map((c) => ({ text: c, value: c })) },
  },
  schema: { is_nullable: true, default_value: opts.default ?? null },
});

/** M2O: cria o campo inteiro e, em seguida, a relação. */
const m2o = (field, relatedCollection, opts = {}) => ({
  field,
  type: "integer",
  meta: {
    interface: "select-dropdown-m2o",
    width: opts.width || "half",
    required: opts.required === true,
    options: opts.template ? { template: opts.template } : undefined,
  },
  schema: { is_nullable: opts.required !== true },
  __relation: { collection: relatedCollection, onDelete: opts.onDelete || "SET NULL" },
});

const auditoria = () => [
  {
    field: "user_created",
    type: "string",
    meta: {
      interface: "select-dropdown-m2o",
      special: ["user-created"],
      readonly: true,
      hidden: true,
      width: "half",
    },
    schema: { is_nullable: true },
  },
  {
    field: "date_created",
    type: "timestamp",
    meta: {
      interface: "datetime",
      special: ["date-created"],
      readonly: true,
      hidden: true,
      width: "half",
    },
    schema: { is_nullable: true },
  },
  {
    field: "user_updated",
    type: "string",
    meta: {
      interface: "select-dropdown-m2o",
      special: ["user-updated"],
      readonly: true,
      hidden: true,
      width: "half",
    },
    schema: { is_nullable: true },
  },
  {
    field: "date_updated",
    type: "timestamp",
    meta: {
      interface: "datetime",
      special: ["date-updated"],
      readonly: true,
      hidden: true,
      width: "half",
    },
    schema: { is_nullable: true },
  },
];

// --- Aplicação --------------------------------------------------------------

async function ensureCollection(name, note, fields, opts = {}) {
  const relations = [];
  const plainFields = fields.map((f) => {
    if (f.__relation) {
      relations.push({ field: f.field, ...f.__relation });
      const { __relation, ...rest } = f;
      return rest;
    }
    return f;
  });

  if (await collectionExists(name)) {
    // Coleção já existe → completa apenas os campos ausentes.
    const existing = new Set(await listFields(name));
    for (const f of plainFields) {
      if (existing.has(f.field)) {
        summary.skipped.push(`${name}.${f.field}`);
        continue;
      }
      if (DRY_RUN) {
        summary.fieldsCreated.push(`${name}.${f.field} (dry-run)`);
        continue;
      }
      try {
        await api(`/fields/${name}`, { method: "POST", body: JSON.stringify(f) });
        summary.fieldsCreated.push(`${name}.${f.field}`);
      } catch (err) {
        summary.errors.push(`${name}.${f.field}: ${err.message}`);
      }
    }
  } else {
    if (DRY_RUN) {
      summary.collectionsCreated.push(`${name} (dry-run)`);
    } else {
      await api("/collections", {
        method: "POST",
        body: JSON.stringify({
          collection: name,
          meta: {
            collection: name,
            hidden: false,
            singleton: false,
            note: note || null,
            sort_field: opts.sortField || null,
            archive_field: opts.archiveField || null,
          },
          schema: { name },
          fields: [pk(), ...plainFields],
        }),
      });
      summary.collectionsCreated.push(name);
    }
  }

  // Relações M2O (idempotente: 400/409 quando já existe).
  for (const rel of relations) {
    if (DRY_RUN) {
      summary.relationsCreated.push(`${name}.${rel.field} → ${rel.collection} (dry-run)`);
      continue;
    }
    try {
      await api("/relations", {
        method: "POST",
        body: JSON.stringify({
          collection: name,
          field: rel.field,
          related_collection: rel.collection,
          schema: { on_delete: rel.onDelete },
        }),
      });
      summary.relationsCreated.push(`${name}.${rel.field} → ${rel.collection}`);
    } catch (err) {
      summary.skipped.push(`relation ${name}.${rel.field} (${err.message})`);
    }
  }
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}${DRY_RUN ? "  [DRY RUN — nada será gravado]" : ""}`);

  // 1. Instrumental de Atendimento -----------------------------------------
  try {
    await ensureCollection(
      "cram_atendimentos",
      "Instrumental de Atendimento do CRAM. Dados pessoais vêm de `beneficiarias`.",
      [
        m2o("beneficiaria", "beneficiarias", {
          required: true,
          onDelete: "CASCADE",
          template: "{{nome_completo}}",
        }),
        data("data_atendimento", { required: true }),
        dropdown("turno", ["Manhã", "Tarde"]),
        dropdown("status", ["Em preenchimento", "Concluído", "Arquivado"], {
          default: "Em preenchimento",
        }),
        texto("responsavel_atendimento", { note: "Técnico responsável pelo atendimento." }),

        // 1. Busca pelo serviço
        dropdown("busca_tipo", ["Espontânea", "Encaminhada"]),
        textoLongo("busca_como_soube", { note: "Como soube do serviço (busca espontânea)." }),
        dropdown("busca_encaminhada_por", [
          "Saúde",
          "DAGV",
          "Assistência Social",
          "Justiça",
          "Educação",
          "Outra",
        ]),
        texto("busca_encaminhada_outra"),
        booleano("possui_medida_protetiva"),
        textoLongo("servico_buscado"),

        // Documentação ausente no prontuário
        texto("rg"),
        texto("cartao_sus"),

        // Parte I — habitação
        dropdown("imovel_situacao", [
          "Próprio",
          "Alugado",
          "Cedido",
          "Ocupado",
          "Situação de rua",
          "Outro",
        ]),
        texto("imovel_situacao_outro"),
        json("saneamento", { note: "Lista: Água, Energia, Esgoto, Pavimentação, Coleta de lixo." }),

        // Parte I — deficiência
        booleano("possui_deficiencia"),
        json("deficiencia_tipos", { note: "Lista: Física, Mental, Visual, Múltipla." }),

        // Parte I — saúde
        booleano("saude_problema"),
        textoLongo("saude_problema_qual"),
        booleano("fuma"),
        texto("fuma_tempo"),
        texto("fuma_frequencia"),
        booleano("usa_drogas"),
        texto("drogas_qual"),
        texto("drogas_tempo"),
        texto("drogas_frequencia"),
        booleano("uso_abusivo_alcool"),
        texto("alcool_tempo"),
        m2o("ubs_id", "config_ubs", { template: "{{nome}}" }),

        // Parte I — trabalho e renda
        texto("profissao_ocupacao"),
        dropdown("faixa_renda", [
          "Até R$ 218,00",
          "Até meio salário mínimo",
          "Até 1 salário mínimo",
          "Entre 2 e 3 salários",
          "Maior que 4 salários mínimos",
        ]),
        booleano("recebe_beneficio"),
        json("beneficios"),
        texto("beneficios_outro"),
        texto("cartao_cmais_quando"),
        json("necessidades_socioassistenciais"),
        texto("necessidades_socioassistenciais_outro"),

        // Parte I — localização alternativa
        texto("contato_alternativo_nome"),
        texto("contato_alternativo_telefone"),
        textoLongo("contato_alternativo_endereco"),

        // Parte I — serviços que frequenta
        json("servicos_frequenta"),
        json("servicos_frequenta_detalhes", { note: "Objeto { chave: 'qual?' }." }),

        // Parte I — violência
        json("tipos_violencia", {
          note: "Lista: Física, Psicológica, Sexual, Patrimonial, Moral, Negligência.",
        }),

        // Parte I — autor da violência
        texto("autor_nome"),
        texto("autor_naturalidade"),
        inteiro("autor_idade"),
        texto("autor_sexo"),
        texto("autor_raca"),
        texto("autor_relacao_vitima"),
        textoLongo("autor_endereco"),

        // Parte I — encaminhamento socioassistencial
        booleano("encaminhamento_socio"),
        json("encaminhamento_socio_destinos"),
        texto("encaminhamento_socio_outro"),

        // Parte II — jurídico
        json("necessidades_juridicas"),
        booleano("bo_realizado"),
        booleano("bo_realizado_por_nos"),
        booleano("solicitou_medida_protetiva"),
        json("encaminhamento_juridico"),
        texto("encaminhamento_juridico_outro"),

        // Parte III — psicológico
        json("risco", { note: "Objeto { pergunta_key: 'Sim|Não|Não sabe dizer|Não se aplica' }." }),
        textoLongo("resumo_psicologa", { note: "Resumo da situação — espaço psicóloga." }),

        textoLongo("observacoes"),
        ...auditoria(),
      ],
      { archiveField: "status" },
    );
  } catch (err) {
    summary.errors.push(`cram_atendimentos: ${err.message}`);
  }

  // 2. Composição domiciliar -----------------------------------------------
  try {
    await ensureCollection(
      "cram_composicao_domiciliar",
      "Linhas da tabela 'Composição Domiciliar' do Instrumental.",
      [
        m2o("cram_atendimento", "cram_atendimentos", { required: true, onDelete: "CASCADE" }),
        texto("nome", { width: "full" }),
        texto("parentesco"),
        inteiro("idade"),
        texto("escolaridade"),
        texto("ocupacao_renda"),
        texto("beneficio_assistencial"),
        inteiro("sort"),
      ],
      { sortField: "sort" },
    );
  } catch (err) {
    summary.errors.push(`cram_composicao_domiciliar: ${err.message}`);
  }

  // 3. Plano Individual de Atendimento -------------------------------------
  try {
    await ensureCollection(
      "cram_pia",
      "Plano Individual de Atendimento (PIA) do CRAM.",
      [
        m2o("beneficiaria", "beneficiarias", {
          required: true,
          onDelete: "CASCADE",
          template: "{{nome_completo}}",
        }),
        m2o("cram_atendimento", "cram_atendimentos", { onDelete: "SET NULL" }),
        data("data_abertura", { required: true }),
        dropdown("status", ["Ativo", "Encerrado"], { default: "Ativo" }),
        textoLongo("historico_demanda"),
        json("participacao", {
          note: "Objeto { procedimento_key: 'Sim|Não' } — formas de participação da assistida.",
        }),
        textoLongo("participacao_obs"),
        ...auditoria(),
      ],
      { archiveField: "status" },
    );
  } catch (err) {
    summary.errors.push(`cram_pia: ${err.message}`);
  }

  // 4. Pactuações -----------------------------------------------------------
  try {
    await ensureCollection(
      "cram_pia_pactuacoes",
      "Tabela 'Pactuações com a usuária' do PIA.",
      [
        m2o("pia", "cram_pia", { required: true, onDelete: "CASCADE" }),
        textoLongo("demanda_identificada"),
        textoLongo("servico_ofertado"),
        textoLongo("acao_realizada"),
        inteiro("sort"),
      ],
      { sortField: "sort" },
    );
  } catch (err) {
    summary.errors.push(`cram_pia_pactuacoes: ${err.message}`);
  }

  // 5. Evoluções ------------------------------------------------------------
  try {
    await ensureCollection(
      "cram_pia_evolucoes",
      "Evolução do acompanhamento técnico (uma linha por registro, datada).",
      [
        m2o("pia", "cram_pia", { required: true, onDelete: "CASCADE" }),
        data("data", { required: true }),
        textoLongo("descricao"),
        texto("tecnico"),
        ...auditoria(),
      ],
    );
  } catch (err) {
    summary.errors.push(`cram_pia_evolucoes: ${err.message}`);
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors.length > 0) process.exitCode = 2;
  else console.log(DRY_RUN ? "\n✅ Dry-run concluído." : "\n✅ Migração concluída.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
