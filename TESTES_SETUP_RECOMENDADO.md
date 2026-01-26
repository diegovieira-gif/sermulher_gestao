# 📋 Configuração Recomendada para Testes E2E

## 1. Checklist de Pré-requisitos

### Ambiente Local

- [ ] Node.js 16+ instalado
- [ ] npm ou yarn configurado
- [ ] Git instalado
- [ ] Navegadores instalados (Chrome, Firefox, Webkit)

### Servidor da Aplicação

- [ ] App rodando em `http://localhost:3000`
- [ ] Directus acessível
- [ ] Banco de dados sincronizado
- [ ] API respondendo corretamente

### Playwright Setup

- [ ] `npm install` completado
- [ ] `npx playwright install` executado
- [ ] `tests/auth.setup.ts` configurado
- [ ] Arquivo `playwright/.auth/user.json` existe

---

## 2. Configuração do playwright.config.ts

**Recomendações para testes E2E desta aplicação:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Diretório dos testes
  testDir: "./tests",

  // Timeout global (importante para APIs lentas)
  timeout: 60000, // 60 segundos
  expect: {
    timeout: 30000, // 30 segundos para assertions
  },

  // Paralelização
  fullyParallel: true, // Executar testes em paralelo
  workers: process.env.CI ? 1 : 4, // 1 em CI/CD, 4 localmente

  // Retries apenas em CI
  retries: process.env.CI ? 2 : 0,

  // Report
  reporter: [
    ["html"], // Relatório HTML
    ["json", { outputFile: "test-results.json" }],
    ["junit", { outputFile: "junit.xml" }], // Para CI
  ],

  // Configuração de dispositivos
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // Trace apenas em falha
    screenshot: "only-on-failure", // Screenshot apenas em falha
    video: "retain-on-failure", // Vídeo apenas em falha
  },

  // Projetos (browsers)
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Opcional: Firefox
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     storageState: "playwright/.auth/user.json",
    //   },
    //   dependencies: ["setup"],
    // },
  ],

  // Webserver (opcional, se não tiver servidor rodando)
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
```

---

## 3. Arquivo .gitignore

**Adicionar ao .gitignore do projeto:**

```
# Playwright
test-results/
playwright-report/
playwright/.auth/
*.tracezip

# Node
node_modules/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp

# Screenshots/Videos de teste
debug-*.png
test-videos/
```

---

## 4. Scripts npm recomendados

**Adicionar ao package.json:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "test:e2e:beneficiarias": "playwright test tests/beneficiarias.spec.ts",
    "test:e2e:escola": "playwright test tests/escola.spec.ts",
    "test:e2e:sala-azul": "playwright test tests/sala-azul.spec.ts",
    "test:e2e:eventos": "playwright test tests/eventos.spec.ts",
    "test:e2e:serial": "playwright test --workers=1",
    "test:e2e:ci": "playwright test --workers=1 --reporter=html,junit"
  }
}
```

**Uso:**

```bash
npm run test:e2e              # Todos os testes
npm run test:e2e:debug       # Com debugger
npm run test:e2e:headed      # Ver navegador
npm run test:e2e:beneficiarias  # Teste específico
npm run test:e2e:serial      # Sem paralelização
```

---

## 5. Variáveis de Ambiente (.env)

**Criar arquivo `.env` na raiz:**

```env
# Servidor
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Directus (se diferente)
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_admin_token

# Autenticação
TEST_USER=seu_usuario_teste
TEST_PASSWORD=sua_senha_teste

# Timeouts
PLAYWRIGHT_TIMEOUT=60000
PLAYWRIGHT_WORKERS=4

# CI/CD
CI=false
```

**Usar em testes:**

```typescript
const baseURL = process.env.BASE_URL || "http://localhost:3000";
const timeout = parseInt(process.env.PLAYWRIGHT_TIMEOUT || "60000");
```

---

## 6. CI/CD - GitHub Actions

**Arquivo: `.github/workflows/e2e-tests.yml`**

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    services:
      # Se usar Docker para testes
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci

      - run: npx playwright install --with-deps

      - name: Start application
        run: npm run dev &

      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 120000

      - name: Run E2E tests
        run: npm run test:e2e:ci

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: junit.xml
```

---

## 7. IDE Setup - VS Code

**Extensões Recomendadas:**

- Playwright Test for VSCode
- Test Explorer UI
- Jest (para insights)

**Arquivo: `.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "test-results/**": true,
    "playwright-report/**": true,
    "playwright/.auth/**": true
  },
  "search.exclude": {
    "test-results/**": true,
    "playwright-report/**": true
  }
}
```

---

## 8. Hooks para Git (Pre-commit)

**Arquivo: `.husky/pre-commit`**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Verificar sintaxe dos testes
npx playwright test --list > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Sintaxe dos testes E2E inválida"
  exit 1
fi

echo "✅ Testes E2E validados"
```

**Instalar:**

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit 'npx playwright test --list'
```

---

## 9. Relatórios e Artefatos

**Estrutura recomendada:**

```
projeto/
├── tests/
│   ├── beneficiarias.spec.ts
│   ├── escola.spec.ts
│   ├── sala-azul.spec.ts
│   └── eventos.spec.ts
├── test-results/           (gitignore)
├── playwright-report/      (gitignore)
├── playwright/
│   └── .auth/              (gitignore)
├── playwright.config.ts
└── package.json
```

---

## 10. Boas Práticas

### ✅ DO's

- [ ] Use timestamps para dados únicos
- [ ] Organize com `test.step()`
- [ ] Aguarde elemento visível antes de agir
- [ ] Use roles ao invés de classes
- [ ] Paralelize quando possível
- [ ] Capture screenshots em falhas
- [ ] Use retries apenas em CI/CD
- [ ] Limpe dados ao final (cleanup)

### ❌ DON'Ts

- [ ] Não hardcode dados
- [ ] Não use sleep arbitrários
- [ ] Não dependa de ordem de execução
- [ ] Não deixe dados de teste na BD
- [ ] Não ignore warnings
- [ ] Não use seletores muito específicas
- [ ] Não misture concerns em 1 teste

---

## 11. Troubleshooting Rápido

```bash
# Tudo falhando?
rm -rf node_modules playwright-report test-results
npm install
npx playwright install
npx playwright test tests/auth.setup.ts
npx playwright test --debug

# Teste específico com logs
DEBUG=pw:api npx playwright test tests/beneficiarias.spec.ts

# Limpar auth e recriar
rm -rf playwright/.auth
npx playwright test tests/auth.setup.ts

# Ver relatório
npm run test:e2e:report
```

---

## 12. Recursos Adicionais

- 📖 [Playwright Official Docs](https://playwright.dev)
- 🐛 [Debugging Guide](https://playwright.dev/docs/debug)
- 🎥 [Video Tutorials](https://playwright.dev/docs/videos)
- 💬 [Community Chat](https://discord.gg/playwright)

---

**✨ Setup completo e pronto para produção!**
