/**
 * Smoke Tests — App Amar (Módulos: Campanhas, Serviços, Categorias)
 *
 * Para cada sub-módulo verifica:
 * 1. Página carrega sem crash (sem 500, sem tela branca)
 * 2. Tabela de listagem está renderizada
 * 3. Botão primário de criação abre o Sheet/formulário sem erro de interface
 *
 * Não escreve dados no banco — fecha o formulário sem submeter.
 */
import { test, expect } from "@playwright/test";

// ─── Índice do App Amar ───────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Índice", () => {
  test("Página índice carrega e exibe cards de navegação", async ({ page }) => {
    await page.goto("/admin/app-amar");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/app-amar/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();

    // Cards de navegação para as secções (Categorias, Serviços, Campanhas…)
    const sections = ["Campanhas", "Serviços", "Categorias", "Sonhos"];
    for (const section of sections) {
      await expect(page.getByText(section)).toBeVisible();
    }
  });
});

// ─── Campanhas ────────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Campanhas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/app-amar/campanhas");
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem crash", async ({ page }) => {
    await expect(page).toHaveURL(/campanhas/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });

  test("Tabela de listagem está presente", async ({ page }) => {
    // O componente CampanhasClient renderiza <table> com cabeçalho "Título"
    await expect(
      page.getByRole("columnheader", { name: /título/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Botão 'Nova Campanha' abre o Sheet do formulário", async ({ page }) => {
    const btn = page.getByRole("button", { name: /nova campanha/i });
    await expect(btn).toBeVisible();
    await btn.click();

    // O SheetContent deve aparecer com algum campo de formulário visível
    const sheetContent = page.locator('[role="dialog"], [data-radix-dialog-content]');
    await expect(sheetContent.first()).toBeVisible({ timeout: 5_000 });

    // Confirma que o Sheet tem pelo menos um input
    await expect(page.locator('input').first()).toBeVisible({ timeout: 5_000 });

    // Fecha sem submeter (tecla Escape)
    await page.keyboard.press("Escape");
    await expect(btn).toBeVisible();
  });
});

// ─── Serviços ─────────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Serviços", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/app-amar/servicos");
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem crash", async ({ page }) => {
    await expect(page).toHaveURL(/servicos/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });

  test("Tabela de listagem está presente", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: /título/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Botão de criação abre o Sheet do formulário", async ({ page }) => {
    // Botão pode dizer "Novo Serviço" ou apenas ter ícone Plus
    const btn = page.getByRole("button", { name: /novo servi[çc]o/i });
    await expect(btn).toBeVisible();
    await btn.click();

    const sheetContent = page.locator('[role="dialog"], [data-radix-dialog-content]');
    await expect(sheetContent.first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(btn).toBeVisible();
  });
});

// ─── Categorias ───────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Categorias", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/app-amar/categorias");
    await page.waitForLoadState("networkidle");
  });

  test("Página carrega sem crash", async ({ page }) => {
    await expect(page).toHaveURL(/categorias/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });

  test("Tabela de listagem está presente com coluna 'Nome'", async ({
    page,
  }) => {
    await expect(
      page.getByRole("columnheader", { name: /nome/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Botão 'Nova Categoria' abre o Sheet do formulário", async ({ page }) => {
    const btn = page.getByRole("button", { name: /nova categoria/i });
    await expect(btn).toBeVisible();
    await btn.click();

    const sheetContent = page.locator('[role="dialog"], [data-radix-dialog-content]');
    await expect(sheetContent.first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(btn).toBeVisible();
  });
});

// ─── Sonhos ───────────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Sonhos", () => {
  test("Página carrega sem crash", async ({ page }) => {
    await page.goto("/admin/app-amar/sonhos");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/sonhos/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();

    // Página deve ter conteúdo visível
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });
});

// ─── Contatos ─────────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Contatos", () => {
  test("Página carrega sem crash", async ({ page }) => {
    await page.goto("/admin/app-amar/contatos");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/contatos/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});

// ─── Projetos ─────────────────────────────────────────────────────────────────

test.describe("Smoke — App Amar / Projetos", () => {
  test("Página carrega sem crash", async ({ page }) => {
    await page.goto("/admin/app-amar/projetos");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/projetos/);
    await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
    await expect(page.getByText("Internal Server Error")).not.toBeVisible();
  });
});
