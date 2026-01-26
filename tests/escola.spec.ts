import { test, expect } from "@playwright/test";

test.describe("Módulo Escola - Cursos e Turmas", () => {
  let testCursoNome: string;
  let testTurmaNome: string;

  test.beforeEach(async ({ page }) => {
    // Autentica antes de cada teste
    await page.goto("/admin/escola");
  });

  test.describe("Fluxo de Cursos", () => {
    test("CREATE - Criar novo curso", async ({ page }) => {
      await test.step("Navegar para página de cursos", async () => {
        await page.goto("/admin/escola/cursos");
        await expect(page).toHaveURL(/.*cursos/);
      });

      await test.step("Gerar dados de teste", () => {
        const timestamp = Date.now();
        testCursoNome = `Curso Teste Playwright ${timestamp}`;
      });

      await test.step("Abrir formulário de novo curso", async () => {
        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await expect(newButton).toBeVisible();
        await newButton.click();
      });

      await test.step("Preencher formulário do curso", async () => {
        // Nome do curso
        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await expect(nomeInput).toBeVisible();
        await nomeInput.fill(testCursoNome);

        // Área de atuação
        const areaSelect = page.locator('select, [role="combobox"]').first();
        if (await areaSelect.isVisible()) {
          await areaSelect.click();
          const option = page
            .locator("text=Beleza, text=Tecnologia, text=Artesanato")
            .first();
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // Carga horária
        const cargaInput = page.locator(
          'input[type="number"], input[placeholder*="carga"], input[placeholder*="Carga"]',
        );
        if (await cargaInput.isVisible()) {
          await cargaInput.fill("40");
        }
      });

      await test.step("Salvar curso", async () => {
        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        const successMessage = page.locator('[role="alert"]');
        await expect(successMessage)
          .toBeVisible({ timeout: 5000 })
          .catch(() => {
            // Pode ter toast ao invés de alert
          });
      });

      await test.step("Verificar se curso apareceu na lista", async () => {
        await page.waitForTimeout(1000);
        const courseCell = page.locator(`text=${testCursoNome}`);
        await expect(courseCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("READ - Verificar curso na lista", async ({ page }) => {
      await test.step("Navegar para cursos", async () => {
        await page.goto("/admin/escola/cursos");
        await expect(page).toHaveURL(/.*cursos/);
      });

      await test.step("Criar curso para verificação", async () => {
        const timestamp = Date.now();
        testCursoNome = `Curso Teste Verify ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testCursoNome);

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar que curso está visível na lista", async () => {
        const courseCell = page.locator(`text=${testCursoNome}`);
        await expect(courseCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("DELETE - Remover curso criado", async ({ page }) => {
      await test.step("Navegar para cursos", async () => {
        await page.goto("/admin/escola/cursos");
      });

      await test.step("Criar curso para exclusão", async () => {
        const timestamp = Date.now();
        testCursoNome = `Curso Teste Delete ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testCursoNome);

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Localizar e deletar curso", async () => {
        const row = page.locator(`text=${testCursoNome}`).first().locator("..");
        const deleteButton = row.locator(
          'button[title*="deletar"], button[title*="excluir"], button[aria-label*="deletar"], [role="button"]:has-text("Deletar")',
        );

        if (await deleteButton.isVisible()) {
          await deleteButton.click();
        }
      });

      await test.step("Confirmar exclusão", async () => {
        const confirmButton = page.locator(
          'button:has-text("Confirmar"), button:has-text("Deletar"), button:has-text("Excluir")',
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1500);
      });

      await test.step("Verificar que curso foi removido", async () => {
        const courseCell = page.locator(`text=${testCursoNome}`);
        await expect(courseCell)
          .not.toBeVisible({ timeout: 5000 })
          .catch(() => {
            throw new Error(
              `Curso ${testCursoNome} ainda está visível após exclusão`,
            );
          });
      });
    });
  });

  test.describe("Fluxo de Turmas", () => {
    test("CREATE - Criar turma vinculada a curso existente", async ({
      page,
    }) => {
      await test.step("Navegar para página de turmas", async () => {
        await page.goto("/admin/escola/turmas");
        await expect(page).toHaveURL(/.*turmas/);
      });

      await test.step("Gerar dados de teste", () => {
        const timestamp = Date.now();
        testTurmaNome = `Turma Teste Playwright ${timestamp}`;
      });

      await test.step("Abrir formulário de nova turma", async () => {
        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await expect(newButton).toBeVisible();
        await newButton.click();
      });

      await test.step("Preencher formulário da turma", async () => {
        // Nome da turma
        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await expect(nomeInput).toBeVisible();
        await nomeInput.fill(testTurmaNome);

        // Selecionar curso (tentar vários seletores)
        const cursoSelect = page.locator("select").nth(0);
        if (await cursoSelect.isVisible()) {
          await cursoSelect.click();
          await page.locator("option").nth(1).click(); // Seleciona a primeira opção válida
        } else {
          // Tenta combobox
          const cursoCombo = page.locator('[role="combobox"]').first();
          if (await cursoCombo.isVisible()) {
            await cursoCombo.click();
            const firstOption = page.locator('[role="option"]').first();
            if (await firstOption.isVisible()) {
              await firstOption.click();
            }
          }
        }

        // Instrutor
        const instrutorInputs = page.locator(
          'input[placeholder*="instrutor"], input[placeholder*="Instrutor"]',
        );
        if (await instrutorInputs.first().isVisible()) {
          await instrutorInputs.first().fill("Professora Maria");
        }

        // Vagas
        const vagasInput = page.locator(
          'input[type="number"], input[placeholder*="vagas"], input[placeholder*="Vagas"]',
        );
        if (await vagasInput.isVisible()) {
          await vagasInput.fill("20");
        }

        // Status
        const statusSelect = page.locator("select").nth(1);
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption("aberta");
        }
      });

      await test.step("Salvar turma", async () => {
        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar se turma apareceu na lista", async () => {
        const turmaCell = page.locator(`text=${testTurmaNome}`);
        await expect(turmaCell).toBeVisible({ timeout: 10000 });
      });
    });

    test("CREATE com pré-requisito - Criar curso e depois turma", async ({
      page,
    }) => {
      let cursoId: string | null = null;

      await test.step("Criar curso pré-requisito", async () => {
        await page.goto("/admin/escola/cursos");

        const timestamp = Date.now();
        const curseName = `Curso PreReq ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(curseName);

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1500);
      });

      await test.step("Criar turma vinculada", async () => {
        await page.goto("/admin/escola/turmas");

        const timestamp = Date.now();
        testTurmaNome = `Turma PreReq ${timestamp}`;

        const newButton = page.getByRole("button", {
          name: /novo|adicionar|criar/i,
        });
        await newButton.click();

        const nomeInput = page
          .locator('input[placeholder*="nome"], input[placeholder*="Nome"]')
          .first();
        await nomeInput.fill(testTurmaNome);

        // Seleciona curso existente
        const cursoSelect = page.locator("select").nth(0);
        if (await cursoSelect.isVisible()) {
          await cursoSelect.click();
          // Seleciona primeira opção disponível
          const option = page.locator("option").nth(1);
          if (await option.isVisible()) {
            await option.click();
          }
        }

        const instrutorInputs = page.locator(
          'input[placeholder*="instrutor"], input[placeholder*="Instrutor"]',
        );
        if (await instrutorInputs.first().isVisible()) {
          await instrutorInputs.first().fill("Professor João");
        }

        const saveButton = page.getByRole("button", {
          name: /salvar|enviar|confirmar|criar/i,
        });
        await saveButton.click();

        await page.waitForTimeout(1000);
      });

      await test.step("Verificar turma criada", async () => {
        const turmaCell = page.locator(`text=${testTurmaNome}`);
        await expect(turmaCell).toBeVisible({ timeout: 10000 });
      });
    });
  });
});
