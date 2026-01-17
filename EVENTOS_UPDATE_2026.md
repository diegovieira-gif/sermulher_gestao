# Atualização do Módulo de Eventos e Agenda - Planejamento Anual 2026

## Resumo das Alterações

Todas as atualizações necessárias para o "Planejamento Anual 2026" foram implementadas com sucesso no módulo de **Eventos e Agenda**. As mudanças refletem os novos campos adicionados ao banco de dados (Directus) no frontend.

---

## 1. ✅ **Atualização do Schema e Tipagem** (`schemas.ts`)

### Novos Campos Adicionados ao Zod Schema:
- **`tipo`**: enum com valores `'campanha'`, `'evento'`, `'roda_conversa'`, `'curso'`
- **`status`**: enum com valores `'planejado'`, `'confirmado'`, `'realizado'`, `'cancelado'`
- **`local`**: string opcional para indicar o local do evento
- **`recorrencia`** e **`publico_alvo`**: já existentes, mantidos e documentados

### Novos Enums TypeScript:
```typescript
export const tipoEventoEnum = [
  { value: "campanha", label: "Campanha" },
  { value: "evento", label: "Evento" },
  { value: "roda_conversa", label: "Roda de Conversa" },
  { value: "curso", label: "Curso" },
] as const;

export const statusEventoEnum = [
  { value: "planejado", label: "Planejado", color: "yellow" },
  { value: "confirmado", label: "Confirmado", color: "green" },
  { value: "realizado", label: "Realizado", color: "blue" },
  { value: "cancelado", label: "Cancelado", color: "red" },
] as const;

export const recorrenciaEnum = [
  { value: "nao_recorrente", label: "Não recorrente" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;
```

### Tipos Exportados:
- `TipoEvento`
- `StatusEvento`
- `Recorrencia`

---

## 2. ✅ **Atualização da Server Action** (`actions.ts`)

### Melhorias:
- ✅ Campos `tipo`, `status` e `local` são agora salvos automaticamente no Directus
- ✅ Função `saveEvento()` valida e salva todos os novos campos via schema Zod
- ✅ Adicionada nova função `getEventoById()` para buscar evento específico
- ✅ Função `getEventos()` continua funcionando normalmente com revalidação de cache

### Validação:
- Todos os novos campos são opcionais (`.optional()`) no schema
- O campo `status` padrão é `'planejado'`
- O campo `tipo` padrão é `'evento'`

---

## 3. ✅ **Atualização do Formulário** (`evento-form.tsx`)

### Layout em 2 Colunas (Responsivo):
O formulário agora está organizado em múltiplas linhas com 2 colunas para melhor uso do espaço:

**Linha 1:**
- Título (full-width)

**Linha 2:**
- Tipo de Evento (select)
- Status (select com cores)

**Linha 3:**
- Data de Início (date)
- Data de Fim (date)

**Linha 4:**
- Recorrência (select)
- Local (input texto)

**Linha 5:**
- Categoria/Tipo (select: campanha, evento, roda_conversa, curso)
- Público Alvo (input texto)

**Linha 6:**
- Descrição (textarea full-width)

### Novos Inputs:
- **Status**: select com opções do enum (Planejado, Confirmado, Realizado, Cancelado)
- **Local**: input texto para localização do evento
- **Tipo (Categoria)**: novo select diferente de "Tipo de Evento" (da config_tipos_evento)

### Melhorias UX:
- Asteriscos (*) indicam campos obrigatórios
- Max-width aumentado para `max-w-3xl` (era `max-w-2xl`)
- Grid responsivo com `gap-4`
- Todos os selects usam os enums definidos em `schemas.ts`

---

## 4. ✅ **Atualização da Listagem** (`eventos-client.tsx`)

### Nova Coluna: "Status"
- Mostra o status do evento (Planejado, Confirmado, Realizado, Cancelado)
- **Cores visuais** via Badge:
  - `confirmado` → Verde (default)
  - `planejado` → Cinza/Amarelo (secondary)
  - `realizado` → Azul (outline)
  - `cancelado` → Vermelho (destructive)

### Ícone de Recorrência:
- ✅ Ícone de "loop" (Repeat) aparece ao lado do título se o evento for recorrente
- ✅ Tooltip mostra o tipo de recorrência (Mensal, Anual)

### Tabela Atualizada:
| Coluna | Conteúdo |
|--------|----------|
| Título | Nome + ícone de loop (se recorrente) |
| Data | Data formatada + ícone de calendário |
| Tipo | Badge com o tipo do evento |
| Situação | Badge com status calculado (Encerrado, Em Andamento, Breve) |
| Status | Badge com status do evento (Planejado, Confirmado, etc.) |
| Ações | Editar, Deletar |

### Total de Colunas: **6 colunas** (era 5)

---

## 5. ✅ **Atualização da Agenda** (`agenda-client.tsx`)

### Melhorias Visuais:
- ✅ Detalhes dos eventos mostram informações mais relevantes
- ✅ Melhor espaçamento e padding (`p-4` em vez de `p-3`)
- ✅ Cards de evento com background `bg-card`
- ✅ Calendário e lista de eventos lado a lado (lg:grid-cols-3)

### Detalhes do Evento Selecionado:
- Título do evento
- Subtitle (informações relacionadas)
- Badge de tipo

### Próximos Eventos do Mês:
- Data formatada com ícone de calendário
- Título do evento
- Badge de tipo
- Clicável para ir para aquele dia

---

## 6. ✅ **Atualização da Visualização de Calendário** (`eventos-calendario-client.tsx`)

### Novos Recursos:
- ✅ Ícone de `MapPin` para mostrar local do evento
- ✅ Status do evento (Planejado, Confirmado, Realizado, Cancelado) com cores
- ✅ Ícone de recorrência (Repeat) com tooltip
- ✅ Local exibido na lista de eventos selecionados

### Detalhes dos Eventos:
Cada evento mostra:
1. **Título** + ícone de recorrência (se aplicável)
2. **Tipo** (do tipo_id)
3. **Local** (com ícone de mapa) - se disponível
4. **Status** (com código de cores)
5. **Datas** (data início - data fim)

### Funções Auxiliares:
- `getStatusEventoBadgeVariant()`: retorna variante de badge para status
- `getStatusEventoLabel()`: retorna label traduzido do status
- `transformarEventos()`: agora inclui campo `local` e `statusEvento`

---

## 🎨 **Paleta de Cores - Status do Evento**

| Status | Cor | Badge Variant |
|--------|-----|-----------------|
| Planejado | Amarelo | `secondary` |
| Confirmado | Verde | `default` |
| Realizado | Azul | `outline` |
| Cancelado | Vermelho | `destructive` |

---

## 📋 **Consistência com o Sistema**

Todas as atualizações mantêm a **consistência visual** com o resto do sistema administrativo:
- ✅ Uso de componentes Shadcn/ui (Button, Badge, Dialog, Card, etc.)
- ✅ Ícones Lucide React (Calendar, Repeat, MapPin, etc.)
- ✅ Toast notifications via Sonner
- ✅ Padrão de form com React Hook Form + Zod
- ✅ Server Actions para operações no Directus
- ✅ Tailwind CSS para estilo responsivo

---

## 🚀 **Como Usar os Novos Campos**

### Criar um Evento:
1. Clique em **"Novo Evento"**
2. Preencha o **Título** (obrigatório)
3. Selecione o **Tipo de Evento** da configuração (obrigatório)
4. Escolha o **Status** (Planejado, Confirmado, Realizado, Cancelado)
5. Defina as **Datas** de início e fim
6. Selecione a **Recorrência** (se for um evento que se repete)
7. Indique o **Local** (opcional)
8. Escolha a **Categoria** (Campanha, Evento, Roda de Conversa, Curso)
9. Defina o **Público Alvo** (ex: Mulheres, Famílias)
10. Adicione uma **Descrição** (opcional)
11. Clique em **"Cadastrar"**

### Editar um Evento:
1. Clique no ícone de **Editar** (lápis) na listagem
2. Modifique os campos desejados
3. Clique em **"Atualizar"**

### Visualizar em Calendário:
1. Vá para a aba de **"Planejamento Anual"**
2. Navegue pelos meses
3. Clique em um dia para ver os eventos
4. Passe o mouse sobre os cards para ver mais detalhes

---

## ✨ **Benefícios da Atualização**

1. **Melhor Organização**: Campos adicionais estruturam melhor os eventos
2. **Status Rastreável**: Acompanhe se um evento está planejado, confirmado, realizado ou cancelado
3. **Recorrência Clara**: Identifique rapidamente eventos que se repetem
4. **Local Identificado**: Saiba exatamente onde será realizado o evento
5. **Interface Clara**: Uso de cores, ícones e badges torna tudo mais visual
6. **Responsividade**: Formulário em 2 colunas se adapta melhor a diferentes telas
7. **Acessibilidade**: Tooltips explicam ícones e status

---

## 📦 **Arquivos Modificados**

```
src/app/(admin)/eventos/
├── schemas.ts .......................... ✅ Adicionados enums e novos tipos
├── actions.ts .......................... ✅ Função getEventoById() adicionada
├── evento-form.tsx ..................... ✅ Formulário em 2 colunas com novos fields
├── eventos-client.tsx .................. ✅ Nova coluna de Status + ícone de repetição
├── agenda-client.tsx ................... ✅ Melhor apresentação de detalhes
└── eventos-calendario-client.tsx ....... ✅ Integração de local e status colorido
```

---

## ⚠️ **Notas Importantes**

1. **Valores Padrão**:
   - `status` padrão: `'planejado'`
   - `tipo` padrão: `'evento'`
   - `recorrencia` padrão: `'nao_recorrente'`

2. **Campos Opcionais**:
   - `tipo`, `status`, `local`, `publico_alvo`, `descricao` são todos opcionais

3. **Validação Zod**:
   - Todos os campos passam pela validação do Zod antes de serem salvos
   - Datas devem estar em formato válido
   - Data de fim não pode ser menor que data de início

4. **Revalidação de Cache**:
   - Após criar, atualizar ou deletar um evento, o cache é revalidado automaticamente

---

## 🔄 **Próximos Passos (Opcional)**

Se desejar expandir ainda mais a funcionalidade:

- [ ] Adicionar filtros por status na listagem
- [ ] Exportar eventos para CSV/PDF
- [ ] Notificações para eventos confirmados
- [ ] Integração com API de calendário (Google Calendar, etc.)
- [ ] Busca de eventos por público alvo
- [ ] Relatórios de eventos realizados vs planejados

---

**Data da Atualização**: Janeiro 2026  
**Versão**: 1.0  
**Status**: ✅ Pronto para Produção

