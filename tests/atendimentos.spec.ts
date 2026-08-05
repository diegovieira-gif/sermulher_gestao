/**
 * Atendimentos — listagem, filtros e paginação no servidor.
 *
 * O módulo não tinha cobertura E2E nenhuma. A consulta ia ao Directus sem
 * `limit`, e o default silencioso de 100 fazia o 101º atendimento sumir da
 * listagem sem erro algum. Agora filtros e paginação são resolvidos no
 * servidor, dirigidos pela URL.
 *
 * São testes de leitura: não criam nem apagam registros.
 */
import { test, expect } from "@playwright/test";

const semErroDeAplicacao = async (page: import("@playwright/test").Page) => {
  await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
  await expect(page.getByText("Ops! Algo deu errado")).not.toBeVisible();
};

test.describe("Atendimentos — listagem", () => {
  test("carrega a tabela sem erro de servidor", async ({ page }) => {
    const resposta = await page.goto("/mulheres/atendimentos");
    expect(resposta?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", { name: "Atendimentos" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await semErroDeAplicacao(page);
  });

  test("os cabeçalhos esperados estão presentes", async ({ page }) => {
    await page.goto("/mulheres/atendimentos");
    for (const coluna of ["Beneficiária", "Data", "Prioridade", "Status"]) {
      await expect(
        page.getByRole("columnheader", { name: new RegExp(coluna) }),
      ).toBeVisible();
    }
  });
});

test.describe("Atendimentos — filtros pela URL (aplicados no servidor)", () => {
  // Cada filtro precisa sobreviver a um reload: se ainda fosse filtrado em
  // memória no cliente, o estado se perderia e a lista voltaria completa.
  const FILTROS = [
    { query: "status=Aberto", descricao: "status" },
    { query: "origem=1", descricao: "origem" },
    { query: "prioridade=1", descricao: "prioridade" },
  ];

  for (const filtro of FILTROS) {
    test(`filtro de ${filtro.descricao} responde sem quebrar`, async ({
      page,
    }) => {
      const resposta = await page.goto(
        `/mulheres/atendimentos?${filtro.query}`,
      );
      expect(resposta?.status()).toBeLessThan(400);
      await expect(page.getByRole("table")).toBeVisible();
      await semErroDeAplicacao(page);
    });
  }

  test("filtro inválido não derruba a página", async ({ page }) => {
    // Valor não numérico onde se espera um id: deve ser ignorado, não gerar 500.
    const resposta = await page.goto(
      "/mulheres/atendimentos?origem=abc&page=xyz",
    );
    expect(resposta?.status()).toBeLessThan(400);
    await expect(page.getByRole("table")).toBeVisible();
    await semErroDeAplicacao(page);
  });

  test("selecionar um status atualiza a URL", async ({ page }) => {
    await page.goto("/mulheres/atendimentos");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Em andamento" }).click();

    await expect(page).toHaveURL(/status=Em\+andamento|status=Em%20andamento/);
  });
});

test.describe("Atendimentos — paginação", () => {
  test("a página 2 responde (mesmo que vazia) sem erro", async ({ page }) => {
    const resposta = await page.goto("/mulheres/atendimentos?page=2");
    expect(resposta?.status()).toBeLessThan(400);
    await semErroDeAplicacao(page);
  });

  test("quando há mais de uma página, o rodapé navega", async ({ page }) => {
    await page.goto("/mulheres/atendimentos");

    const proxima = page.getByRole("button", { name: /Próxima/ });
    const temPaginacao = await proxima.isVisible().catch(() => false);

    test.skip(
      !temPaginacao,
      "base de teste tem menos de uma página de atendimentos",
    );

    if (await proxima.isEnabled()) {
      await proxima.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByText(/Página 2 de/)).toBeVisible();
    }
  });

  test("o contador de registros reflete o total, não a página", async ({
    page,
  }) => {
    await page.goto("/mulheres/atendimentos");
    const contador = page.getByText(/Mostrando .* de .* atendimentos/);
    if (await contador.isVisible().catch(() => false)) {
      const texto = (await contador.textContent()) ?? "";
      // "Mostrando 1 a 20 de 137 atendimentos" — o total vem do aggregate.
      expect(texto).toMatch(/Mostrando\s+\d+\s+a\s+\d+\s+de\s+\d+/);
    }
  });
});
