import {
  createDirectus,
  rest,
  staticToken,
  createCollection,
  createField,
} from "@directus/sdk";
import fs from "fs";
import path from "path";

// --- TENTATIVA DE LER DO .ENV.LOCAL (Opcional) ---
let envConfig = {};
try {
  const envContent = fs.readFileSync(
    path.resolve(process.cwd(), ".env.local"),
    "utf-8",
  );
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) envConfig[key.trim()] = value.trim();
  });
} catch (e) {
  // Ignora se não achar .env
}

// --- CONFIGURAÇÃO ---
// Prioridade: Variável do código > Variável do .env > Padrão
const DIRECTUS_URL = "http://192.168.0.115:8055";

// ATENÇÃO: COLOQUE SEU TOKEN AQUI SE NÃO ESTIVER NO .ENV
const ADMIN_TOKEN =
  envConfig.DIRECTUS_TOKEN || "j8EbY77uaPAhN0ZnGrDvoQI9VUGTvl_7";

console.log(`🔌 Conectando em: ${DIRECTUS_URL}`);
console.log(`🔑 Usando token (início): ${ADMIN_TOKEN.substring(0, 5)}...`);

const client = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(ADMIN_TOKEN));

const auxiliaryTables = [
  { name: "config_origens", note: "Origens dos atendimentos" },
  { name: "config_prioridades", note: "Níveis de prioridade" },
  { name: "config_tipos_evento", note: "Tipos de eventos" },
  { name: "config_tipos_agressao", note: "Tipos de violência" },
  { name: "config_niveis_periculosidade", note: "Níveis de risco" },
  { name: "config_status_legal", note: "Status legal do processo" },
  { name: "config_bairros", note: "Lista de bairros" },
  { name: "config_beneficios", note: "Benefícios sociais" },
  { name: "config_encaminhamentos", note: "Locais de encaminhamento" },
  { name: "config_campanhas", note: "Campanhas ativas" },
];

async function setup() {
  console.log("🚀 Iniciando criação das tabelas de configuração...");

  for (const table of auxiliaryTables) {
    try {
      process.stdout.write(`Criando collection: ${table.name}... `);

      // 1. Cria a Collection
      await client.request(
        createCollection({
          collection: table.name,
          meta: {
            icon: "settings",
            note: table.note,
            display_template: "{{nome}}",
          },
          schema: { name: table.name },
        }),
      );

      // 2. Cria o campo 'nome'
      await client.request(
        createField(table.name, {
          field: "nome",
          type: "string",
          meta: { interface: "input", required: true, width: "full" },
          schema: { is_nullable: false },
        }),
      );

      // 3. Cria o campo 'cor'
      await client.request(
        createField(table.name, {
          field: "cor",
          type: "string",
          meta: { interface: "select-color", width: "half" },
          schema: { default_value: "#64748b" },
        }),
      );

      console.log(`✅ OK`);
    } catch (error) {
      // Tratamento de erro melhorado
      const isDuplicate =
        error?.errors?.[0]?.code === "INVALID_PAYLOAD" ||
        error?.message?.includes("already exists");

      if (isDuplicate) {
        console.log(`⚠️ Já existe (Pulando)`);
      } else {
        console.log(`❌ ERRO`);
        // Mostra o erro real do Directus
        if (error?.errors) {
          console.error("   Detalhes:", JSON.stringify(error.errors, null, 2));
        } else {
          console.error("   Detalhes:", error);
        }
      }
    }
  }

  console.log("🏁 Script finalizado.");
}

setup();
