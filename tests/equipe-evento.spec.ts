/**
 * Equipe do evento — servidoras que atuaram.
 *
 * O vínculo é com `directus_users`, cuja chave é UUID (e não o inteiro dos
 * demais relacionamentos do projeto). O teste abre o diálogo pelo ícone da
 * listagem e confere que o dropdown carrega gente de verdade — se a relação
 * não estiver declarada no Directus, os nomes vêm em branco e o campo fica
 * vazio, que é exatamente o modo de falha que já ocorreu na coluna
 * "Registrado por".
 *
 * Teste de leitura: não adiciona nem remove ninguém da equipe.
 */
import { test, expect, type Page } from "@playwright/test";

const semErroDeAplicacao = async (page: Page) => {
  await expect(page.getByRole("heading", { name: "500" })).not.toBeVisible();
  await expect(page.getByText("Ops! Algo deu errado")).not.toBeVisible();
};

/** Abre o diálogo de equipe do primeiro evento da lista. */
async function abrirEquipeDoPrimeiroEvento(page: Page): Promise<boolean> {
  await page.goto("/eventos");

  // A tela abre no calendário; a aba de lista é onde ficam os ícones de ação.
  const abaLista = page.getByRole("tab", { name: /Lista/i });
  if (await abaLista.isVisible().catch(() => false)) {
    await abaLista.click();
  }

  const botao = page.getByRole("button", { name: /Ver equipe de/ }).first();
  if (!(await botao.isVisible().catch(() => false))) return false;

  await botao.click();
  return true;
}

test.describe("Equipe do evento", () => {
  test("a listagem oferece o botão de equipe em cada evento", async ({
    page,
  }) => {
    await page.goto("/eventos");
    const abaLista = page.getByRole("tab", { name: /Lista/i });
    if (await abaLista.isVisible().catch(() => false)) await abaLista.click();

    const botoes = page.getByRole("button", { name: /Ver equipe de/ });
    test.skip((await botoes.count()) === 0, "sem eventos cadastrados na base");

    await expect(botoes.first()).toBeVisible();
    await semErroDeAplicacao(page);
  });

  test("o diálogo abre com título e contagem", async ({ page }) => {
    test.skip(
      !(await abrirEquipeDoPrimeiroEvento(page)),
      "sem eventos cadastrados na base",
    );

    await expect(
      page.getByRole("heading", { name: /Equipe do evento/ }),
    ).toBeVisible();

    // Ou há gente na equipe, ou a mensagem de vazio — nunca erro.
    const vazio = page.getByText(/Nenhuma pessoa registrada na equipe/);
    const tabela = page.getByRole("table");
    const temVazio = await vazio.isVisible().catch(() => false);
    if (!temVazio) await expect(tabela).toBeVisible();

    await semErroDeAplicacao(page);
  });

  test("o dropdown lista usuários pelo nome", async ({ page }) => {
    test.skip(
      !(await abrirEquipeDoPrimeiroEvento(page)),
      "sem eventos cadastrados na base",
    );

    const combo = page.getByRole("combobox").first();
    await expect(combo).toBeVisible();

    // Se todos já estão na equipe o campo fica desabilitado — estado legítimo.
    test.skip(
      !(await combo.isEnabled()),
      "todos os usuários já constam na equipe deste evento",
    );

    await combo.click();

    const opcoes = page.getByRole("option");
    await expect(opcoes.first()).toBeVisible();

    // O nome não pode vir vazio: isso indicaria a relação com directus_users
    // não declarada (o deep-read devolveria só o UUID).
    const texto = (await opcoes.first().textContent())?.trim() ?? "";
    expect(texto.length).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await semErroDeAplicacao(page);
  });

  test("adicionar sem selecionar ninguém não envia", async ({ page }) => {
    test.skip(
      !(await abrirEquipeDoPrimeiroEvento(page)),
      "sem eventos cadastrados na base",
    );

    const adicionar = page.getByRole("button", { name: /Adicionar/ });
    await expect(adicionar).toBeVisible();
    // Sem seleção o botão fica desabilitado — nada é gravado por engano.
    await expect(adicionar).toBeDisabled();
  });
});
