// Cria (idempotente) o campo `imagem` na coleção `campanhas` do Directus.
// Guarda o UUID do arquivo (directus_files) anexado à campanha de WhatsApp.
// Uso: node scripts/add-campaign-image-field.mjs
import { createDirectus, rest, staticToken, createField, readFieldsByCollection } from "@directus/sdk";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  const env = dotenv.parse(fs.readFileSync(".env.local"));
  for (const k in env) process.env[k] = env[k];
}

const API_URL = process.env.DIRECTUS_API_URL || "http://192.168.0.118:8055";
const token = process.env.DIRECTUS_TOKEN;
if (!token) {
  console.error("DIRECTUS_TOKEN ausente em .env.local");
  process.exit(1);
}

const client = createDirectus(API_URL).with(rest()).with(staticToken(token));

async function main() {
  const fields = await client.request(readFieldsByCollection("campanhas"));
  if (fields.some((f) => f.field === "imagem")) {
    console.log("Campo 'imagem' já existe em 'campanhas'. Nada a fazer.");
    return;
  }

  await client.request(
    createField("campanhas", {
      field: "imagem",
      type: "uuid",
      schema: { is_nullable: true },
      meta: {
        interface: "file-image",
        special: ["file"],
        note: "Imagem anexada ao disparo (enviada como mídia no WhatsApp).",
        width: "full",
      },
    })
  );
  console.log("✅ Campo 'imagem' criado em 'campanhas'.");
}

main().catch((e) => {
  console.error("❌ Erro:", e?.errors || e?.message || e);
  process.exit(1);
});
