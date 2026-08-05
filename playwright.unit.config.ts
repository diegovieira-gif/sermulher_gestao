import { defineConfig } from "@playwright/test";

/**
 * Testes unitários — lógica pura, sem navegador e sem servidor.
 *
 * Por que o Playwright como runner: ele já está no projeto e já transpila
 * TypeScript. Um Vitest/Jest só para isto acrescentaria dependência e
 * configuração sem ganho real. Aqui não há `webServer` nem `use.baseURL`, então
 * a suíte roda offline — inclusive sem o Directus no ar, que é justamente
 * quando os testes E2E não podem rodar.
 *
 * Uso: `npm run test:unit` — o script invoca o Node com
 * `--conditions=react-server`. Sem essa condição, o pacote `server-only`
 * (importado por `lib/rate-limit`) resolve para o arquivo que lança
 * "cannot be imported from a Client Component". É a mesma condição que o
 * Next.js usa ao montar o bundle de servidor.
 */
export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
});
