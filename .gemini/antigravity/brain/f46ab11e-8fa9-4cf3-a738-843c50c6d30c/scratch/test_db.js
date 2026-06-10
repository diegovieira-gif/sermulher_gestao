import { createDirectus, rest, staticToken, readItem, updateItem } from "@directus/sdk";

const API_URL = "http://192.168.0.118:8055";
async function main() {
  try {
    const loginResult = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "diego.vieira@aracaju.se.gov.br",
        password: "@Sermulher2025"
      })
    });
    const { data } = await loginResult.json();
    const token = data.access_token;
    
    const authedClient = createDirectus(API_URL)
      .with(rest())
      .with(staticToken(token));
      
    // Test update with object
    console.log("Updating ID 1482 with object fields...");
    await authedClient.request(updateItem("beneficiarias", 1482, {
      endereco: { logradouro: "Rua Object test", numero: "123", bairro: "Bairro Object", cidade: "Aracaju" },
      contato: { melhor_turno_contato: "Tarde" }
    }));
    
    let item = await authedClient.request(readItem("beneficiarias", 1482));
    console.log("After object update:");
    console.log("Endereco Type:", typeof item.endereco, "Value:", item.endereco);
    console.log("Contato Type:", typeof item.contato, "Value:", item.contato);
    console.log("---");

    // Test update with stringified
    console.log("Updating ID 1482 with stringified fields...");
    await authedClient.request(updateItem("beneficiarias", 1482, {
      endereco: JSON.stringify({ logradouro: "Rua String test", numero: "456", bairro: "Bairro String", cidade: "Aracaju" }),
      contato: JSON.stringify({ melhor_turno_contato: "Manhã" })
    }));
    
    item = await authedClient.request(readItem("beneficiarias", 1482));
    console.log("After stringified update:");
    console.log("Endereco Type:", typeof item.endereco, "Value:", item.endereco);
    console.log("Contato Type:", typeof item.contato, "Value:", item.contato);
    
  } catch (e) {
    console.error(e);
  }
}

main();
