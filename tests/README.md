# Testes E2E com Playwright

## Arquivos de Teste Criados

✅ **tests/beneficiarias.spec.ts** (313 linhas)

- CRUD completo de Beneficiárias
- Gera CPF válido e nome aleatório
- Testes: Create, Read, Update, Delete

✅ **tests/escola.spec.ts** (343 linhas)

- Cursos: Create, Read, Delete
- Turmas: Create com curso existente, Create com pré-requisito
- Validação de dependências

✅ **tests/sala-azul.spec.ts** (524 linhas)

- Infratores: Create, Read, Update, Delete
- Ciclos Reflexivos: Create, Create com participante (desafio), Delete
- Fluxo de participação integrado

✅ **tests/eventos.spec.ts** (427 linhas)

- Eventos: Create (amanhã), Read, Update, Delete
- Calendário: Visualização integrada
- Mudança de status e edição

## Padrões Implementados

✅ `test.step()` para organização de logs estruturados
✅ Sem mocks - testes integram com Directus real
✅ Dados dinâmicos com timestamps e validação
✅ Localização robusta de elementos
✅ Tratamento de timeouts e fallbacks

## Executar Testes

```bash
# Todos os testes
npx playwright test

# Teste específico
npx playwright test tests/beneficiarias.spec.ts

# Com visual (headed mode)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Relatório HTML
npx playwright test && npx playwright show-report
```

## Pré-requisitos

- ✅ Servidor em `http://localhost:3000`
- ✅ Banco de dados Directus acessível
- ✅ Browsers instalados: `npx playwright install`
- ✅ **Credenciais no ambiente** (ver abaixo)

### Credenciais

`tests/auth.setup.ts` lê `TEST_USER_EMAIL` e `TEST_USER_PASSWORD` **do ambiente**,
sem valor padrão. Sem elas, o setup falha com instrução — de propósito: até
2026-07 havia uma credencial real commitada como fallback neste arquivo.

```bash
export TEST_USER_EMAIL="conta-de-teste@exemplo.gov.br"
export TEST_USER_PASSWORD="..."
npx playwright test
```

Use uma **conta de teste dedicada**, nunca a credencial pessoal de um servidor.
No CI, cadastre as duas como secrets do repositório.

> O projeto `smoke` não depende de autenticação e roda sem essas variáveis — é
> por isso que o pipeline atual (`--project=smoke`) continua verde sem elas.

### Rotas: `(admin)` não é segmento de URL

`src/app/(admin)/` é um **route group** do App Router — ele agrupa arquivos sem
aparecer na URL. As rotas reais são `/dashboard`, `/escola`, `/sala-azul`, e
**não** `/admin/dashboard`. Como o proxy redireciona qualquer rota sem sessão
para `/login`, testes apontando para `/admin/...` passavam sem testar nada.
`tests/rotas.spec.ts` guarda contra essa regressão.

## Cenários por Módulo

### Beneficiárias (/mulheres/beneficiarias)

- ✅ Criar com campos obrigatórios (nome_completo)
- ✅ Filtrar por nome
- ✅ Editar telefone/endereço
- ✅ Deletar e verificar remoção

### Escola - Cursos (/escola/cursos)

- ✅ Criar curso com área e carga horária
- ✅ Verificar na lista
- ✅ Deletar curso

### Escola - Turmas (/escola/turmas)

- ✅ Criar turma com curso existente
- ✅ Criar turma com pré-requisito (curso criado antes)
- ✅ Verificar vínculo com curso real

### Sala Azul - Infratores (/sala-azul/infratores)

- ✅ Cadastrar infrator com CPF válido
- ✅ Selecionar nível, status legal, tipos agressão
- ✅ Encontrar e deletar na lista

### Sala Azul - Ciclos (/sala-azul/ciclos)

- ✅ Criar ciclo reflexivo com datas
- ✅ Adicionar infrator como participante (se interface permitir)
- ✅ Deletar ciclo

### Eventos (/eventos)

- ✅ Criar evento para data de amanhã
- ✅ Verificar em calendário/lista
- ✅ Editar título e status
- ✅ Deletar evento

## Dados Gerados

- **Nome**: Aleatório (primeira + última)
- **CPF**: Validado com dígito verificador correto
- **Timestamps**: Garante unicidade entre rodadas
- **Datas**: Calculadas dinamicamente (hoje, amanhã, próximo mês)

## Documentação Completa

Ver [TESTES_E2E_DOCUMENTACAO.md](../TESTES_E2E_DOCUMENTACAO.md) para:

- Detalhes de cada cenário
- Padrões implementados
- Guia de troubleshooting
- Melhorias futuras

---

**Criado com ❤️ para validar a qualidade da aplicação Ser Mulher Gestão**
