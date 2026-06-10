/* eslint-disable no-console */

const BASE_URL = process.env.DIRECTUS_URL || "http://192.168.0.118:8055";
const TOKEN = process.env.DIRECTUS_TOKEN || "";

if (!TOKEN) {
  console.error("Missing DIRECTUS_TOKEN env var");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

const summary = {
  collectionsCreated: [],
  fieldsCreated: [],
  relationsCreated: [],
  skippedCollections: [],
  skippedFields: [],
  skippedRelations: [],
  errors: [],
};

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message ||
      data?.error ||
      data?.message ||
      `${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

function fieldDef(field, type, extra = {}) {
  return { field, type, ...extra };
}

const schemaPlan = {
  locais: [fieldDef("nome", "string", { required: true })],

  salas_azul: [
    fieldDef("status", "string", { required: true }),
    fieldDef("nome_ciclo", "string", { required: true }),
    fieldDef("data_inicio", "date", { required: true }),
    fieldDef("data_termino", "date", { required: true }),
    fieldDef("local_id", "integer", { relation: "locais" }),
    fieldDef("responsavel_tecnico", "string", {
      relation: "directus_users",
      interface: "select-dropdown-m2o",
    }),
    fieldDef("facilitador", "string"),
  ],

  sala_azul_niveis: [
    fieldDef("nome", "string", { required: true }),
    fieldDef("cor", "string"),
  ],

  sala_azul_status_legal: [fieldDef("nome", "string", { required: true })],

  infratores: [
    fieldDef("nome_completo", "string", { required: true }),
    fieldDef("cpf", "string", { required: true }),
    fieldDef("data_nascimento", "date"),
    fieldDef("nivel_id", "integer", { relation: "sala_azul_niveis" }),
    fieldDef("status_legal_id", "integer", {
      relation: "sala_azul_status_legal",
    }),
  ],

  participacoes_sala_azul: [
    fieldDef("sala", "integer", { relation: "salas_azul", required: true }),
    fieldDef("infrator", "integer", { relation: "infratores", required: true }),
    fieldDef("status_participacao", "string", { required: true }),
    fieldDef("frequencia_percentual", "float"),
  ],

  escola_cursos: [
    fieldDef("nome", "string", { required: true }),
    fieldDef("descricao", "text"),
    fieldDef("carga_horaria", "integer"),
    fieldDef("area_atuacao", "string"),
    fieldDef("ementa", "text"),
    fieldDef("status", "string", { required: true }),
  ],

  escola_turmas: [
    fieldDef("nome", "string", { required: true }),
    fieldDef("curso_id", "integer", { relation: "escola_cursos", required: true }),
    fieldDef("data_inicio", "date", { required: true }),
    fieldDef("data_fim", "date", { required: true }),
    fieldDef("turno", "string", { required: true }),
    fieldDef("status", "string", { required: true }),
    fieldDef("capacidade_maxima", "integer", { required: true }),
    fieldDef("sala_aula", "string"),
  ],

  escola_alunos: [
    fieldDef("nome_completo", "string", { required: true }),
    fieldDef("cpf", "string", { required: true }),
    fieldDef("data_nascimento", "date", { required: true }),
    fieldDef("email", "string"),
    fieldDef("telefone", "string"),
    fieldDef("endereco", "text"),
    fieldDef("status", "string", { required: true }),
    fieldDef("foto", "string", {
      relation: "directus_files",
      interface: "file-image",
    }),
  ],

  escola_matriculas: [
    fieldDef("aluno_id", "integer", { relation: "escola_alunos", required: true }),
    fieldDef("turma_id", "integer", { relation: "escola_turmas", required: true }),
    fieldDef("data_matricula", "date", { required: true }),
    fieldDef("status", "string", { required: true }),
    fieldDef("nota_final", "float"),
    fieldDef("frequencia_percentual", "float"),
  ],

  mulheres_beneficiarias: [
    fieldDef("nome_completo", "string", { required: true }),
    fieldDef("nome_social", "string"),
    fieldDef("data_nascimento", "date", { required: true }),
    fieldDef("cpf", "string"),
    fieldDef("rg", "string"),
    fieldDef("telefone", "string"),
    fieldDef("contato", "json"),
    fieldDef("endereco_completo", "text"),
    fieldDef("endereco", "json"),
    fieldDef("bairro", "string"),
    fieldDef("perfil_socioeconomico", "text"),
    fieldDef("recebe_bolsa_familia", "boolean"),
    fieldDef("recebe_bpc", "boolean"),
    fieldDef("possui_medida_protetiva", "boolean"),
    fieldDef("historico_violencia", "text"),
    fieldDef("status", "string", { required: true }),
    fieldDef("foto", "string", {
      relation: "directus_files",
      interface: "file-image",
    }),
  ],

  mulheres_atendimentos: [
    fieldDef("beneficiaria_id", "integer", {
      relation: "mulheres_beneficiarias",
      required: true,
    }),
    fieldDef("beneficiaria", "integer", {
      relation: "mulheres_beneficiarias",
    }),
    fieldDef("data_atendimento", "date"),
    fieldDef("data_abertura", "date", { required: true }),
    fieldDef("origem_id", "integer"),
    fieldDef("prioridade_id", "integer"),
    fieldDef("encaminhamento_id", "integer"),
    fieldDef("tecnico_responsavel", "string"),
    fieldDef("tipo_demanda", "string"),
    fieldDef("relato_sumario", "text"),
    fieldDef("encaminhamentos", "json"),
    fieldDef("tipos_violencia", "json"),
    fieldDef("status", "string", { required: true }),
  ],

  amar_categorias: [
    fieldDef("nome", "string", { required: true }),
    fieldDef("slug", "string", { required: true }),
    fieldDef("icone", "string"),
    fieldDef("cor_hex", "string"),
    fieldDef("ordem", "integer"),
    fieldDef("status", "string", { required: true }),
  ],

  amar_servicos: [
    fieldDef("titulo", "string", { required: true }),
    fieldDef("slug", "string", { required: true }),
    fieldDef("descricao_curta", "text"),
    fieldDef("documentos_necessarios", "text"),
    fieldDef("endereco_mapa", "string"),
    fieldDef("horario_atendimento", "string"),
    fieldDef("link_externo_acao", "string"),
    fieldDef("sobre", "text"),
    fieldDef("status", "string", { required: true }),
    fieldDef("categoria_id", "integer", {
      relation: "amar_categorias",
      required: true,
    }),
  ],

  amar_campanhas: [
    fieldDef("titulo", "string", { required: true }),
    fieldDef("url_instagram", "string", { required: true }),
    fieldDef("status", "string", { required: true }),
  ],

  amar_sonhos: [
    fieldDef("nome", "string"),
    fieldDef("telefone", "string"),
    fieldDef("cpf", "string"),
    fieldDef("audio", "string", {
      relation: "directus_files",
      interface: "file",
    }),
    fieldDef("date_created", "dateTime"),
  ],

  amar_cursos: [
    fieldDef("titulo", "string"),
    fieldDef("descricao", "text"),
    fieldDef("data", "date"),
    fieldDef("horario", "string"),
    fieldDef("local", "string"),
    fieldDef("vagas", "integer"),
    fieldDef("status_curso", "string"),
    fieldDef("requisitos", "text"),
    fieldDef("link", "string"),
  ],

  amar_contatos: [
    fieldDef("nome", "string", { required: true }),
    fieldDef("descricao", "text"),
    fieldDef("telefone", "string"),
    fieldDef("endereco", "text"),
  ],

  amar_projetos: [
    fieldDef("status", "string", { required: true }),
    fieldDef("ordem", "integer"),
    fieldDef("titulo", "string", { required: true }),
    fieldDef("descricao", "text"),
    fieldDef("imagem_capa", "string", {
      relation: "directus_files",
      interface: "file-image",
    }),
    fieldDef("link_destino", "string"),
    fieldDef("tipo_link", "string"),
    fieldDef("link_imagem", "string"),
  ],
};

const orderedCollections = [
  "locais",
  "sala_azul_niveis",
  "sala_azul_status_legal",
  "salas_azul",
  "infratores",
  "participacoes_sala_azul",
  "escola_cursos",
  "escola_turmas",
  "escola_alunos",
  "escola_matriculas",
  "mulheres_beneficiarias",
  "mulheres_atendimentos",
  "amar_categorias",
  "amar_servicos",
  "amar_campanhas",
  "amar_sonhos",
  "amar_cursos",
  "amar_contatos",
  "amar_projetos",
];

async function ensureCollection(name) {
  const existing = await api("/collections?limit=-1");
  const has = existing.data.some((c) => c.collection === name);
  if (has) {
    summary.skippedCollections.push(name);
    return;
  }

  await api("/collections", {
    method: "POST",
    body: JSON.stringify({
      collection: name,
      meta: {
        collection: name,
        hidden: false,
        singleton: false,
      },
    }),
  });

  summary.collectionsCreated.push(name);
}

async function getFields(collection) {
  try {
    const res = await api(`/fields/${collection}`);
    return new Set(res.data.map((f) => f.field));
  } catch {
    return new Set();
  }
}

function relationPayload(collection, def) {
  const isDirectusUser = def.relation === "directus_users";
  const isDirectusFile = def.relation === "directus_files";

  return {
    field: def.field,
    type: def.type,
    meta: {
      interface: def.interface || "select-dropdown-m2o",
      special: ["m2o"],
      required: Boolean(def.required),
    },
    schema: {
      is_nullable: !def.required,
      foreign_key_table: def.relation,
      foreign_key_column: "id",
      on_update: "NO ACTION",
      on_delete: "SET NULL",
      ...(isDirectusUser || isDirectusFile ? { data_type: "varchar" } : {}),
    },
  };
}

async function ensureField(collection, def) {
  const fields = await getFields(collection);
  if (fields.has(def.field)) {
    summary.skippedFields.push(`${collection}.${def.field}`);
    return;
  }

  const payload = def.relation
    ? relationPayload(collection, def)
    : {
        field: def.field,
        type: def.type,
        meta: {
          interface:
            def.interface ||
            (def.type === "boolean"
              ? "boolean"
              : def.type === "date"
                ? "datetime"
                : def.type === "dateTime"
                  ? "datetime"
                  : def.type === "json"
                    ? "input-code"
                    : "input"),
          required: Boolean(def.required),
        },
        schema: {
          is_nullable: !def.required,
        },
      };

  await api(`/fields/${collection}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  summary.fieldsCreated.push(`${collection}.${def.field}`);
  if (def.relation) {
    summary.relationsCreated.push(`${collection}.${def.field} -> ${def.relation}.id`);
  }
}

async function main() {
  console.log(`Syncing Directus schema at ${BASE_URL}`);

  for (const collection of orderedCollections) {
    try {
      await ensureCollection(collection);
    } catch (err) {
      summary.errors.push(`collection ${collection}: ${err.message}`);
    }
  }

  for (const collection of orderedCollections) {
    const defs = schemaPlan[collection] || [];
    for (const def of defs) {
      try {
        await ensureField(collection, def);
      } catch (err) {
        summary.errors.push(`field ${collection}.${def.field}: ${err.message}`);
      }
    }
  }

  console.log("\n=== SCHEMA SYNC REPORT ===");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
