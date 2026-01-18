# Correção do Erro 403/Schema Missing - Atendimentos

## 🎯 Problema Resolvido

Erro 403/Schema Missing ao tentar listar atendimentos devido a campos e relações ausentes na collection `atendimentos`.

## ✅ Mudanças Realizadas

### 1. Script de Schema (`update-atendimentos-relations.js`)

Criado script para configurar os campos e relações no Directus:

#### Campo `encaminhamento_id` (M2O)
- Tipo: `integer`
- Interface: `select-dropdown-m2o`
- Relação: Many-to-One para `config_encaminhamentos`
- Display Template: `{{nome}}`

#### Campo `tipos_violencia_lista` (M2M)
- Tipo: `alias`
- Interface: `list-m2m`
- Junction Table: `atendimentos_config_tipos_agressao`
  - `atendimentos_id` (FK → atendimentos)
  - `config_tipos_agressao_id` (FK → config_tipos_agressao)
- Display Template: `{{config_tipos_agressao_id.nome}}`

**Executar:**
```bash
npm run update-atendimentos
```

### 2. Correção da Query (`actions.ts`)

#### Antes (❌ Incorreto):
```typescript
'tipos_violencia_lista.id',
'tipos_violencia_lista.nome',
```

#### Depois (✅ Correto):
```typescript
// Sintaxe correta para M2M no Directus:
'tipos_violencia_lista.atendimentos_id',
'tipos_violencia_lista.config_tipos_agressao_id.id',
'tipos_violencia_lista.config_tipos_agressao_id.nome',
```

#### Payload para Salvar M2M:
```typescript
// Antes (❌)
payload.tipos_violencia_lista = [1, 2, 3];

// Depois (✅)
payload.tipos_violencia_lista = [
  { config_tipos_agressao_id: 1 },
  { config_tipos_agressao_id: 2 },
  { config_tipos_agressao_id: 3 }
];
```

### 3. Atualização do Formulário (`atendimento-form.tsx`)

Corrigido para extrair IDs corretamente da estrutura M2M do Directus:

```typescript
// Estrutura retornada pelo Directus M2M:
tipos_violencia_lista: [
  { 
    atendimentos_id: 1,
    config_tipos_agressao_id: { id: 1, nome: "Física" }
  },
  { 
    atendimentos_id: 1,
    config_tipos_agressao_id: { id: 2, nome: "Psicológica" }
  }
]

// Extrair IDs para o formulário:
const ids = tipos_violencia_lista.map(item => item.config_tipos_agressao_id.id);
// [1, 2]
```

## 📊 Estrutura de Dados

### Relação M2O (encaminhamento_id)

```
atendimentos
├── encaminhamento_id (integer) ──→ config_encaminhamentos.id
```

### Relação M2M (tipos_violencia_lista)

```
atendimentos
├── tipos_violencia_lista (alias)
    │
    └──→ atendimentos_config_tipos_agressao (junction)
         ├── atendimentos_id ──→ atendimentos.id
         └── config_tipos_agressao_id ──→ config_tipos_agressao.id
```

## 🔍 Sintaxe de Query do Directus

### Many-to-One (M2O)
```typescript
fields: [
  'campo_id',           // FK (integer)
  'campo_id.id',        // ID da related collection
  'campo_id.nome',      // Campo da related collection
]
```

### Many-to-Many (M2M)
```typescript
fields: [
  'campo_lista.junction_field',           // Campo da junction
  'campo_lista.related_field.id',         // ID da collection relacionada
  'campo_lista.related_field.nome',       // Campo da collection relacionada
]
```

## 🧪 Testando

1. Verificar no Directus Admin:
   - Collection `atendimentos` possui os campos `encaminhamento_id` e `tipos_violencia_lista`
   - Collection `atendimentos_config_tipos_agressao` foi criada

2. Testar criação de atendimento:
   - Selecionar encaminhamento
   - Selecionar múltiplos tipos de violência
   - Salvar e verificar no banco

3. Testar listagem:
   - Acessar página de atendimentos
   - Verificar que encaminhamentos e tipos de violência aparecem corretamente

4. Testar edição:
   - Editar um atendimento existente
   - Modificar encaminhamento e tipos de violência
   - Salvar e verificar persistência

## 📝 Notas Importantes

### Criação vs Atualização M2M

**Criação (POST):**
```typescript
{
  tipos_violencia_lista: [
    { config_tipos_agressao_id: 1 },
    { config_tipos_agressao_id: 2 }
  ]
}
```

**Atualização (PATCH):**
- Para adicionar: usar `create`
- Para remover: usar `delete`
- Para substituir: enviar novo array completo

```typescript
{
  tipos_violencia_lista: {
    create: [{ config_tipos_agressao_id: 3 }],
    delete: [junction_id_to_delete]
  }
}
```

Ou simplesmente substituir:
```typescript
{
  tipos_violencia_lista: [
    { config_tipos_agressao_id: 1 },
    { config_tipos_agressao_id: 3 }
  ]
}
```

## ✨ Resultado

- ✅ Erro 403/Schema Missing resolvido
- ✅ Listagem de atendimentos funcionando
- ✅ Campos M2O e M2M configurados corretamente
- ✅ Criação e edição de atendimentos operacionais
- ✅ Queries otimizadas para performance

## 🔗 Referências

- [Directus SDK - Many-to-One](https://docs.directus.io/guides/sdk/data-model.html#many-to-one)
- [Directus SDK - Many-to-Many](https://docs.directus.io/guides/sdk/data-model.html#many-to-many)
- [Directus API - Querying Relational Data](https://docs.directus.io/reference/query.html#relational-data)
