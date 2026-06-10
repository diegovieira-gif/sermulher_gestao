import { createDirectus, rest, staticToken, updateItem, readItem } from "@directus/sdk";
import dotenv from "dotenv";
import fs from "fs";
import { z } from "zod";

// Load .env.local
if (fs.existsSync(".env.local")) {
  const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const API_URL = process.env.DIRECTUS_API_URL || "http://192.168.0.118:8055";
const token = process.env.DIRECTUS_TOKEN;

const client = createDirectus(API_URL)
  .with(rest())
  .with(staticToken(token));

const contatoSchema = z.object({
  melhor_turno_contato: z.enum(["Manhã", "Tarde"]).optional().nullable(),
});

const enderecoSchema = z.object({
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
});

const beneficiariaSchema = z.object({
  id: z.coerce.number().optional(),
  nome_completo: z.string().min(3),
  nome_social: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  raca_cor_id: z.coerce.number().optional().nullable(),
  estado_civil_id: z.coerce.number().optional().nullable(),
  escolaridade_id: z.coerce.number().optional().nullable(),
  situacao_trabalho_id: z.coerce.number().optional().nullable(),
  quantidade_filhos: z.coerce.number().min(0).optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  contato: contatoSchema.optional().nullable(),
  endereco: enderecoSchema,
  numero_cad_unico: z.string().optional().nullable(),
  perfil_socioeconomico: z.string().optional().nullable(),
  recebe_bolsa_familia: z.coerce.boolean().optional(),
  recebe_bpc: z.coerce.boolean().optional(),
  possui_medida_protetiva: z.coerce.boolean().optional(),
});

function cleanData(data) {
  const cleaned = JSON.parse(JSON.stringify(data));
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
      cleaned[key] = null;
    }
    if (typeof cleaned[key] === "object" && cleaned[key] !== null) {
      Object.keys(cleaned[key]).forEach((subKey) => {
        if (cleaned[key][subKey] === "") cleaned[key][subKey] = null;
      });
    }
  });
  return cleaned;
}

async function main() {
  try {
    // 1. Fetch current beneficiaria id 1
    const beneficiaria = await client.request(readItem("beneficiarias", 1));
    console.log("Original name:", beneficiaria.nome_completo);

    // 2. Prepare update input
    const input = {
      ...beneficiaria,
      nome_completo: beneficiaria.nome_completo, // keep same
      telefone: "5579981401650",
      recebe_bolsa_familia: true,
      recebe_bpc: false,
      possui_medida_protetiva: true,
      endereco: {
        logradouro: "Rua Teste",
        numero: "123",
        bairro: "Centro",
        cidade: "Aracaju"
      }
    };

    const cleanRawData = cleanData(input);
    const payload = beneficiariaSchema.parse(cleanRawData);

    const id = payload.id;
    const payloadToSend = { ...payload };
    delete payloadToSend.id;

    console.log("PAYLOAD TO SEND:", JSON.stringify(payloadToSend, null, 2));

    const result = await client.request(updateItem("beneficiarias", id, payloadToSend));
    console.log("UPDATE SUCCESSFUL! Result ID:", result.id);
    console.log("Updated data received:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ ERRO NO UPDATE TEST:", error);
    if (error.errors) {
      console.error("Detailed Directus Errors:", JSON.stringify(error.errors, null, 2));
    }
  }
}

main();
