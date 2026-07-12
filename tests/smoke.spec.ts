/**
 * Smoke Tests — PR Gate
 *
 * Objetivo: verificar rapidamente que as rotas principais respondem sem erros
 * e que a interface básica está intacta. NÃO escreve dados no banco.
 *
 * Projeto Playwright: "smoke" (sem dependência de auth setup).
 * Tempo estimado: ~30 segundos.
 */
import { test, expect } from "@playwright/test";

// Rotas protegidas devem redirecionar para /login — nunca retornar 500
const PROTECTED_ROUTES = [
  { path: "/admin/dashboard", label: "Dashboard" },
  { path: "/admin/sala-azul", label: "Sala Azul" },
  { path: "/admin/escola", label: "Escola" },
  { path: "/admin/mulheres/beneficiarias", label: "Mulheres / Beneficiárias" },
  { path: "/admin/eventos", label: "Eventos" },
  { path: "/admin/marketing", label: "Marketing" },
];

test.describe("Smoke — Página de Login", () => {
  test("GET /login → 200 e formulário visível", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);

    // Formulário de autenticação presente
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Não exibe erro 500 na página de login", async ({ page }) => {
    await page.goto("/login");
    // Se Next.js retornar uma página de erro 500, o heading será "500"
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});

test.describe("Smoke — Rotas protegidas redirecionam sem crash", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`GET ${route.path} → redireciona para /login (${route.label})`, async ({
      page,
    }) => {
      await page.goto(route.path);

      // Deve acabar na página de login — nunca em branco ou 500
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('input[name="email"]')).toBeVisible();

      // Confirma ausência de erro de servidor
      await expect(
        page.getByRole("heading", { name: "500" }),
      ).not.toBeVisible();
      await expect(
        page.getByText("Internal Server Error"),
      ).not.toBeVisible();
    });
  }
});

test.describe("Smoke — Rotas de API exigem autorização (regressão IDOR)", () => {
  // Guarda contra os itens 1.1/1.2 do PDR de auditoria: os proxies de arquivo
  // e imagem NUNCA devem servir conteúdo sem uma sessão válida, e o endpoint
  // de debug foi removido. Sem cookie de sessão, o contexto `request` do
  // Playwright bate direto na API — o 401 é retornado antes de qualquer
  // chamada ao Directus, então não depende de banco disponível no CI.

  test("GET /api/files/<uuid> sem sessão → 401 (nunca 200)", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/files/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status()).toBe(401);
  });

  test("GET /api/whatsapp/imagem/<uuid> sem sessão → 401 (nunca 200)", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/whatsapp/imagem/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status()).toBe(401);
  });

  test("GET /api/test-directus → removido (404)", async ({ request }) => {
    const res = await request.get("/api/test-directus");
    expect(res.status()).toBe(404);
  });

  test("POST /api/campanhas/automaticas/run sem segredo → bloqueado (401/503)", async ({
    request,
  }) => {
    const res = await request.post("/api/campanhas/automaticas/run");
    // 401 = segredo inválido/ausente; 503 = CRON_SECRET não configurado no runner.
    // Em nenhum caso deve executar campanhas (200).
    expect([401, 503]).toContain(res.status());
  });
});

test.describe("Smoke — Recursos estáticos", () => {
  test("Ficheiro de estilos globais carrega (sem 404)", async ({ page }) => {
    // Navega para a app para forçar carregamento dos assets
    await page.goto("/login");

    // Verifica que não há erros de rede graves (CSS/JS 404 que quebram layout)
    const failedRequests: string[] = [];
    page.on("requestfailed", (req) => {
      // Ignora falhas de fetch para Directus (esperado se não acessível em CI)
      if (!req.url().includes("8055")) {
        failedRequests.push(req.url());
      }
    });

    // Recarrega para capturar falhas de assets
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Nenhum asset estático (JS/CSS) deve ter falhado
    const staticFailures = failedRequests.filter((url) =>
      /\.(js|css|woff2?)(\?|$)/.test(url),
    );
    expect(staticFailures).toHaveLength(0);
  });
});
