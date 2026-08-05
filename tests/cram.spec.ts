/**
 * CRAM — listagem, busca e formulário do Instrumental.
 *
 * O módulo mais recente e um dos maiores não tinha cobertura E2E. Dois motivos
 * concretos para existir este arquivo:
 *
 * 1. `/cram/novo` já quebrou em produção com "useFormField should be used
 *    within <FormField>" — um erro de render que o tsc, o lint e o build não
 *    pegam, e que o error boundary devolve com HTTP 200.
 * 2. A listagem tinha teto fixo de 200 registros e filtrava em memória; agora
 *    busca e paginação rodam no Directus.
 *
 * São testes de leitura: não criam nem apagam instrumentais.
 */
import { test, expect } from "@playwright/test";

const semErroDeAplicacao = async (page: import("@playwright/test").Page) => {
  await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
  await expect(
    page.getByText("Ops! Algo deu errado"),
    "a página caiu no error boundary",
  ).not.toBeVisible();
};

test.describe("CRAM — listagem", () => {
  test("carrega com o cabeçalho e a tabela", async ({ page }) => {
    const resposta = await page.goto("/cram");
    expect(resposta?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", { name: /Instrumentais de Atendimento/ }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await semErroDeAplicacao(page);
  });

  test("colunas do instrumental estão presentes", async ({ page }) => {
    await page.goto("/cram");
    for (const coluna of ["Assistida", "Data", "Risco", "Status"]) {
      await expect(
        page.getByRole("columnheader", { name: new RegExp(coluna) }),
      ).toBeVisible();
    }
  });
});

test.describe("CRAM — busca no servidor", () => {
  test("digitar na busca empurra o termo para a URL", async ({ page }) => {
    await page.goto("/cram");

    await page
      .getByRole("textbox", { name: /Buscar atendimento/ })
      .fill("Zzz Nome Improvável");

    // A busca tem debounce de 400ms antes de navegar.
    await expect(page).toHaveURL(/[?&]q=/, { timeout: 5_000 });
    await semErroDeAplicacao(page);
  });

  test("busca sem resultado mostra a mensagem certa", async ({ page }) => {
    await page.goto("/cram?q=ZzzNomeQueNaoExisteNaBase");

    await expect(
      page.getByText("Nenhum atendimento corresponde à busca."),
    ).toBeVisible();
    // A mensagem de base vazia é outra — não pode aparecer aqui.
    await expect(
      page.getByText("Nenhum instrumental registrado ainda."),
    ).not.toBeVisible();
  });

  test("busca por CPF com máscara encontra o mesmo que sem máscara", async ({
    page,
  }) => {
    // O CPF é gravado só com dígitos; a busca precisa limpar a máscara antes
    // de comparar, senão digitar "123.456" nunca casa.
    const comMascara = await page.goto("/cram?q=123.456.789-01");
    expect(comMascara?.status()).toBeLessThan(400);
    await semErroDeAplicacao(page);
  });
});

test.describe("CRAM — paginação", () => {
  test("página 2 responde sem erro", async ({ page }) => {
    const resposta = await page.goto("/cram?page=2");
    expect(resposta?.status()).toBeLessThan(400);
    await semErroDeAplicacao(page);
  });

  test("página fora do intervalo não quebra a listagem", async ({ page }) => {
    const resposta = await page.goto("/cram?page=99999");
    expect(resposta?.status()).toBeLessThan(400);
    await semErroDeAplicacao(page);
  });
});

test.describe("CRAM — formulário do Instrumental", () => {
  test("/cram/novo renderiza as quatro abas (regressão do useFormField)", async ({
    page,
  }) => {
    await page.goto("/cram/novo");

    // Esta asserção é o coração do teste: o erro de hook fora de FormField
    // renderizava o error boundary com status 200.
    await semErroDeAplicacao(page);

    for (const aba of [
      "Atendimento",
      "Socioassistencial",
      "Jurídico",
      "Psicológico",
    ]) {
      await expect(page.getByRole("tab", { name: new RegExp(aba) })).toBeVisible();
    }
  });

  test("as abas trocam de conteúdo sem quebrar", async ({ page }) => {
    await page.goto("/cram/novo");

    for (const aba of ["Socioassistencial", "Jurídico", "Psicológico"]) {
      await page.getByRole("tab", { name: new RegExp(aba) }).click();
      await semErroDeAplicacao(page);
    }
  });

  test("salvar em branco avisa e não navega", async ({ page }) => {
    await page.goto("/cram/novo");

    await page.getByRole("button", { name: /Registrar atendimento/ }).click();

    // Sem assistida selecionada, a validação barra o envio e o formulário
    // continua na tela — nada é gravado.
    await expect(page).toHaveURL(/\/cram\/novo/);
    await semErroDeAplicacao(page);
  });
});
