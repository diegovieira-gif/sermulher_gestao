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

async function main() {
  try {
    // 1. Login to get a token
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "diego.vieira@aracaju.se.gov.br",
        password: "Irland@2023"
      })
    });
    if (!loginRes.ok) {
      throw new Error(`Login HTTP ${loginRes.status}: ${await loginRes.text()}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    console.log("LOGIN SUCCESS! Token received:", token ? "YES" : "NO");

    // 2. Fetch /users/me
    const meRes = await fetch(`${API_URL}/users/me?fields=first_name,role.name`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!meRes.ok) {
      throw new Error(`Me HTTP ${meRes.status}: ${await meRes.text()}`);
    }
    const meData = await meRes.json();
    console.log("ME DATA:", meData.data);
  } catch (error) {
    console.error("FAILED:", error);
  }
}

main();
