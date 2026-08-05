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
  { path: "/dashboard", label: "Dashboard" },
  { path: "/sala-azul", label: "Sala Azul" },
  { path: "/escola", label: "Escola" },
  { path: "/mulheres/beneficiarias", label: "Mulheres / Beneficiárias" },
  { path: "/eventos", label: "Eventos" },
  { path: "/marketing", label: "Marketing" },
  { path: "/cram", label: "CRAM" },
  { path: "/tramitacoes", label: "Gestão de Demandas" },
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
  // Contra `next dev`, cada rota é compilada sob demanda no primeiro acesso;
  // com vários workers em paralelo isso passa dos 30s padrão e o teste falha
  // por tempo, não por defeito. No CI a suíte roda sobre o build pronto e
  // nunca chega perto deste limite.
  test.setTimeout(90_000);

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

test.describe("Smoke — Login limita tentativas (força bruta)", () => {
  // Este teste NÃO precisa do Directus: com o banco fora do ar o login falha
  // mesmo, e a falha é o que alimenta o contador. A partir do limite, a rota
  // responde 429 antes de tentar autenticar.
  //
  // Usa um e-mail único e inexistente de propósito: o limite por conta é
  // rígido (5), enquanto o limite por origem é folgado (30) justamente para
  // que a rede compartilhada da secretaria não seja bloqueada — então gastar
  // ~6 tentativas aqui não derruba o `auth.setup.ts`.
  test("6ª tentativa com a mesma conta → 429 com Retry-After", async ({
    request,
  }) => {
    const email = `bloqueio-${Date.now()}@exemplo.invalid`;
    const tentativa = () =>
      request.post("/api/auth/login", {
        data: { email, password: "senha-errada-de-proposito" },
      });

    for (let i = 1; i <= 5; i++) {
      const res = await tentativa();
      expect(
        res.status(),
        `tentativa ${i} deveria ser recusada por credencial, não por limite`,
      ).toBe(401);
    }

    const bloqueada = await tentativa();
    expect(bloqueada.status()).toBe(429);
    expect(Number(bloqueada.headers()["retry-after"])).toBeGreaterThan(0);

    const corpo = await bloqueada.json();
    expect(corpo.error).toContain("Muitas tentativas");
  });

  test("login sem e-mail ou senha → 400 (não consome tentativa)", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/login", { data: { email: "" } });
    expect(res.status()).toBe(400);
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

    // Nenhum asset estático (JS/CSS) deve ter falhado.
    // `/__nextjs*` são endpoints internos do servidor de desenvolvimento (por
    // exemplo o proxy de fontes); não existem no build de produção — que é
    // como o CI roda — então falhar por causa deles seria ruído de ambiente.
    const staticFailures = failedRequests.filter(
      (url) => /\.(js|css|woff2?)(\?|$)/.test(url) && !url.includes("/__nextjs"),
    );
    expect(staticFailures).toHaveLength(0);
  });
});
