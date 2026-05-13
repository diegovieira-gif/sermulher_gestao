import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // Nunca gravar vídeo em CI para economizar tempo/storage
    video: "off",
  },

  // Inicia o servidor Next.js automaticamente no CI após o build
  webServer: process.env.CI
    ? {
        command: "npm run start",
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          // Em CI, aponta para a variável de ambiente do runner (nunca hardcoded)
          NEXT_PUBLIC_DIRECTUS_URL:
            process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055",
          DIRECTUS_URL:
            process.env.DIRECTUS_URL || "http://localhost:8055",
          AUTH_SECRET: process.env.AUTH_SECRET || "ci-only-secret",
          AUTH_URL: BASE_URL,
          AUTH_TRUST_HOST: "true",
        },
      }
    : undefined,

  projects: [
    // Projeto isolado para smoke tests — sem dependência de auth
    {
      name: "smoke",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Projeto de setup de autenticação para testes CRUD
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Testes CRUD completos (dependem do setup de auth)
    {
      name: "chromium",
      testIgnore: /smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
