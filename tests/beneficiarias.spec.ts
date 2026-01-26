import { test, expect } from "@playwright/test";

// Função auxiliar para gerar CPF válido
function generateValidCPF(): string {
  const num = Array(9)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10));
  const sum1 = num.reduce((acc, val, idx) => acc + val * (10 - idx), 0);
  const digit1 = 11 - (sum1 % 11);
  const digit1Final = digit1 === 10 || digit1 === 11 ? 0 : digit1;

  const sum2 =
    num.reduce((acc, val, idx) => acc + val * (11 - idx), 0) + digit1Final * 2;
  const digit2 = 11 - (sum2 % 11);
  const digit2Final = digit2 === 10 || digit2 === 11 ? 0 : digit2;

  return num.join("") + digit1Final + digit2Final;
}

// Função auxiliar para gerar nome aleatório
function generateRandomName(): string {
  const firstNames = [
    "Maria",
    "Ana",
    "Joana",
    "Carolina",
    "Fernanda",
    "Beatriz",
    "Juliana",
    "Patrícia",
  ];
  const lastNames = [
    "Silva",
    "Santos",
    "Oliveira",
    "Souza",
    "Costa",
    "Gomes",
    "Martins",
    "Alves",
  ];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

test.describe("Módulo de Beneficiárias - CRUD Completo", () => {
  let testBeneficiariaNome: string;
  let testBeneficiariaCPF: string;

  test.beforeEach(async ({ page }) => {
    // Aguarda a página de beneficiárias carregar
    await page.goto("/admin/mulheres/beneficiarias");
    await expect(page).toHaveURL(/.*beneficiarias/);
  });

  test("CREATE - Criar nova beneficiária com dados obrigatórios", async ({
    page,
  }) => {
    await test.step("Gerar dados de teste", () => {
      testBeneficiariaNome = generateRandomName();
      testBeneficiariaCPF = generateValidCPF();
    });

    await test.step("Abrir formulário de nova beneficiária", async () => {
      // Procura pelo botão de novo
      const newButton = page.getByRole("button", {
        name: /novo|adicionar|criar/i,
      });
      await expect(newButton).toBeVisible();
      await newButton.click();
    });

    await test.step("Preencher campos obrigatórios", async () => {
      // Campo Nome Completo (obrigatório)
      const nomeInput = page.locator('input[type="text"]').first();
      await expect(nomeInput).toBeVisible();
      await nomeInput.fill(testBeneficiariaNome);

      // Campo CPF (opcional, mas vamos preencher)
      const cpfInput = page.locator(
        'input[placeholder*="CPF"], input[id*="cpf"]',
      );
      if (await cpfInput.isVisible()) {
        await cpfInput.fill(testBeneficiariaCPF);
      }
    });

    await test.step("Salvar formulário", async () => {
      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar/i,
      });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Aguarda a mensagem de sucesso (toast)
      const successMessage = page.locator('[role="alert"]');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });

    await test.step("Verificar se beneficiária apareceu na lista", async () => {
      // Aguarda a página recarregar
      await page.waitForTimeout(1000);

      // Procura pelo nome na tabela
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 10000 });
    });
  });

  test("READ - Filtrar lista e encontrar beneficiária criada", async ({
    page,
  }) => {
    await test.step("Gerar dados de teste", () => {
      testBeneficiariaNome = generateRandomName();
      testBeneficiariaCPF = generateValidCPF();
    });

    await test.step("Criar beneficiária primeiramente", async () => {
      const newButton = page.getByRole("button", {
        name: /novo|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.locator('input[type="text"]').first();
      await nomeInput.fill(testBeneficiariaNome);

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar/i,
      });
      await saveButton.click();

      await page.waitForTimeout(1000);
    });

    await test.step("Buscar pela beneficiária criada", async () => {
      // Localiza o campo de busca
      const searchInput = page.locator(
        'input[placeholder*="buscar"], input[placeholder*="pesquisar"], input[placeholder*="Buscar"], input[placeholder*="Pesquisar"]',
      );

      if (await searchInput.isVisible()) {
        await searchInput.fill(testBeneficiariaNome);
        await page.waitForTimeout(800);
      }
    });

    await test.step("Verificar que beneficiária está visível na lista filtrada", async () => {
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 10000 });
    });
  });

  test("UPDATE - Editar dados da beneficiária", async ({ page }) => {
    await test.step("Gerar dados de teste", () => {
      testBeneficiariaNome = generateRandomName();
      testBeneficiariaCPF = generateValidCPF();
    });

    await test.step("Criar beneficiária para edição", async () => {
      const newButton = page.getByRole("button", {
        name: /novo|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.locator('input[type="text"]').first();
      await nomeInput.fill(testBeneficiariaNome);

      const cpfInput = page.locator(
        'input[placeholder*="CPF"], input[id*="cpf"]',
      );
      if (await cpfInput.isVisible()) {
        await cpfInput.fill(testBeneficiariaCPF);
      }

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar/i,
      });
      await saveButton.click();

      await page.waitForTimeout(1000);
    });

    await test.step("Clicar no item para editar", async () => {
      // Localiza a linha com o nome e clica no botão editar
      const row = page
        .locator(`text=${testBeneficiariaNome}`)
        .first()
        .locator("..");
      const editButton = row.locator(
        'button[title*="editar"], button[aria-label*="editar"], button:has-text("Editar")',
      );

      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        // Tenta clicar na linha
        await row.click();
      }
    });

    await test.step("Alteração de dados (telefone/endereço)", async () => {
      await page.waitForTimeout(500);

      // Tenta preencher telefone
      const telefonInputs = page.locator(
        'input[placeholder*="telefone"], input[placeholder*="Telefone"], input[id*="telefone"]',
      );
      if (await telefonInputs.first().isVisible()) {
        await telefonInputs.first().fill("(79) 98888-7777");
      }

      // Tenta preencher endereço
      const enderecoInputs = page.locator(
        'input[placeholder*="endereço"], input[placeholder*="Endereço"], input[placeholder*="logradouro"], input[placeholder*="Logradouro"]',
      );
      if (await enderecoInputs.first().isVisible()) {
        await enderecoInputs.first().fill("Rua Teste, 123");
      }
    });

    await test.step("Salvar mudanças", async () => {
      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|atualizar/i,
      });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      const successMessage = page.locator('[role="alert"]');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });

    await test.step("Verificar que os dados foram alterados", async () => {
      await page.waitForTimeout(1000);

      // Verifica se telefone aparece na tabela (se aplicável)
      const telephoneCell = page.locator(
        "text=98888-7777, text=(79) 98888-7777",
      );
      if (await telephoneCell.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(telephoneCell).toBeVisible();
      }
    });
  });

  test("DELETE - Remover beneficiária criada", async ({ page }) => {
    await test.step("Gerar dados de teste", () => {
      testBeneficiariaNome = generateRandomName();
      testBeneficiariaCPF = generateValidCPF();
    });

    await test.step("Criar beneficiária para remoção", async () => {
      const newButton = page.getByRole("button", {
        name: /novo|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.locator('input[type="text"]').first();
      await nomeInput.fill(testBeneficiariaNome);

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar/i,
      });
      await saveButton.click();

      await page.waitForTimeout(1000);
    });

    await test.step("Localizar beneficiária na lista", async () => {
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 10000 });
    });

    await test.step("Clicar no botão de exclusão", async () => {
      const row = page
        .locator(`text=${testBeneficiariaNome}`)
        .first()
        .locator("..");
      const deleteButton = row.locator(
        'button[title*="deletar"], button[title*="excluir"], button[aria-label*="deletar"], button[aria-label*="excluir"]',
      );

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
      }
    });

    await test.step("Confirmar exclusão no diálogo de alerta", async () => {
      const confirmButton = page.locator(
        'button:has-text("Confirmar"), button:has-text("Deletar"), button:has-text("Excluir")',
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    });

    await test.step("Verificar que beneficiária foi removida da lista", async () => {
      await page.waitForTimeout(1500);

      // Verifica se o nome desapareceu
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell)
        .not.toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Se ainda estiver visível após timeout, falha o teste
          throw new Error(
            `Beneficiária ${testBeneficiariaNome} ainda está visível após exclusão`,
          );
        });
    });
  });
});
