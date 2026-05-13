/**
 * Smoke Tests — Tramitações (Kanban)
 *
 * Verifica que o Server Component carrega, o KanbanBoard hidrata
 * e os elementos de navegação estão operacionais.
 *
 * O módulo de Tramitações não tem um botão "Adicionar" — é um board
 * de movimentação de cards entre colunas. Os testes cobrem:
 * 1. Carregamento sem crash
 * 2. Presença das colunas do Kanban
 * 3. Operacionalidade do campo de pesquisa
 * 4. Dropdown de filtro por setor
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke — Tramitações / Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/tramitacoes");
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem crash", async ({ page }) => {
    await expect(page).toHaveURL(/tramitacoes/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();

    // Confirma que a página não está em branco
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });

  test("Título 'Fluxo de Trabalho' está visível", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /fluxo de trabalho/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Colunas do Kanban estão renderizadas", async ({ page }) => {
    // O KanbanBoard renderiza pelo menos uma das três colunas
    const colunas = [/aguardando/i, /em an[aá]lise/i, /conclu[ií]do/i];
    let found = 0;
    for (const col of colunas) {
      if (await page.getByText(col).isVisible().catch(() => false)) {
        found++;
      }
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test("Campo de pesquisa responde à digitação sem crash", async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[placeholder*="buscar"], input[placeholder*="Buscar"], input[placeholder*="pesquisar"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8_000 });

    // Digitar não deve causar crash
    await searchInput.fill("teste playwright");
    await page.waitForTimeout(600); // aguarda debounce de 500ms
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();

    // Limpar
    await searchInput.fill("");
  });

  test("Dropdown de filtro por setor está presente", async ({ page }) => {
    // O KanbanBoard tem <Select> para filtrar por setor
    const filterTrigger = page.locator('[role="combobox"]').first();
    await expect(filterTrigger).toBeVisible({ timeout: 8_000 });
  });

  test("Não exibe erro de conexão (Directus acessível)", async ({ page }) => {
    // Se Directus estiver offline, a página exibe mensagem de erro específica
    await expect(
      page.getByText(/erro ao carregar tramita[çc][ãa]o/i),
    ).not.toBeVisible({ timeout: 8_000 });
  });
});
