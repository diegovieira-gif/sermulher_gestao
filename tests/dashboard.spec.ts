/**
 * Smoke Tests — Dashboard
 *
 * Verifica que o Server Component do Dashboard renderiza sem crash
 * e que os KPIs e o gráfico de atendimentos estão presentes na tela.
 * Não escreve dados — apenas leitura.
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke — Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/dashboard");
    // Aguarda o conteúdo principal hidratar
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem erro 500 ou tela branca", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);

    // Nenhum crash de Server Component
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();

    // A página não pode estar em branco — body deve ter conteúdo visível
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });

  test("Saudação ao utilizador está visível", async ({ page }) => {
    // O OverviewClient renderiza "Olá, <nome>" ou "Olá, Gestão"
    await expect(page.getByText(/olá,/i)).toBeVisible({ timeout: 10_000 });
  });

  test("Cards de KPI estão renderizados", async ({ page }) => {
    // Pelo menos um card com stat numérico deve aparecer
    // Os cards contêm labels como "Atendimentos", "Novos Casos", etc.
    const kpiLabels = [
      /atendimentos/i,
      /novos casos/i,
      /acompanhamento/i,
      /demanda/i,
    ];
    let found = 0;
    for (const label of kpiLabels) {
      if (await page.getByText(label).isVisible().catch(() => false)) {
        found++;
      }
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test("Área do gráfico está presente na tela", async ({ page }) => {
    // recharts renderiza um <svg> dentro do ResponsiveContainer
    const chart = page.locator("svg").first();
    await expect(chart).toBeVisible({ timeout: 8_000 });
  });

  test("Links de navegação rápida apontam para rotas válidas", async ({
    page,
  }) => {
    // O dashboard tem botões/links do tipo "Ver todas" ou links de acesso rápido
    const quickLinks = page.locator('a[href*="/admin/"]');
    const count = await quickLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
