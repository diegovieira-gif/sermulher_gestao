# 📋 Exemplos de Dados - Módulo de Eventos 2026

## Como Testar os Novos Campos

### Exemplo 1: Evento Planejado - Roda de Conversa

```json
{
  "nome": "Roda de Conversa sobre Saúde Mental",
  "tipo_id": 1,
  "data_inicio": "2026-02-14",
  "data_fim": "2026-02-14",
  "descricao": "Espaço de compartilhamento e reflexão sobre saúde mental das mulheres.",
  "recorrencia": "mensal",
  "publico_alvo": "Mulheres atendidas pelo programa",
  "tipo": "roda_conversa",
  "status": "planejado",
  "local": "Centro de Referência da Mulher - Sala Azul"
}
```

**Resultado Visual:**
- ✅ Ícone de repetição (Mensal)
- 📍 Local exibido
- 🟡 Status: Planejado (amarelo)
- 📅 Situação: Breve (até a data)

---

### Exemplo 2: Campanha Confirmada - Recorrente

```json
{
  "nome": "Campanha de Combate à Violência Doméstica",
  "tipo_id": 2,
  "data_inicio": "2026-01-25",
  "data_fim": "2026-03-25",
  "descricao": "Campanha anual de conscientização sobre direitos e redes de proteção.",
  "recorrencia": "anual",
  "publico_alvo": "Comunidade em geral, com foco em mulheres",
  "tipo": "campanha",
  "status": "confirmado",
  "local": "Rua Principal, Centro - Espaço Público"
}
```

**Resultado Visual:**
- ✅ Ícone de repetição (Anual)
- 📍 Local exibido
- 🟢 Status: Confirmado (verde)
- 📅 Situação: Em Andamento (entre as datas)

---

### Exemplo 3: Curso Realizado - Sem Recorrência

```json
{
  "nome": "Curso de Empreendedorismo para Mulheres",
  "tipo_id": 3,
  "data_inicio": "2025-11-01",
  "data_fim": "2025-12-20",
  "descricao": "Curso prático sobre como iniciar e gerenciar um negócio próprio.",
  "recorrencia": "nao_recorrente",
  "publico_alvo": "Mulheres em situação de vulnerabilidade social",
  "tipo": "curso",
  "status": "realizado",
  "local": "Auditório do CRAS"
}
```

**Resultado Visual:**
- ❌ Sem ícone de repetição
- 📍 Local exibido
- 🔵 Status: Realizado (azul)
- 📅 Situação: Encerrado (data passada)

---

### Exemplo 4: Evento Cancelado

```json
{
  "nome": "Encontro de Lideranças Femininas",
  "tipo_id": 4,
  "data_inicio": "2026-02-28",
  "data_fim": "2026-02-28",
  "descricao": "Encontro que foi cancelado por motivos operacionais.",
  "recorrencia": "nao_recorrente",
  "publico_alvo": "Lideranças femininas da região",
  "tipo": "evento",
  "status": "cancelado",
  "local": "Hotel Central"
}
```

**Resultado Visual:**
- ❌ Sem ícone de repetição
- 📍 Local exibido
- 🔴 Status: Cancelado (vermelho)
- 📅 Situação: Breve (data futura, mas cancelado)

---

### Exemplo 5: Evento Sem Local (Opcional)

```json
{
  "nome": "Live sobre Direitos Reprodutivos",
  "tipo_id": 5,
  "data_inicio": "2026-03-08",
  "data_fim": "2026-03-08",
  "descricao": "Transmissão ao vivo via plataforma digital.",
  "recorrencia": "nao_recorrente",
  "publico_alvo": "Mulheres interessadas em saúde reprodutiva",
  "tipo": "evento",
  "status": "confirmado",
  "local": null
}
```

**Resultado Visual:**
- ❌ Sem local (campo não exibido)
- 🟢 Status: Confirmado (verde)
- 📅 Situação: Breve

---

## Fluxos de Teste Recomendados

### Teste 1: Criar Novo Evento
1. Clique em "Novo Evento"
2. Preencha todos os campos (incluindo os novos)
3. Selecione "Planejado" como Status
4. Selecione "Mensal" como Recorrência
5. Clique em "Cadastrar"
6. ✅ Verificar que o ícone de repetição aparece na listagem

### Teste 2: Editar Evento
1. Clique no ícone de editar de um evento
2. Altere o Status para "Confirmado"
3. Altere a Recorrência para "Não recorrente"
4. Remova o local
5. Clique em "Atualizar"
6. ✅ Verificar que as mudanças foram aplicadas

### Teste 3: Visualizar em Calendário
1. Vá para "Planejamento Anual"
2. Navegue para um mês com eventos
3. Clique em um dia com evento
4. ✅ Verificar que:
   - Ícone de local aparece (se houver)
   - Status é exibido com cor correta
   - Ícone de repetição aparece (se aplicável)

### Teste 4: Deletar Evento
1. Clique no ícone de deletar
2. Confirme a exclusão
3. ✅ Verificar que o evento foi removido

### Teste 5: Filtrar por Status
1. Na listagem de eventos
2. Procure por eventos com Status = "Confirmado"
3. ✅ Todos devem mostrar badge verde

### Teste 6: Eventos Recorrentes
1. Crie um evento com Recorrência = "Anual"
2. ✅ Verificar que o ícone de repetição aparece
3. ✅ Passar mouse sobre o ícone para ver o tooltip

---

## Dados SQL para Popular o Banco (Exemplo Directus)

Se precisar popular o banco manualmente (via Directus UI ou SQL):

```sql
-- Inserir eventos de exemplo
INSERT INTO eventos_campanhas (
  nome,
  tipo_id,
  data_inicio,
  data_fim,
  descricao,
  recorrencia,
  publico_alvo,
  tipo,
  status,
  local
) VALUES
(
  'Roda de Conversa sobre Saúde Mental',
  1,
  '2026-02-14',
  '2026-02-14',
  'Espaço de compartilhamento e reflexão sobre saúde mental das mulheres.',
  'mensal',
  'Mulheres atendidas pelo programa',
  'roda_conversa',
  'planejado',
  'Centro de Referência da Mulher - Sala Azul'
),
(
  'Campanha de Combate à Violência Doméstica',
  2,
  '2026-01-25',
  '2026-03-25',
  'Campanha anual de conscientização sobre direitos e redes de proteção.',
  'anual',
  'Comunidade em geral, com foco em mulheres',
  'campanha',
  'confirmado',
  'Rua Principal, Centro - Espaço Público'
),
(
  'Curso de Empreendedorismo para Mulheres',
  3,
  '2025-11-01',
  '2025-12-20',
  'Curso prático sobre como iniciar e gerenciar um negócio próprio.',
  'nao_recorrente',
  'Mulheres em situação de vulnerabilidade social',
  'curso',
  'realizado',
  'Auditório do CRAS'
);
```

---

## Testes de Validação (ZodError)

### Teste: Data de Fim Menor que Data de Início
```json
{
  "nome": "Evento Teste",
  "tipo_id": 1,
  "data_inicio": "2026-03-01",
  "data_fim": "2026-02-01",  // ❌ Erro
  "recorrencia": "nao_recorrente",
  "tipo": "evento",
  "status": "planejado"
}
```

**Erro Esperado**: "Data de fim não pode ser menor que a data de início"

### Teste: Título Muito Curto
```json
{
  "nome": "AB",  // ❌ Menos de 3 caracteres
  "tipo_id": 1,
  "data_inicio": "2026-03-01",
  "data_fim": "2026-03-02",
  "recorrencia": "nao_recorrente",
  "tipo": "evento",
  "status": "planejado"
}
```

**Erro Esperado**: "Nome deve ter no mínimo 3 caracteres"

### Teste: Tipo de Evento Inválido
```json
{
  "nome": "Evento Teste",
  "tipo_id": 999,  // ❌ ID que não existe
  "data_inicio": "2026-03-01",
  "data_fim": "2026-03-02",
  "tipo": "tipo_invalido"  // ❌ Não está no enum
}
```

**Erro Esperado**: Erro de validação Zod sobre o enum

---

## Estados de Carregamento

### Durante Envio do Formulário
- Botão fica desabilitado
- Ícone de loading (Loader2) aparece
- Texto muda para "Atualizar" ou "Cadastrar" (com loading)

### Durante Deleção
- Botão fica desabilitado
- Texto muda para "Excluindo..."
- AlertDialog fica aberto até confirmar

---

## Mensagens de Feedback

### Sucesso
```
"Evento cadastrado com sucesso!" (toast verde)
"Evento atualizado com sucesso!" (toast verde)
"Evento excluído com sucesso!" (toast verde)
```

### Erro
```
"Dados inválidos. Verifique os campos e tente novamente." (toast vermelho)
"Erro ao salvar evento. Tente novamente." (toast vermelho)
"Erro ao excluir evento. Tente novamente." (toast vermelho)
```

---

## Resumo de Testes

| Funcionalidade | Teste | Status |
|---|---|---|
| Criar evento | Formulário completo | ✅ |
| Editar evento | Modificar campos | ✅ |
| Deletar evento | Confirmar exclusão | ✅ |
| Status colorido | 4 cores diferentes | ✅ |
| Ícone repetição | Mensal/Anual | ✅ |
| Local opcional | Com e sem local | ✅ |
| Validação datas | Fim >= Início | ✅ |
| Calendário | Navegação e seleção | ✅ |
| Responsividade | Mobile, tablet, desktop | ✅ |
| Toast feedback | Sucesso/Erro | ✅ |

---

**Última Atualização**: Janeiro 2026  
**Versão**: 1.0  
**Ambiente**: Desenvolvimento e Produção

