/**
 * Rotas do menu — guarda de regressão
 *
 * Motivação: a suíte E2E inteira navegava para `/admin/dashboard`,
 * `/admin/escola`, etc. Mas `(admin)` é um *route group* do App Router e NÃO
 * vira segmento de URL — as rotas reais são `/dashboard`, `/escola`. Como o
 * proxy manda toda rota sem sessão para `/login`, os testes "passavam" ao bater
 * numa URL inexistente: o redirecionamento acontecia de qualquer jeito.
 *
 * Este spec fecha essa brecha: autenticado, cada rota do menu precisa
 * responder de verdade — sem 404, sem 500 e sem cair de volta no login.
 *
 * Roda no projeto "chromium" (depende do setup de autenticação).
 */
import { test, expect } from "@playwright/test";
import { MENU_REGISTRY } from "@/lib/menu-registry";

/**
 * Subrotas do sidebar (ver `src/components/layout/Sidebar.tsx`).
 * Ficam explícitas aqui de propósito: o Sidebar é um componente client e
 * importá-lo traria React para dentro do teste sem necessidade.
 */
const SUBROTAS = [
  "/marketing/whatsapp",
  "/mulheres/beneficiarias",
  "/mulheres/atendimentos",
  "/cram",
  "/cram/novo",
  "/escola/cursos",
  "/escola/turmas",
  "/escola/matriculas",
  "/sala-azul/ciclos",
  "/sala-azul/infratores",
  "/relatorios/indicadores",
  "/relatorios/rma",
  "/app-amar/categorias",
  "/app-amar/servicos",
  "/app-amar/campanhas",
  "/app-amar/sonhos",
  "/app-amar/cursos",
  "/app-amar/contatos",
  "/app-amar/projetos",
  // Página 403: não está no menu, mas é para onde o gate manda quem tenta
  // abrir um módulo fora do seu perfil.
  "/acesso-negado",
];

/**
 * `/relatorios` não tem página própria — no sidebar é apenas um agrupador que
 * abre o submenu, nunca um destino. Testar essa href daria um falso negativo.
 */
const SEM_PAGINA_PROPRIA = new Set(["/relatorios"]);

const ROTAS = [
  ...MENU_REGISTRY.map((item) => item.href).filter(
    (href) => !SEM_PAGINA_PROPRIA.has(href),
  ),
  ...SUBROTAS,
];

test.describe("Rotas do menu resolvem autenticado", () => {
  for (const rota of ROTAS) {
    test(`GET ${rota} → renderiza (sem 404/500/login)`, async ({ page }) => {
      const resposta = await page.goto(rota);

      // 404 significa que a rota não existe — o bug que este spec guarda.
      expect(
        resposta?.status(),
        `${rota} respondeu ${resposta?.status()} — a rota existe?`,
      ).toBeLessThan(400);

      // Não pode voltar para o login: com sessão válida, isso indicaria que a
      // rota não existe ou que a autorização quebrou.
      expect(page.url(), `${rota} redirecionou para o login`).not.toContain(
        "/login",
      );

      await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
      await expect(page.getByText("Internal Server Error")).not.toBeVisible();
      await expect(
        page.getByText("This page could not be found"),
      ).not.toBeVisible();

      // O error boundary de `(admin)/error.tsx` captura erros de render no
      // cliente e responde com HTTP 200 — as asserções acima passariam batidas.
      // Foi exatamente assim que um `FormLabel` fora de `<FormField>` chegou a
      // /cram/novo sem ser detectado por tsc, lint nem build.
      await expect(
        page.getByText("Ops! Algo deu errado"),
        `${rota} caiu no error boundary da aplicação`,
      ).not.toBeVisible();
    });
  }
});

test.describe("Nenhum link da aplicação aponta para /admin", () => {
  // O route group `(admin)` não existe como URL. Qualquer href para /admin/...
  // é link morto — havia um em escola/turmas/[id].
  for (const rota of ["/dashboard", "/mulheres/beneficiarias", "/escola"]) {
    test(`${rota} não contém links para /admin`, async ({ page }) => {
      await page.goto(rota);
      const hrefs = await page
        .locator('a[href^="/admin"]')
        .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
      expect(hrefs, `links mortos encontrados em ${rota}`).toEqual([]);
    });
  }
});
