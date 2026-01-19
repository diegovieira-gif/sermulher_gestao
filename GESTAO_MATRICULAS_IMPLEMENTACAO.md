# 📚 Gestão de Matrículas - Implementação Completa

## ✅ Resumo do que foi implementado

Implementação completa do módulo de **Gestão de Matrículas** na plataforma Escola da Mulher, permitindo gerenciar alunas matriculadas em turmas específicas.

---

## 🔧 1. Backend - Funções em `src/app/(admin)/escola/actions.ts`

### Funções adicionadas:

#### `getTurmaById(id: number)`
- **Descrição:** Busca os dados de uma turma específica com informações do curso relacionado
- **Retorno:** `{ success, data: Turma & { curso: Curso } }`
- **Campos:** `*` e `curso.*` (join com curso)

#### `getMatriculasByTurma(turmaId: number)`
- **Descrição:** Busca todas as matrículas de uma turma com dados da beneficiária
- **Retorno:** `{ success, data: Matricula[] }`
- **Campos:** id, turma, data_matricula, status, beneficiaria.id, nome_completo, cpf, telefone
- **Ordenação:** Por nome da beneficiária (alfabética)

#### `getBeneficiariasOptions()`
- **Descrição:** Busca todas as beneficiárias disponíveis para seleção no combobox
- **Retorno:** `{ success, data: { id, nome_completo, cpf }[] }`
- **Uso:** Alimenta o BeneficiariaComboBox na página de detalhes

#### `saveMatricula(turmaId: number, beneficiariaId: number)`
- **Descrição:** Cria uma nova matrícula verificando duplicação
- **Validações:**
  - Verifica se a beneficiária já possui matrícula **ativa** nessa turma
  - Previne duplicação de registros
- **Retorno:** `{ success, error? }`
- **Campos criados:** turma, beneficiaria, data_matricula (NOW), status: "ativa"

#### `deleteMatricula(id: number)`
- **Descrição:** Remove uma matrícula da turma
- **Retorno:** `{ success, error? }`
- **Revalidação:** Cache invalidado após deleção

### Type Exports:

```typescript
export type Matricula = {
  id: number;
  turma: number;
  beneficiaria: {
    id: number;
    nome_completo: string;
    cpf: string;
    telefone: string;
  };
  data_matricula: string;
  status: string;
};
```

---

## 📄 2. Frontend - Página de Detalhes `src/app/(admin)/escola/turmas/[id]/page.tsx`

### Estrutura:

```
Turma Details Page (Server Component)
├── Busca turma (getTurmaById)
├── Busca matrículas (getMatriculasByTurma)
├── Busca beneficiárias (getBeneficiariasOptions)
└── Renderiza TurmaDetalhesClient
```

### Features:

✅ **Error Handling:** Se turma não existe, exibe mensagem de erro com link para voltar
✅ **Parallel Loading:** Busca turma, matrículas e beneficiárias simultaneamente
✅ **Type-Safe:** Uso de tipos TypeScript para todas as props

---

## 🎨 3. Frontend - Componente Cliente `src/app/(admin)/escola/turmas/[id]/turma-detalhes-client.tsx`

### Seções:

#### Header
- Nome da Turma (com botão voltar)
- Curso (nome do curso relacionado)
- Instrutor
- Status (Badge com cores codificadas)
- Vagas

#### Lista de Alunas Matriculadas
- Tabela com colunas:
  - **Nome:** nome_completo da beneficiária
  - **CPF:** formatado (XXX.XXX.XXX-XX)
  - **Data Matrícula:** formatado em pt-BR (DD/MM/YYYY)
  - **Telefone:** da beneficiária
  - **Status:** Badge (Ativa, Concluída, Cancelada)
  - **Ações:** Botão de deletar (ícone Trash2)

#### Botão "Nova Matrícula"
- Abre Dialog para adicionar beneficiária
- Usa `BeneficiariaComboBox` para seleção
- Busca/filtro por nome ou CPF
- Confirma matrícula com validações do backend

#### Dialog: Adicionar Matrícula
- Campo: BeneficiariaComboBox
- Botões: Cancelar, Confirmar Matrícula
- Estados: Loading durante requisição
- Feedback: Toast de sucesso/erro

#### Dialog: Confirmar Exclusão
- Alerta antes de remover matrícula
- Estados: Loading durante deleção
- Feedback: Toast de sucesso/erro

### Formatações:

```typescript
// CPF: 123.456.789-10
// Data: 25/01/2026
// Status: "ativa" → "Ativa" (com badge verde)
```

### Estado Local:

```typescript
- selectedBeneficiaria: number | undefined
- isLoading: boolean (add matrícula)
- isDeleting: boolean (delete matrícula)
- currentMatriculas: Matricula[] (lista local)
- dialogOpen, deleteDialogOpen: boolean
```

### Handlers:

```typescript
handleAddMatricula()   // POST nova matrícula
handleDeleteMatricula() // DELETE matrícula
```

---

## 🔗 4. Integração na Listagem `src/app/(admin)/escola/turmas/turmas-client.tsx`

### Mudanças:

#### Import adicionado:
```typescript
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
```

#### Hook adicionado:
```typescript
const router = useRouter();
```

#### Nova coluna na tabela:
```typescript
{
  key: "detalhes",
  label: "Detalhes",
  render: (item) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.push(`/admin/escola/turmas/${item.id}`)}
      title="Ver detalhes e gerenciar matrículas"
    >
      <Eye className="h-4 w-4" />
    </Button>
  ),
}
```

### UX:
- Botão com ícone Eye (olho)
- Redireciona para `/admin/escola/turmas/{id}`
- Tooltip: "Ver detalhes e gerenciar matrículas"

---

## 📊 Fluxo de Dados

```
Listagem de Turmas
        ↓
    [Clica olho]
        ↓
Página Detalhes [id]
        ↓
    ┌───────────────────────────────────┐
    │ Server-side (Next.js)             │
    ├───────────────────────────────────┤
    │ getTurmaById(id)                  │
    │ getMatriculasByTurma(id)          │
    │ getBeneficiariasOptions()         │
    └───────────────────────────────────┘
        ↓
TurmaDetalhesClient
    ├─ Header (Turma info)
    ├─ Table (Matrículas)
    ├─ Dialog (Nova matrícula)
    │   └─ saveMatricula()
    └─ Alert (Deletar matrícula)
        └─ deleteMatricula()
```

---

## 🔐 Validações

### Backend:
✅ Verifica matrícula duplicada (beneficiária já matriculada na turma)
✅ Tipo-segurança com Zod (quando aplicável)
✅ Tratamento de erros com try/catch
✅ Revalidação de cache

### Frontend:
✅ Verifica seleção de beneficiária antes de confirmar
✅ Estados de loading para feedback visual
✅ Confirmação de deleção (AlertDialog)
✅ Toast de sucesso/erro em todas as ações

---

## 🎯 Recursos Utilizados

### Backend:
- `directus.request()` com `readItems`, `createItem`, `deleteItem`
- Filtros aninhados (_and, _eq)
- Joins de relacionamentos (*.*)
- Revalidação de path com `revalidatePath()`

### Frontend:
- React Hooks: useState, useRouter
- Componentes UI: Badge, Button, Table, Dialog, AlertDialog
- BeneficiariaComboBox (reutilizável)
- Ícones: Eye, Plus, Trash2, Loader2, ArrowLeft (lucide-react)
- Toast notifications (sonner)

---

## 🚀 Como Usar

### 1. Acessar a lista de turmas:
```
/admin/escola/turmas
```

### 2. Clicar no ícone olho (Eye) na coluna "Detalhes":
Navega para a página de detalhes da turma

### 3. Na página de detalhes:
- Ver informações da turma no header
- Visualizar alunas matriculadas na tabela
- Clicar "Nova Matrícula" para adicionar aluna
- Remover matrícula clicando no ícone Trash2

---

## 📝 Notes

- A data de matrícula é preenchida automaticamente com a data/hora atual (NOW)
- Status padrão de matrícula é "ativa"
- CPF é formatado automaticamente (XXX.XXX.XXX-XX)
- Datas são formatadas em pt-BR
- Telefone pode estar vazio (exibe "—" se não preenchido)
- BeneficiariaComboBox reutiliza a lógica de busca existente

---

## ✨ Próximos Passos Opcionais

- Adicionar filtros na tabela (por status de matrícula, data)
- Exportar lista de alunas (PDF/CSV)
- Bulk actions (matricular múltiplas alunas)
- Histórico de matrículas (canceladas, concluídas)
- Gráficos de taxa de matrícula por turma
