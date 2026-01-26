# Testes E2E - Documentação

## Visão Geral

Este documento descreve os 4 arquivos de teste E2E criados usando Playwright para validar os módulos principais da aplicação "Ser Mulher Gestão".

## Estrutura de Testes

### 1. **tests/beneficiarias.spec.ts** - Módulo de Beneficiárias

**Localização da Interface**: `/admin/mulheres/beneficiarias`

#### Cenários Implementados:

##### CREATE - Criar nova beneficiária

- Gera nome aleatório e CPF válido
- Navega para o formulário de nova beneficiária
- Preenche apenas os campos obrigatórios (nome_completo)
- Salva e verifica aparecimento na lista
- Usa `test.step` para organizar logs

##### READ - Filtrar e encontrar

- Cria uma beneficiária
- Utiliza campo de busca para filtrar por nome
- Verifica visibilidade na lista filtrada

##### UPDATE - Editar dados

- Cria beneficiária
- Abre formulário para edição
- Altera telefone ou endereço
- Salva e verifica mudanças

##### DELETE - Remover beneficiária

- Cria beneficiária
- Localiza na lista
- Clica botão de deletar
- Confirma exclusão em diálogo
- Verifica remoção da lista

**Dados de Teste**:

- Nome: Aleatório (8 primeiros nomes + 8 últimos nomes)
- CPF: Gerado com validação de dígito verificador
- Telefone: (79) 98888-7777
- Endereço: Rua Teste, 123

---

### 2. **tests/escola.spec.ts** - Módulo Escola (Cursos e Turmas)

**Localização**: `/admin/escola/cursos` e `/admin/escola/turmas`

#### Fluxo de Cursos

##### CREATE - Criar novo curso

- Navega para página de cursos
- Gera nome com timestamp para unicidade
- Preenche: Nome, Área de Atuação, Carga Horária
- Salva e verifica na lista

##### READ - Verificar na lista

- Cria curso
- Valida aparecimento na listagem

##### DELETE - Remover curso

- Cria curso
- Localiza e deleta
- Confirma remoção

#### Fluxo de Turmas

##### CREATE - Criar turma com curso existente

- Navega para turmas
- Seleciona curso real do combobox/select
- Preenche: Nome, Instrutor, Vagas, Status
- Salva e verifica na lista

##### CREATE com Pré-requisito

- Cria curso pré-requisito automaticamente
- Em seguida, cria turma vinculada ao curso
- Valida ambas as operações

**Dados de Teste**:

- Nome Curso: `Curso Teste Playwright {timestamp}`
- Nome Turma: `Turma Teste Playwright {timestamp}`
- Instrutor: "Professora Maria" / "Professor João"
- Vagas: 20
- Status: "aberta"

---

### 3. **tests/sala-azul.spec.ts** - Módulo Sala Azul

**Localização**: `/admin/sala-azul/ciclos` e `/admin/sala-azul/infratores`

#### Fluxo de Infratores

##### CREATE - Cadastrar infrator

- Gera nome e CPF válidos
- Preenche dados: Nome, CPF, Data Nascimento, Telefone
- Seleciona Nível, Status Legal, Tipos de Agressão
- Salva e verifica na lista

##### READ - Encontrar na lista

- Cria infrator
- Valida visibilidade na listagem

##### DELETE - Remover infrator

- Cria infrator
- Localiza e deleta
- Confirma remoção

#### Fluxo de Ciclos Reflexivos

##### CREATE - Novo ciclo

- Gera nome com timestamp
- Preenche: Nome, Local, Data Início, Data Fim, Status
- Data de início: hoje, Data fim: próximo mês
- Salva e verifica

##### CREATE com Participante (Desafio)

- Cria infrator pré-requisito
- Cria ciclo reflexivo
- Tenta adicionar infrator como participante do ciclo
- Validação com fallbacks se interface não permitir

##### DELETE - Remover ciclo

- Cria ciclo
- Localiza e deleta
- Confirma remoção

**Dados de Teste**:

- Nome Infrator: Aleatório (8 primeiros + 8 últimos nomes masculinos)
- CPF: Validado
- Telefone: (79) 99999-8888
- Data Nascimento: 1990-05-15
- Nome Ciclo: `Ciclo Reflexivo {timestamp}`

---

### 4. **tests/eventos.spec.ts** - Módulo Eventos/Agenda

**Localização**: `/admin/eventos`

#### Fluxo de Eventos

##### CREATE - Criar evento para amanhã

- Gera nome e datas
- Data Início: Amanhã
- Data Fim: Dois dias depois
- Preenche: Nome, Tipo, Data Início, Data Fim, Descrição, Local
- Salva e verifica na lista

##### READ - Verificar em calendário/lista

- Cria evento
- Navega para vista de calendário ou lista
- Valida visibilidade
- Verifica data formatada

##### UPDATE - Editar evento

- Cria evento
- Abre para edição
- Altera título (adiciona " - Editado")
- Muda status (para Confirmado ou Realizado)
- Salva e verifica mudanças

##### DELETE - Remover evento

- Cria evento
- Localiza na lista
- Clica deletar
- Confirma exclusão
- Verifica remoção

#### Fluxo de Calendário

##### Visualizar evento no calendário

- Cria evento
- Alterna para vista de calendário
- Tenta localizar evento
- Validação com tratamento para eventos em datas futuras

**Dados de Teste**:

- Nome: `Evento Teste Playwright {timestamp}`
- Data Início: Amanhã (YYYY-MM-DD)
- Data Fim: Dois dias depois
- Tipo: Primeira opção disponível
- Descrição: "Evento de teste criado automaticamente por Playwright"
- Local: "Local de Teste"

---

## Padrões Implementados

### 1. **test.step para Organização**

Todos os testes usam `test.step()` para melhor rastreamento e logs:

```typescript
await test.step("Descrição da ação", async () => {
  // Ações específicas
});
```

### 2. **Sem Mocks de API**

- Testes integram com o Directus real
- Usam rotas reais da aplicação
- Validam comportamento end-to-end completo

### 3. **Geração de Dados Dinâmicos**

- Nomes aleatórios para evitar conflitos
- Timestamps para unicidade
- CPFs validados matematicamente

### 4. **Localização Robusta de Elementos**

- Usa `getByRole` para elementos semânticos
- `locator` com padrões flexíveis para inputs
- Fallbacks para diferentes estruturas de componentes

### 5. **Tratamento de Timeouts**

- Aguarda com timeout apropriado
- `.catch()` para elementos opcionais
- `page.waitForTimeout()` estratégico após ações

### 6. **Validação de Sucesso/Falha**

- Verifica toasts/alerts após salvar
- Confere aparecimento na lista
- Valida remoção após delete

---

## Como Executar

### Executar todos os testes:

```bash
npx playwright test
```

### Executar arquivo específico:

```bash
npx playwright test tests/beneficiarias.spec.ts
npx playwright test tests/escola.spec.ts
npx playwright test tests/sala-azul.spec.ts
npx playwright test tests/eventos.spec.ts
```

### Modo debug (visual):

```bash
npx playwright test --debug
```

### Modo headed (com navegador visível):

```bash
npx playwright test --headed
```

### Relatório HTML:

```bash
npx playwright test
npx playwright show-report
```

---

## Pré-requisitos

1. **Servidor rodando**: `http://localhost:3000`
2. **Autenticação**: Setup em `tests/auth.setup.ts` deve estar configurado
3. **Banco de dados**: Directus acessível e sincronizado
4. **Browsers**: Instalados via `npx playwright install`

---

## Notas Importantes

### Sobre Localização de Elementos

Os testes usam estratégias flexíveis pois não temos acesso direto aos seletores específicos:

- Procuram por placeholders, labels, papéis (roles)
- Tentam múltiplos seletores alternativos
- Validam com `.isVisible({ timeout: X })` antes de agir

### Sobre Dados Ópcionais vs Obrigatórios

- **Beneficiárias**: Apenas `nome_completo` é obrigatório
- **Cursos**: `nome`, `area_atuacao`, `carga_horaria` são obrigatórios
- **Turmas**: `nome`, `curso`, `instrutor`, `vagas`, `status` são obrigatórios
- **Infratores**: `nome_completo`, `cpf`, `nivel_id`, `status_legal_id`, `tipos_agressao_ids` são obrigatórios
- **Eventos**: `nome`, `tipo_id`, `data_inicio`, `data_fim` são obrigatórios

### Sobre Desafios Implementados

- ✅ Teste de ciclo com participante implementado com tratamento de fallback
- ✅ CPF validado matematicamente (dígitos verificadores corretos)
- ✅ Timestamps para evitar conflitos entre rodadas
- ✅ Fluxo de pré-requisito (criar curso antes de turma)

---

## Troubleshooting

### Testes falhando por autenticação:

- Verificar `tests/auth.setup.ts` e arquivo de storage state
- Revisar configuração de baseURL no `playwright.config.ts`

### Elementos não encontrados:

- Aumentar timeout: `{ timeout: 15000 }`
- Verificar seletores com Playwright Inspector: `npx playwright test --debug`
- Revisar estrutura HTML atual da página

### Timeout em salvar:

- Aumentar `page.waitForTimeout()`
- Verificar se API está respondendo corretamente

---

## Futuros Melhoramentos

- [ ] Extrair seletores específicos e criar constants
- [ ] Adicionar fixtures para dados de teste compartilhados
- [ ] Implementar retry automático para flakiness
- [ ] Adicionar visual regression testing
- [ ] Crear helpers/utils para ações comuns
- [ ] Adicionar testes de performance
