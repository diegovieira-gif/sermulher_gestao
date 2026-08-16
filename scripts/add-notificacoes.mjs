// Migração: fila de notificações do sistema.
//
// A coleção `notificacoes` é uma CAIXA DE SAÍDA, não um log. Escrever aqui é o
// que significa "notificar"; os canais (sino, e-mail, WhatsApp) são
// consumidores dessa fila. A separação resolve quatro problemas de uma vez:
//
//   1. Idempotência — o cron pode rodar duas vezes sem duplicar mensagem,
//      porque o que foi enviado está marcado em `canais`.
//   2. Auditoria — "a servidora foi avisada?" passa a ter resposta com data.
//   3. Cancelamento — escalar alguém agenda um lembrete para a véspera; se a
//      pessoa for retirada da equipe antes disso, o lembrete precisa ser
//      CANCELADO, senão ela recebe "amanhã tem evento" de um evento em que
//      não está mais. Com envio direto isso seria impossível.
//   4. Extensão — somar um canal novo não toca na regra de negócio.
//
// Idempotente — pula coleção/campos/relações que já existem.
//
// Uso:
//   node scripts/add-notificacoes.mjs
//
// Depois de rodar, execute `node scripts/setup-app-padrao-policy.mjs` para
// conceder permissão da nova coleção aos perfis não-administradores.
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

const COLLECTION = "notificacoes";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

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
    const message =
      data?.errors?.[0]?.message || data?.message || `${res.status} ${res.statusText}`;
    const err = new Error(message);
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

async function ensureCollection(name, note) {
  if (await collectionExists(name)) {
    summary.skipped.push(`collection ${name}`);
    return;
  }
  await api("/collections", {
    method: "POST",
    body: JSON.stringify({
      collection: name,
      meta: { collection: name, hidden: false, singleton: false, note: note || null },
      schema: { name },
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "date_created",
          type: "timestamp",
          meta: {
            special: ["date-created"],
            interface: "datetime",
            readonly: true,
            width: "half",
            display: "datetime",
          },
          schema: {},
        },
      ],
    }),
  });
  summary.collectionsCreated.push(name);
}

async function getFields(collection) {
  try {
    const res = await api(`/fields/${collection}`);
    return new Set((res.data || []).map((f) => f.field));
  } catch {
    return new Set();
  }
}

async function ensureRelation(collection, field, relatedCollection) {
  const existing = await api(`/relations/${collection}`).catch(() => ({ data: [] }));
  if ((existing.data || []).some((r) => r.field === field)) {
    summary.skipped.push(`relation ${collection}.${field}`);
    return;
  }
  await api("/relations", {
    method: "POST",
    body: JSON.stringify({
      collection,
      field,
      related_collection: relatedCollection,
      meta: { sort_field: null },
      // CASCADE: notificação de usuário excluído não tem destinatário e vira
      // lixo. Diferente do histórico de equipe, aqui não há valor em manter.
      schema: { on_delete: "CASCADE" },
    }),
  });
  summary.relationsCreated.push(`${collection}.${field} -> ${relatedCollection}.id`);
}

async function ensureUserM2oField(collection, field, existing, note) {
  if (!existing.has(field)) {
    await api(`/fields/${collection}`, {
      method: "POST",
      body: JSON.stringify({
        field,
        type: "uuid",
        meta: {
          interface: "select-dropdown-m2o",
          special: ["m2o"],
          width: "half",
          display: "user",
          note: note || null,
        },
        schema: {
          is_nullable: true,
          foreign_key_table: "directus_users",
          foreign_key_column: "id",
          on_update: "NO ACTION",
          on_delete: "CASCADE",
        },
      }),
    });
    summary.fieldsCreated.push(`${collection}.${field}`);
  } else {
    summary.skipped.push(`field ${collection}.${field}`);
  }
  await ensureRelation(collection, field, "directus_users");
}

async function ensureField(collection, def, existing) {
  if (existing.has(def.field)) {
    summary.skipped.push(`field ${collection}.${def.field}`);
    return;
  }
  await api(`/fields/${collection}`, {
    method: "POST",
    body: JSON.stringify({
      field: def.field,
      type: def.type,
      meta: {
        interface: def.interface,
        note: def.note || null,
        width: def.width || "full",
        options: def.options || null,
        special: def.special || null,
      },
      schema: {
        is_nullable: true,
        ...(def.defaultValue !== undefined ? { default_value: def.defaultValue } : {}),
      },
    }),
  });
  summary.fieldsCreated.push(`${collection}.${def.field}`);
}

async function main() {
  console.log(`→ Directus: ${URL_BASE}`);

  try {
    await ensureCollection(
      COLLECTION,
      "Fila de notificações: o registro é a notificação; os canais são consumidores.",
    );

    const f = await getFields(COLLECTION);

    await ensureUserM2oField(COLLECTION, "destinatario", f, "Quem recebe o aviso.");

    await ensureField(
      COLLECTION,
      {
        field: "tipo",
        type: "string",
        interface: "select-dropdown",
        note: "Categoria do aviso — define o texto e o comportamento.",
        width: "half",
        options: {
          choices: [
            { text: "Escalada em evento", value: "escala_evento" },
            { text: "Lembrete de evento", value: "lembrete_evento" },
            { text: "Retirada da equipe", value: "remocao_evento" },
            { text: "Evento alterado", value: "alteracao_evento" },
          ],
        },
      },
      f,
    );

    await ensureField(
      COLLECTION,
      { field: "titulo", type: "string", interface: "input", note: "Linha principal do aviso." },
      f,
    );

    await ensureField(
      COLLECTION,
      {
        field: "mensagem",
        type: "text",
        interface: "input-multiline",
        note: "Corpo do aviso, já pronto para exibição/envio.",
      },
      f,
    );

    await ensureField(
      COLLECTION,
      {
        field: "link",
        type: "string",
        interface: "input",
        note: "Rota interna para onde o aviso leva (ex.: /eventos).",
        width: "half",
      },
      f,
    );

    // Rastreabilidade até o registro de origem: permite CANCELAR os avisos
    // pendentes de um vínculo específico quando ele deixa de existir.
    await ensureField(
      COLLECTION,
      {
        field: "referencia_colecao",
        type: "string",
        interface: "input",
        note: "Coleção de origem (ex.: equipe_evento).",
        width: "half",
      },
      f,
    );
    await ensureField(
      COLLECTION,
      {
        field: "referencia_id",
        type: "string",
        interface: "input",
        note: "Id do registro de origem.",
        width: "half",
      },
      f,
    );

    // Null = enviar agora. Data futura = lembrete (a varredura do cron pega
    // quando vencer). É isto que faz o lembrete de véspera funcionar sem
    // agendador próprio.
    await ensureField(
      COLLECTION,
      {
        field: "agendada_para",
        type: "timestamp",
        interface: "datetime",
        note: "Vazio = enviar imediatamente. Data futura = aguarda o vencimento.",
        width: "half",
      },
      f,
    );

    await ensureField(
      COLLECTION,
      {
        field: "canais",
        type: "json",
        interface: "input-code",
        special: ["cast-json"],
        note: 'Estado por canal: {"app":{...},"email":{...},"whatsapp":{...}}.',
      },
      f,
    );

    await ensureField(
      COLLECTION,
      {
        field: "lida_em",
        type: "timestamp",
        interface: "datetime",
        note: "Quando a pessoa leu no sino. Vazio = não lida.",
        width: "half",
      },
      f,
    );

    // Cancelamento em vez de exclusão: preserva o rastro de que o aviso
    // existiu e por que não foi enviado.
    await ensureField(
      COLLECTION,
      {
        field: "cancelada_em",
        type: "timestamp",
        interface: "datetime",
        note: "Aviso agendado que perdeu a razão de ser (ex.: pessoa retirada da equipe).",
        width: "half",
      },
      f,
    );
  } catch (err) {
    summary.errors.push(`${COLLECTION}: ${err.message}`);
  }

  console.log("\n=== RELATÓRIO ===");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 2;
  } else {
    console.log("\n✅ Migração concluída.");
    console.log(
      "\nLembrete: rode `node scripts/setup-app-padrao-policy.mjs` para que os\n" +
        "perfis não-administradores recebam permissão na nova coleção.",
    );
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
