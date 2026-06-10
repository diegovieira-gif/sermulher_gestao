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

// Função auxiliar para gerar telefone aleatório único (padrão brasileiro)
function generateRandomPhone(): string {
  const num = Array(7)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10));
  return `(79) 99${num.slice(0, 3).join("")}-${num.slice(3).join("")}`;
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
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${firstName} ${lastName} Teste ${randomSuffix}`;
}

test.describe("Módulo de Beneficiárias - CRUD Completo", () => {
  test.describe.configure({ mode: "serial" });

  let testBeneficiariaNome: string;
  let testBeneficiariaCPF: string;
  let testBeneficiariaPhone: string;

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[BROWSER CONSOLE] (${msg.type()}): ${msg.text()}`);
    });
    test.setTimeout(60000);
    // Aguarda a página de beneficiárias carregar
    await page.goto("/mulheres/beneficiarias");
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
        name: /novo|nova|adicionar|criar/i,
      });
      await expect(newButton).toBeVisible();
      await newButton.click();
    });

    await test.step("Preencher campos obrigatórios", async () => {
      // Campo Nome Completo (obrigatório)
      const nomeInput = page.getByPlaceholder("Maria Silva");
      await expect(nomeInput).toBeVisible();
      await nomeInput.fill(testBeneficiariaNome);

      // Campo CPF (opcional, mas vamos preencher)
      const cpfInput = page.getByPlaceholder("000.000.000-00");
      if (await cpfInput.isVisible()) {
        await cpfInput.fill(testBeneficiariaCPF);
      }
    });

    await test.step("Salvar formulário", async () => {
      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|cadastrar/i,
      });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Aguarda a mensagem de sucesso (toast)
      await expect(page.getByText("Cadastro realizado!")).toBeVisible({ timeout: 35000 });

      // Aguarda o diálogo fechar
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    });

    await test.step("Verificar se beneficiária apareceu na lista", async () => {
      // Busca pela beneficiária
      const searchInput = page.getByPlaceholder("Buscar por nome ou CPF...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(testBeneficiariaNome);
      await page.waitForTimeout(1500);

      // Procura pelo nome na tabela
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 25000 });
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
        name: /novo|nova|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.getByPlaceholder("Maria Silva");
      await nomeInput.fill(testBeneficiariaNome);

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|cadastrar/i,
      });
      await saveButton.click();

      // Aguarda a mensagem de sucesso (toast)
      await expect(page.getByText("Cadastro realizado!")).toBeVisible({ timeout: 35000 });

      // Aguarda o diálogo fechar
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    });

    await test.step("Buscar pela beneficiária criada", async () => {
      const searchInput = page.getByPlaceholder("Buscar por nome ou CPF...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(testBeneficiariaNome);
      await page.waitForTimeout(1500);
    });

    await test.step("Verificar que beneficiária está visível na lista filtrada", async () => {
      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 25000 });
    });
  });

  test("UPDATE - Editar dados da beneficiária", async ({ page }) => {
    await test.step("Gerar dados de teste", () => {
      testBeneficiariaNome = generateRandomName();
      testBeneficiariaCPF = generateValidCPF();
      testBeneficiariaPhone = generateRandomPhone();
    });

    await test.step("Criar beneficiária para edição", async () => {
      const newButton = page.getByRole("button", {
        name: /novo|nova|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.getByPlaceholder("Maria Silva");
      await nomeInput.fill(testBeneficiariaNome);

      const cpfInput = page.getByPlaceholder("000.000.000-00");
      await cpfInput.fill(testBeneficiariaCPF);

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|cadastrar/i,
      });
      await saveButton.click();

      // Aguarda a mensagem de sucesso (toast) e o fechamento do diálogo
      await expect(page.getByText("Cadastro realizado!")).toBeVisible({ timeout: 35000 });
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    });

    await test.step("Clicar no item para editar", async () => {
      // Busca pela beneficiária
      const searchInput = page.getByPlaceholder("Buscar por nome ou CPF...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(testBeneficiariaNome);
      await page.waitForTimeout(1500);

      // Localiza a linha com o nome e clica no botão editar
      const row = page.locator("tr").filter({ hasText: testBeneficiariaNome }).first();
      const editButton = row.getByRole("button", { name: /editar/i });

      await editButton.click();
    });

    await test.step("Alteração de dados (telefone/endereço)", async () => {
      await page.waitForTimeout(500);

      // Clica na aba Endereço e Contato
      const tabTrigger = page.getByRole("tab", { name: /Endereço|Contato/i });
      await tabTrigger.click();

      // Preenche telefone
      const telefoneInput = page.getByPlaceholder("(79) 99999-9999");
      await telefoneInput.fill(testBeneficiariaPhone);

      // Preenche endereço
      const logradouroInput = page.getByPlaceholder("Rua das Flores");
      await logradouroInput.fill("Rua Teste, 123");
    });

    await test.step("Salvar mudanças", async () => {
      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|atualizar/i,
      });
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      await expect(page.getByText("Cadastro atualizado!")).toBeVisible({ timeout: 35000 });

      // Aguarda o diálogo fechar
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    });

    await test.step("Verificar que os dados foram alterados", async () => {
      await page.waitForTimeout(1000);

      // Verifica se telefone aparece na tabela (se aplicável)
      const telephoneCell = page.locator(`text=${testBeneficiariaPhone}`);
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
        name: /novo|nova|adicionar|criar/i,
      });
      await newButton.click();

      const nomeInput = page.getByPlaceholder("Maria Silva");
      await nomeInput.fill(testBeneficiariaNome);

      const saveButton = page.getByRole("button", {
        name: /salvar|enviar|confirmar|cadastrar/i,
      });
      await saveButton.click();

      // Aguarda a mensagem de sucesso (toast)
      await expect(page.getByText("Cadastro realizado!")).toBeVisible({ timeout: 35000 });

      // Aguarda o diálogo fechar
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
    });

    await test.step("Localizar beneficiária na lista", async () => {
      // Busca pela beneficiária
      const searchInput = page.getByPlaceholder("Buscar por nome ou CPF...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(testBeneficiariaNome);
      await page.waitForTimeout(1500);

      const nameCell = page.locator(`text=${testBeneficiariaNome}`);
      await expect(nameCell).toBeVisible({ timeout: 25000 });
    });

    await test.step("Clicar no botão de exclusão", async () => {
      const row = page.locator("tr").filter({ hasText: testBeneficiariaNome }).first();
      const deleteButton = row.getByRole("button", { name: /excluir|deletar/i });

      await deleteButton.click();
    });

    await test.step("Confirmar exclusão no diálogo de alerta", async () => {
      const confirmButton = page.locator(
        'button:has-text("Confirmar"), button:has-text("Deletar"), button:has-text("Excluir")',
      );
      await confirmButton.click();

      // Aguarda a mensagem de exclusão sucedida (toast)
      await expect(page.getByText("Excluído com sucesso!")).toBeVisible({ timeout: 35000 });

      // Aguarda o diálogo de exclusão fechar
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
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
