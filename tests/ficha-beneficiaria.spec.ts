/**
 * Ficha da beneficiária — abas, linha do tempo e rascunho automático.
 *
 * Cobre o que foi construído para reduzir perda de trabalho durante o
 * atendimento presencial: a visão cronológica do caso e o rascunho local que
 * sobrevive a uma sessão expirada.
 *
 * São testes de leitura — o único registro criado fica no `localStorage` do
 * navegador de teste, e é limpo pelo próprio caso.
 */
import { test, expect, type Page } from "@playwright/test";

const semErroDeAplicacao = async (page: Page) => {
  await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
  await expect(page.getByText("Ops! Algo deu errado")).not.toBeVisible();
};

/** Abre a ficha da primeira beneficiária da lista; pula se a base estiver vazia. */
async function abrirPrimeiraFicha(page: Page): Promise<boolean> {
  await page.goto("/mulheres/beneficiarias");
  const primeiroLink = page.locator('a[href^="/mulheres/beneficiarias/"]').first();

  if (!(await primeiroLink.isVisible().catch(() => false))) return false;

  await primeiroLink.click();
  await expect(page).toHaveURL(/\/mulheres\/beneficiarias\/\d+/);
  return true;
}

test.describe("Ficha — abas", () => {
  test("a ficha abre com todas as abas, incluindo Linha do Tempo", async ({
    page,
  }) => {
    test.skip(!(await abrirPrimeiraFicha(page)), "sem beneficiárias na base");

    for (const aba of [
      "Dados",
      "Linha do Tempo",
      "Benefícios",
      "Eventos",
      "Cursos",
    ]) {
      await expect(page.getByRole("tab", { name: aba })).toBeVisible();
    }
    await semErroDeAplicacao(page);
  });

  test("?tab=linha-do-tempo abre direto na aba (link compartilhável)", async ({
    page,
  }) => {
    await page.goto("/mulheres/beneficiarias");
    const primeiroLink = page
      .locator('a[href^="/mulheres/beneficiarias/"]')
      .first();
    test.skip(
      !(await primeiroLink.isVisible().catch(() => false)),
      "sem beneficiárias na base",
    );

    const href = await primeiroLink.getAttribute("href");
    await page.goto(`${href?.split("?")[0]}?tab=linha-do-tempo`);

    await expect(
      page.getByRole("tab", { name: "Linha do Tempo" }),
    ).toHaveAttribute("data-state", "active");
    await semErroDeAplicacao(page);
  });

  test("aba inválida na URL cai em Dados, sem quebrar", async ({ page }) => {
    await page.goto("/mulheres/beneficiarias");
    const primeiroLink = page
      .locator('a[href^="/mulheres/beneficiarias/"]')
      .first();
    test.skip(
      !(await primeiroLink.isVisible().catch(() => false)),
      "sem beneficiárias na base",
    );

    const href = await primeiroLink.getAttribute("href");
    const resposta = await page.goto(`${href?.split("?")[0]}?tab=inexistente`);

    expect(resposta?.status()).toBeLessThan(400);
    await expect(page.getByRole("tab", { name: "Dados" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});

test.describe("Ficha — linha do tempo", () => {
  test("mostra os eventos ou a mensagem de vazio (nunca erro)", async ({
    page,
  }) => {
    test.skip(!(await abrirPrimeiraFicha(page)), "sem beneficiárias na base");

    await page.getByRole("tab", { name: "Linha do Tempo" }).click();
    await semErroDeAplicacao(page);

    // Um dos dois estados legítimos precisa estar visível.
    const vazio = page.getByText(/Nenhum registro ainda/);
    const itens = page.locator("ol li");

    const temVazio = await vazio.isVisible().catch(() => false);
    if (!temVazio) {
      expect(await itens.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("Ficha — rascunho automático", () => {
  test("o formulário oferece recuperar um preenchimento anterior", async ({
    page,
  }) => {
    // Semeia um rascunho como se a sessão tivesse caído no meio do cadastro.
    await page.goto("/mulheres/beneficiarias");
    await page.evaluate(() => {
      localStorage.setItem(
        "sigma:rascunho:beneficiaria:nova",
        JSON.stringify({
          salvoEm: Date.now(),
          valores: { nome_completo: "Rascunho De Teste Automatizado" },
        }),
      );
    });

    await page.reload();
    await page.getByRole("button", { name: /Nova Beneficiária/ }).click();

    await expect(
      page.getByText(/preenchimento não salvo deste formulário/i),
    ).toBeVisible();

    await page.getByRole("button", { name: "Recuperar" }).click();

    await expect(
      page.getByRole("textbox", { name: /Nome Completo/ }),
    ).toHaveValue("Rascunho De Teste Automatizado");

    // Limpa o que este teste semeou.
    await page.evaluate(() =>
      localStorage.removeItem("sigma:rascunho:beneficiaria:nova"),
    );
  });

  test("descartar remove o rascunho e a faixa some", async ({ page }) => {
    await page.goto("/mulheres/beneficiarias");
    await page.evaluate(() => {
      localStorage.setItem(
        "sigma:rascunho:beneficiaria:nova",
        JSON.stringify({
          salvoEm: Date.now(),
          valores: { nome_completo: "Descarte Este Rascunho" },
        }),
      );
    });

    await page.reload();
    await page.getByRole("button", { name: /Nova Beneficiária/ }).click();
    await page.getByRole("button", { name: /Descartar/ }).click();

    await expect(
      page.getByText(/preenchimento não salvo deste formulário/i),
    ).not.toBeVisible();

    const restou = await page.evaluate(() =>
      localStorage.getItem("sigma:rascunho:beneficiaria:nova"),
    );
    expect(restou).toBeNull();
  });

  test("rascunho vencido (mais de 24h) não é oferecido", async ({ page }) => {
    await page.goto("/mulheres/beneficiarias");
    await page.evaluate(() => {
      localStorage.setItem(
        "sigma:rascunho:beneficiaria:nova",
        JSON.stringify({
          salvoEm: Date.now() - 25 * 60 * 60 * 1000,
          valores: { nome_completo: "Rascunho Vencido" },
        }),
      );
    });

    await page.reload();
    await page.getByRole("button", { name: /Nova Beneficiária/ }).click();

    await expect(
      page.getByText(/preenchimento não salvo deste formulário/i),
    ).not.toBeVisible();
  });
});
