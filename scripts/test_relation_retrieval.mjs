import { createDirectus, rest, staticToken, updateItem, readItem } from "@directus/sdk";
import dotenv from "dotenv";
import fs from "fs";

// Load .env.local
if (fs.existsSync(".env.local")) {
  const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const API_URL = process.env.DIRECTUS_API_URL || "http://192.168.0.118:8055";
const token = process.env.DIRECTUS_TOKEN || "ugnm7KeQBsjvqAv3U7YPSHCGDpi49v1f";

const client = createDirectus(API_URL)
  .with(rest())
  .with(staticToken(token));

const BENEFICIARIA_FIELDS = [
  "id",
  "nome_completo",
  "raca_cor_id",
  "estado_civil_id",
  "escolaridade_id",
  "situacao_trabalho_id",
];

async function main() {
  try {
    // 1. Set raca_cor_id to 1 on item 1 (temporary test)
    console.log("Setting raca_cor_id: 1 on item 1...");
    await client.request(updateItem("beneficiarias", 1, { raca_cor_id: 1 }));

    // 2. Read it back using BENEFICIARIA_FIELDS
    const beneficiaria = await client.request(
      readItem("beneficiarias", 1, { fields: BENEFICIARIA_FIELDS })
    );
    console.log("FETCHED ITEM WITH RELATION FIELDS:", JSON.stringify(beneficiaria, null, 2));

    // Reset it to null to avoid leaving test junk
    await client.request(updateItem("beneficiarias", 1, { raca_cor_id: null }));
    console.log("Reset raca_cor_id to null.");
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

main();
