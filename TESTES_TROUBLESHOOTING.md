# 🔧 Guia de Troubleshooting - Testes E2E

## ⚠️ Problemas Comuns & Soluções

### 1. Erro: "Timeout waiting for selector"

**Sintoma**:

```
Error: Timeout 30000ms exceeded. waitForSelector failed: selector`
```

**Causas**:

- Elemento não encontrado na página
- Página carregando lentamente
- Seletor incorreto

**Soluções**:

```typescript
// Aumentar timeout
await page.locator('selector').waitFor({ timeout: 60000 });

// Usar debug
npx playwright test tests/arquivo.spec.ts --debug

// Verificar seletor com:
await page.screenshot({ path: 'debug.png' });

// Adicionar wait customizado
await page.waitForFunction(() => {
  return document.querySelector('selector') !== null;
});
```

---

### 2. Erro: "Falha na autenticação"

**Sintoma**:

```
Navigation failed: net::ERR_HTTP_RESPONSE_CODE_401
ou
Redirected para /login
```

**Causas**:

- Auth setup incorreto
- Storage state expirado
- Credenciais inválidas

**Soluções**:

```bash
# Recriar autenticação
rm -rf playwright/.auth/

# Regenerar setup
npx playwright test tests/auth.setup.ts

# Verificar arquivo
cat playwright/.auth/user.json

# Executar com novo setup
npx playwright test --force-exit
```

---

### 3. Erro: "Element is not visible"

**Sintoma**:

```
Error: locator('button').click() failed: element is not visible
```

**Causas**:

- Modal/dialog não aberto
- Elemento fora da viewport
- CSS display: none

**Soluções**:

```typescript
// Aguardar visibilidade
await page.locator("button").waitFor({ state: "visible" });
await page.locator("button").click();

// Scroll para elemento
await page.locator("button").scrollIntoViewIfNeeded();
await page.locator("button").click();

// Verificar antes de agir
if (await page.locator("button").isVisible()) {
  await page.locator("button").click();
}
```

---

### 4. Erro: "Fill failed: element is not an input"

**Sintoma**:

```
Error: locator('element').fill('text') failed: element is not an input
```

**Causas**:

- Seletor apontando para elemento errado
- Input dentro de div customizada
- Elemento é readonly

**Soluções**:

```typescript
// Verificar tipo de elemento
const tag = await page.locator("selector").evaluate((el) => el.tagName);
console.log(tag); // INPUT, TEXTAREA, etc

// Para inputs customizados
await page.locator("selector").click();
await page.locator("selector").type("texto");

// Para contenteditable
await page.locator("selector").click();
await page.keyboard.type("texto");
```

---

### 5. Teste criando duplicados

**Sintoma**:

```
Múltiplos registros com mesmo nome após rodar teste 2x
```

**Causas**:

- Dados hardcoded (sem timestamp)
- Limpeza incompleta
- Dados não encerraram transação

**Soluções**:

```typescript
// Usar timestamp
const timestamp = Date.now();
const nome = `Teste ${timestamp}`;

// Ou UUID
import { randomUUID } from "crypto";
const nome = `Teste ${randomUUID()}`;

// Garantir limpeza
test.afterEach(async ({ page }) => {
  // Deletar dados criados
});
```

---

### 6. Erro: "API/Directus não respondendo"

**Sintoma**:

```
Timeout esperando resposta
ERR_CONNECTION_REFUSED
```

**Causas**:

- Servidor não rodando
- Directus offline
- Problema de rede

**Soluções**:

```bash
# Verificar servidor
curl http://localhost:3000

# Verificar Directus
curl http://localhost:8055 (ou porta configurada)

# Ver logs
npm run dev (terminal onde servidor roda)

# Aumentar timeout no config
baseURL: "http://localhost:3000",
navigationTimeout: 30000,
actionTimeout: 30000
```

---

### 7. Teste falhando em CI/CD mas passa localmente

**Sintoma**:

```
✓ Local
✗ GitHub Actions / GitLab CI
```

**Causas**:

- Timing diferente
- Headless vs headed
- Variáveis de ambiente

**Soluções**:

```typescript
// Aumentar timeouts
await page.waitForTimeout(1000);

// Usar waitForLoadState
await page.waitForLoadState('networkidle');

// Verificar env vars
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// No CI/CD, adicionar:
npx playwright test --workers=1 --timeout=60000
```

---

### 8. Elemento não está em tab/aba correta

**Sintoma**:

```
Locator 'button' not found in main tab
ou
Elemento em aba que não foi clicada
```

**Causas**:

- Múltiplas abas/tabs
- Elemento em frame

**Soluções**:

```typescript
// Clicar em aba primeira
const tab = page.locator('[role="tab"]:has-text("Dados")');
await tab.click();
await page.waitForTimeout(300);

// Depois clicar em botão
const button = page.locator('button:has-text("Salvar")');
await button.click();

// Para frames
const frame = page.frameLocator('iframe[name="embedded"]');
await frame.locator("button").click();
```

---

### 9. CPF/Dados validation falhando

**Sintoma**:

```
"CPF inválido" após preencher campo
"Email deve ser válido"
```

**Causas**:

- Formato incorreto
- Validação do lado do cliente
- Dados não passaram em regex

**Soluções**:

```typescript
// CPF precisa ser 11 dígitos SEM caracteres especiais
const cpf = "12345678901"; // ✓ Correto
const cpf = "123.456.789-01"; // ✗ Com formatação

// Se campo remove automaticamente:
await field.fill("12345678901");
await page.waitForTimeout(200); // Aguardar formatação
const value = await field.inputValue();
console.log(value); // Ver formato final

// Email deve incluir @
const email = "teste@exemplo.com"; // ✓
const email = "teste"; // ✗

// Data deve ser YYYY-MM-DD para date input
const data = "1990-05-15"; // ✓
const data = "15/05/1990"; // ✗
```

---

### 10. Teste lento/flakey

**Sintoma**:

```
Às vezes passa, às vezes falha
Teste demora >5 minutos
```

**Causas**:

- Múltiplos waitForSelector sem timeout
- Sem paralelização
- Muitos page.waitForTimeout()

**Soluções**:

```typescript
// Usar waitFor com timeout apropriado
await page.locator('button').waitFor({ timeout: 5000 });

// Não usar muitos timeouts fixos
// ❌ await page.waitForTimeout(2000);
// ✓ await page.locator('element').waitFor();

// Paralelizar testes
# Padrão: 4 workers
npx playwright test

# Ou especificar
npx playwright test --workers=8

// Usar retries para flakiness
{
  retries: 2,
  timeout: 30000
}
```

---

## 🎯 Debug Avançado

### Modo Debug Step-by-Step:

```bash
npx playwright test tests/arquivo.spec.ts --debug
```

### Gerar Screenshot no meio do teste:

```typescript
await page.screenshot({ path: "debug-screenshot.png" });
```

### Inspecionar seletores:

```bash
npx playwright test --debug
# Usar browser tools integrado
```

### Trace recording:

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Ver logs detalhados:

```bash
DEBUG=pw:api npx playwright test
DEBUG=pw:browser npx playwright test
DEBUG=pw:protocol npx playwright test
```

---

## 📋 Checklist de Resolução

- [ ] Verificar se servidor está rodando
- [ ] Verificar se autenticação está válida
- [ ] Aumentar timeout para 60000ms
- [ ] Usar `--debug` para visualizar
- [ ] Tirar screenshot/trace
- [ ] Verificar console logs
- [ ] Testar selector no DevTools
- [ ] Procurar by role ao invés de classe
- [ ] Aguardar estado de carregamento
- [ ] Checar se está em iframe/popup/aba diferente

---

## 🆘 Quando Tudo Mais Falha

```bash
# Nuclear option: limpar tudo e recomçar
rm -rf node_modules
rm -rf playwright
npm install
npx playwright install
rm -rf playwright/.auth/
npx playwright test tests/auth.setup.ts
npx playwright test

# Se ainda não funcionar, verificar:
npm list # Conflitos de versão?
node --version # Node atualizado?
npx playwright --version # Playwright atualizado?
```

---

## 📞 Recursos Adicionais

- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Playwright Troubleshooting](https://playwright.dev/docs/troubleshooting)
- [Common Issues](https://github.com/microsoft/playwright/issues)

---

**💡 Tip**: Sempre usar `--debug` primeira de resolver problema manual!
