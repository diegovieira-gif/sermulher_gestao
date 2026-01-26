import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("autenticar", async ({ page }) => {
  // Acessa a página de login
  await page.goto("/login");

  // Preenche credenciais (use variáveis de ambiente!)
  await page.fill(
    'input[name="email"]',
    process.env.TEST_USER_EMAIL || "diego.vieira@aracaju.se.gov.br",
  );
  await page.fill(
    'input[name="password"]',
    process.env.TEST_USER_PASSWORD || "Irland@2023",
  );

  // Clica em entrar
  await page.click('button[type="submit"]');

  // Espera chegar no dashboard (confirmação de login)
  await page.waitForURL("/dashboard");
  await expect(page.getByText("Olá,")).toBeVisible();

  // Salva os cookies/storage para reuso
  await page.context().storageState({ path: authFile });
});
