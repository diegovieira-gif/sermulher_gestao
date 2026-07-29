import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

/**
 * Credenciais vêm SOMENTE do ambiente.
 *
 * Antes havia um e-mail e uma senha reais como valor padrão neste arquivo —
 * commitados no repositório desde `3878ea7`. Um fallback literal é pior que a
 * ausência dele: o teste passa na máquina de quem tem acesso e o segredo viaja
 * junto com o código. Sem as variáveis, o setup falha com instrução clara.
 */
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

setup("autenticar", async ({ page }) => {
  if (!email || !password) {
    throw new Error(
      "Defina TEST_USER_EMAIL e TEST_USER_PASSWORD no ambiente para rodar os " +
        "testes autenticados.\n" +
        "  Local:  crie um .env com essas variáveis e rode via `dotenv -e .env -- npx playwright test`,\n" +
        "          ou exporte-as na sessão do terminal.\n" +
        "  CI:     cadastre-as como secrets do repositório.\n" +
        "Use uma conta de teste dedicada — nunca a credencial pessoal de um servidor.",
    );
  }

  // Acessa a página de login
  await page.goto("/login");

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Clica em entrar
  await page.click('button[type="submit"]');

  // Espera chegar no dashboard (confirmação de login)
  await page.waitForURL("/dashboard");
  await expect(page.getByText("Olá,")).toBeVisible();

  // Salva os cookies/storage para reuso
  await page.context().storageState({ path: authFile });
});
