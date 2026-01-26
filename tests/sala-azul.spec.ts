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
    "João",
    "Carlos",
    "Paulo",
    "Francisco",
    "Antonio",
    "Miguel",
    "Rafael",
    "Lucas",
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

test.describe("Módulo Sala Azul - Ciclos e Infratores", () => {
  let testInfratorNome: string;
  let testInfratorCPF: string;
  let testCicloNome: string;

  test.beforeEach(async ({ page }) => {
    // Aguarda a página de sala azul
    await page.goto("/admin/sala-azul");
  });

  test.describe("Fluxo de Infratores", () => {
    test("CREATE - Cadastrar novo infrator", async ({ page }) => {
      await test.step("Navegar para página de infratores", async () => {
        await page.goto("/admin/sala-azul/infratores");
        await expect(page).toHaveURL(/.*infratores/);
      });

      await test.step("Gerar dados de teste", () => {
        testInfratorNome = generateRandomName();
        testInfratorCPF = generateValidCPF();
      });

      await test.step("Abrir formulário de novo infrator", async () => {
        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await expect(newButton).toBeVisible();
        await newButton.click();
      });

      await test.step("Preencher dados do infrator", async () => {
        // Nome completo
        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await expect(nomeInput).toBeVisible();
        await nomeInput.fill(testInfratorNome);

        // CPF
        const cpfInput = page.locator(
          'input[placeholder*="CPF"], input[placeholder*="cpf"]',
        );
        if (await cpfInput.isVisible()) {
          await cpfInput.fill(testInfratorCPF);
        }

        // Data de nascimento
        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.first().isVisible()) {
          await dateInputs.first().fill("1990-05-15");
        }

        // Telefone
        const phoneInputs = page.locator(
          'input[placeholder*="telefone"], input[placeholder*="Telefone"]',
        );
        if (await phoneInputs.first().isVisible()) {
          await phoneInputs.first().fill("(79) 99999-8888");
        }

        // Nível (select)
        const nivelSelect = page.locator("select").nth(0);
        if (await nivelSelect.isVisible()) {
          await nivelSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // Status Legal (select)
        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // Tipos de Agressão (checkboxes ou multiselect)
        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.first().isVisible()) {
          await checkboxes.first().check();
        }
      });

      await test.step("Salvar infrator", async () => {
        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar se infrator apareceu na lista", async () => {
        const infratorCell = page.locator(`text=${testInfratorNome}`);
        await expect(infratorCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("READ - Verificar infrator na lista", async ({ page }) => {
      await test.step("Navegar para infratores", async () => {
        await page.goto("/admin/sala-azul/infratores");
      });

      await test.step("Criar infrator para verificação", async () => {
        testInfratorNome = generateRandomName();
        testInfratorCPF = generateValidCPF();

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testInfratorNome);

        const cpfInput = page.locator(
          'input[placeholder*="CPF"], input[placeholder*="cpf"]',
        );
        if (await cpfInput.isVisible()) {
          await cpfInput.fill(testInfratorCPF);
        }

        const nivelSelect = page.locator("select").nth(0);
        if (await nivelSelect.isVisible()) {
          await nivelSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.first().isVisible()) {
          await checkboxes.first().check();
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar que infrator está na lista", async () => {
        const infratorCell = page.locator(`text=${testInfratorNome}`);
        await expect(infratorCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("DELETE - Remover infrator", async ({ page }) => {
      await test.step("Navegar para infratores", async () => {
        await page.goto("/admin/sala-azul/infratores");
      });

      await test.step("Criar infrator para exclusão", async () => {
        testInfratorNome = generateRandomName();
        testInfratorCPF = generateValidCPF();

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testInfratorNome);

        const cpfInput = page.locator(
          'input[placeholder*="CPF"], input[placeholder*="cpf"]',
        );
        if (await cpfInput.isVisible()) {
          await cpfInput.fill(testInfratorCPF);
        }

        const nivelSelect = page.locator("select").nth(0);
        if (await nivelSelect.isVisible()) {
          await nivelSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.first().isVisible()) {
          await checkboxes.first().check();
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Deletar infrator", async () => {
        const row = page
          .locator(`text=${testInfratorNome}`)
          .first()
          .locator("..");
        const deleteButton = row.locator(
          'button[title*="deletar"], button[title*="excluir"]',
        );

        if (await deleteButton.isVisible()) {
          await deleteButton.click();
        }
      });

      await test.step("Confirmar exclusão", async () => {
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Deletar")',
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1500);
      });

      await test.step("Verificar que infrator foi removido", async () => {
        const infratorCell = page.locator(`text=${testInfratorNome}`);
        await expect(infratorCell)
          .not.toBeVisible({ timeout: 5000 })
          .catch(() => {
            throw new Error(
              `Infrator ${testInfratorNome} ainda está visível após exclusão`,
            );
          });
      });
    });
  });

  test.describe("Fluxo de Ciclos Reflexivos", () => {
    test("CREATE - Criar novo ciclo reflexivo", async ({ page }) => {
      await test.step("Navegar para página de ciclos", async () => {
        await page.goto("/admin/sala-azul/ciclos");
        await expect(page).toHaveURL(/.*ciclos/);
      });

      await test.step("Gerar dados de teste", () => {
        const timestamp = Date.now();
        testCicloNome = `Ciclo Reflexivo ${timestamp}`;
      });

      await test.step("Abrir formulário de novo ciclo", async () => {
        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await expect(newButton).toBeVisible();
        await newButton.click();
      });

      await test.step("Preencher dados do ciclo", async () => {
        // Nome
        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await expect(nomeInput).toBeVisible();
        await nomeInput.fill(testCicloNome);

        // Local
        const localSelect = page.locator("select").nth(0);
        if (await localSelect.isVisible()) {
          await localSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // Data de início
        const dataInicioInput = page.locator('input[type="date"]').nth(0);
        if (await dataInicioInput.isVisible()) {
          const today = new Date().toISOString().split("T")[0];
          await dataInicioInput.fill(today);
        }

        // Data de fim
        const dataFimInput = page.locator('input[type="date"]').nth(1);
        if (await dataFimInput.isVisible()) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          await dataFimInput.fill(nextMonth.toISOString().split("T")[0]);
        }

        // Status
        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const option = page.locator("option").nth(0);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      });

      await test.step("Salvar ciclo", async () => {
        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar se ciclo apareceu na lista", async () => {
        const cicloCell = page.locator(`text=${testCicloNome}`);
        await expect(cicloCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("CREATE com participante - Criar ciclo e adicionar infrator", async ({
      page,
    }) => {
      let infratorNomeForParticipacao: string = "";

      await test.step("Criar infrator pré-requisito", async () => {
        await page.goto("/admin/sala-azul/infratores");

        infratorNomeForParticipacao = generateRandomName();
        const infratorCPF = generateValidCPF();

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(infratorNomeForParticipacao);

        const cpfInput = page.locator(
          'input[placeholder*="CPF"], input[placeholder*="cpf"]',
        );
        if (await cpfInput.isVisible()) {
          await cpfInput.fill(infratorCPF);
        }

        const nivelSelect = page.locator("select").nth(0);
        if (await nivelSelect.isVisible()) {
          await nivelSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.first().isVisible()) {
          await checkboxes.first().check();
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Criar ciclo reflexivo", async () => {
        await page.goto("/admin/sala-azul/ciclos");

        const timestamp = Date.now();
        testCicloNome = `Ciclo com Participante ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testCicloNome);

        const localSelect = page.locator("select").nth(0);
        if (await localSelect.isVisible()) {
          await localSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const dataInicioInput = page.locator('input[type="date"]').nth(0);
        if (await dataInicioInput.isVisible()) {
          const today = new Date().toISOString().split("T")[0];
          await dataInicioInput.fill(today);
        }

        const dataFimInput = page.locator('input[type="date"]').nth(1);
        if (await dataFimInput.isVisible()) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          await dataFimInput.fill(nextMonth.toISOString().split("T")[0]);
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Adicionar infrator como participante (se interface permitir)", async () => {
        // Tenta localizar o ciclo e abrir seus detalhes
        const cicloRow = page.locator(`text=${testCicloNome}`);
        if (await cicloRow.isVisible()) {
          const cicloLink = cicloRow.first().locator("a, button");
          if (await cicloLink.isVisible()) {
            await cicloLink.click();
            await page.waitForTimeout(500);

            // Procura por botão de adicionar participante
            const addParticipanteButton = page.getByRole("button", {
              name: /adicionar participante|add participante|novo participante/i,
            });
            if (
              await addParticipanteButton
                .isVisible({ timeout: 3000 })
                .catch(() => false)
            ) {
              await addParticipanteButton.click();

              // Seleciona infrator
              const infratorSelect = page.locator("select");
              if (await infratorSelect.isVisible()) {
                await infratorSelect.click();
                const option = page.locator(
                  `text=${infratorNomeForParticipacao}`,
                );
                if (await option.isVisible()) {
                  await option.click();
                }
              }

              // Salva participante
              const saveButton = page.getByRole("button", {
                name: /salvar|confirmar|adicionar/i,
              });
              if (await saveButton.isVisible()) {
                await saveButton.click();
                await page.waitForTimeout(500);
              }
            }
          }
        }
      });

      await test.step("Verificar ciclo criado", async () => {
        const cicloCell = page.locator(`text=${testCicloNome}`);
        await expect(cicloCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("DELETE - Remover ciclo criado", async ({ page }) => {
      await test.step("Navegar para ciclos", async () => {
        await page.goto("/admin/sala-azul/ciclos");
      });

      await test.step("Criar ciclo para exclusão", async () => {
        const timestamp = Date.now();
        testCicloNome = `Ciclo Delete ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testCicloNome);

        const localSelect = page.locator("select").nth(0);
        if (await localSelect.isVisible()) {
          await localSelect.click();
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const dataInicioInput = page.locator('input[type="date"]').nth(0);
        if (await dataInicioInput.isVisible()) {
          const today = new Date().toISOString().split("T")[0];
          await dataInicioInput.fill(today);
        }

        const dataFimInput = page.locator('input[type="date"]').nth(1);
        if (await dataFimInput.isVisible()) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          await dataFimInput.fill(nextMonth.toISOString().split("T")[0]);
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Deletar ciclo", async () => {
        const row = page.locator(`text=${testCicloNome}`).first().locator("..");
        const deleteButton = row.locator(
          'button[title*="deletar"], button[title*="excluir"]',
        );

        if (await deleteButton.isVisible()) {
          await deleteButton.click();
        }
      });

      await test.step("Confirmar exclusão", async () => {
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Deletar")',
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1500);
      });

      await test.step("Verificar que ciclo foi removido", async () => {
        const cicloCell = page.locator(`text=${testCicloNome}`);
        await expect(cicloCell)
          .not.toBeVisible({ timeout: 5000 })
          .catch(() => {
            throw new Error(
              `Ciclo ${testCicloNome} ainda está visível após exclusão`,
            );
          });
      });
    });
  });
});
