/**
 * Smoke Tests — Observatório
 *
 * Verifica que o ObservatorioClient carrega, as tabs de coleções
 * estão acessíveis e o Dialog de criação abre sem erros.
 *
 * Colecções esperadas (COLLECTIONS_CONFIG):
 *   obser_periodos → "Períodos"
 *   obser_dashboards → "Dashboards"
 *   obser_cram_atendimentos_psicologicos → (nome abreviado na tab)
 *   obser_cram_orientacoes_juridicas_distribuicao
 *   obser_sermulher_ouvidoria_series
 *   obser_sermulher_servicos_distribuicao
 *
 * Não escreve dados — fecha o Dialog sem submeter.
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke — Observatório", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/observatorio");
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem crash", async ({ page }) => {
    await expect(page).toHaveURL(/observatorio/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });

  test("Título 'Observatório' está visível", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /observat[oó]rio/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Tabs de coleções estão renderizadas", async ({ page }) => {
    // TabsList renderiza múltiplos TabsTriggers — pelo menos 2 devem existir
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 8_000 });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("Tabela de dados da primeira tab está presente", async ({ page }) => {
    // Após carregar, deve haver uma tabela com ao menos o cabeçalho
    await expect(
      page.locator("table, [role='table']").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Campo de pesquisa está presente e aceita input", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="Buscar"], input[placeholder*="pesquisar"], input[placeholder*="filtrar"]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
    await searchInput.fill("teste");
    await page.waitForTimeout(600);
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
    await searchInput.fill("");
  });

  test("Botão 'Novo Registro' abre o Dialog de formulário", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /novo registro/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
    await btn.click();

    // Dialog (não Sheet) — usa role="dialog"
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Confirma que o Dialog tem ao menos um campo editável
    await expect(
      dialog.locator("input, textarea, select, [role='combobox']").first(),
    ).toBeVisible({ timeout: 5_000 });

    // Fecha sem submeter
    await page.keyboard.press("Escape");
    await expect(btn).toBeVisible();
  });

  test("Navegar entre tabs não causa crash", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();

    // Clica nas primeiras 3 tabs (ou quantas existirem) e verifica ausência de 500
    const limit = Math.min(count, 3);
    for (let i = 0; i < limit; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600); // aguarda fetch da tab
      await expect(page.getByText("Internal Server Error")).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    }
  });

  test("Não exibe estado de 'Acesso Restrito' (permissões ok)", async ({
    page,
  }) => {
    // Se Directus retornar 403, o componente exibe "Acesso Restrito"
    await expect(page.getByText(/acesso restrito/i)).not.toBeVisible({
      timeout: 8_000,
    });
  });
});
