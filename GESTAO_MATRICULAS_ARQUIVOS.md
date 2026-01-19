# 📁 Estrutura de Arquivos - Gestão de Matrículas

## Arquivos Modificados e Criados

```
src/app/(admin)/escola/
├── actions.ts                          [✏️ MODIFICADO]
│   ├── saveTurma() [existente]
│   ├── deleteTurma() [existente]
│   ├── getTurmaById() [✨ NOVO]
│   ├── getMatriculasByTurma() [✨ NOVO]
│   ├── getBeneficiariasOptions() [✨ NOVO]
│   ├── saveMatricula() [✨ NOVO]
│   └── deleteMatricula() [✨ NOVO]
│
├── turmas/
│   ├── page.tsx [existente - listagem]
│   ├── turmas-client.tsx               [✏️ MODIFICADO]
│   │   └── + Coluna "Detalhes" com Eye icon
│   │
│   └── [id]/
│       ├── page.tsx                    [✨ NOVO]
│       │   └── Server component - Carrega dados
│       │
│       └── turma-detalhes-client.tsx   [✨ NOVO]
│           ├── Header (Turma info)
│           ├── Table (Matrículas)
│           ├── Dialog (Nova matrícula)
│           └── Alert (Deletar)
```

---

## Detalhes dos Arquivos

### 1️⃣ `src/app/(admin)/escola/actions.ts` (MODIFICADO)

**Funções Adicionadas:**

```typescript
// Nova seção: Gestão de Matrículas (escola_matriculas)
// ================================================

export type Matricula = { ... }

export async function getTurmaById(id: number) { ... }
export async function getMatriculasByTurma(turmaId: number) { ... }
export async function getBeneficiariasOptions() { ... }
export async function saveMatricula(turmaId: number, beneficiariaId: number) { ... }
export async function deleteMatricula(id: number) { ... }
```

**Linhas:** 203-390 (187 linhas adicionadas)

---

### 2️⃣ `src/app/(admin)/escola/turmas/turmas-client.tsx` (MODIFICADO)

**Mudanças:**

```typescript
// Import adicionado
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// Hook adicionado
const router = useRouter();

// Nova coluna na tabela
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

**Linhas:** 1-10 (imports + router hook)

---

### 3️⃣ `src/app/(admin)/escola/turmas/[id]/page.tsx` (NOVO)

**Arquivo:** Componente Server de detalhes da turma

```typescript
// Props
interface TurmaDetalhesPageProps {
  params: { id: string }
}

// Dados carregados em paralelo
getTurmaById(turmaId)
getMatriculasByTurma(turmaId)
getBeneficiariasOptions()

// Renderiza
<TurmaDetalhesClient turma={} matriculas={} beneficiarias={} />
```

**Tamanho:** 44 linhas

---

### 4️⃣ `src/app/(admin)/escola/turmas/[id]/turma-detalhes-client.tsx` (NOVO)

**Arquivo:** Componente Client com toda a interatividade

**Estrutura:**

```typescript
// Props e Tipos
interface TurmaDetalhesClientProps { ... }
const STATUS_LABEL: Record<string, string> = { ... }
const STATUS_COLOR: Record<string, string> = { ... }
const MATRICULA_STATUS_LABEL: Record<string, string> = { ... }
const MATRICULA_STATUS_COLOR: Record<string, string> = { ... }

// Funções utilitárias
function formatCPF(cpf?: string) { ... }
function formatDate(date?: string) { ... }

// Componente
export function TurmaDetalhesClient({ turma, matriculas, beneficiarias }) {
  // Estado
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<number>()
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [matriculaToDelete, setMatriculaToDelete] = useState<number | null>()
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentMatriculas, setCurrentMatriculas] = useState<Matricula[]>()

  // Handlers
  async function handleAddMatricula() { ... }
  async function handleDeleteMatricula() { ... }

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Tabela de Alunas */}
      {/* Dialog: Nova Matrícula */}
      {/* Dialog: Confirmar Exclusão */}
    </div>
  )
}
```

**Tamanho:** 343 linhas

---

## 📊 Resumo de Mudanças

| Arquivo | Tipo | Linhas | Descrição |
|---------|------|--------|-----------|
| `actions.ts` | Modificado | +187 | Funções de matrícula |
| `turmas-client.tsx` | Modificado | +4 | Coluna de detalhes |
| `[id]/page.tsx` | Novo | 44 | Server component |
| `[id]/turma-detalhes-client.tsx` | Novo | 343 | Client component |
| **TOTAL** | - | **+578 linhas** | - |

---

## 🔄 Fluxo de Importações

```
page.tsx (Server)
  ├── getTurmaById (from actions.ts)
  ├── getMatriculasByTurma (from actions.ts)
  ├── getBeneficiariasOptions (from actions.ts)
  └── TurmaDetalhesClient (from turma-detalhes-client.tsx)

turma-detalhes-client.tsx (Client)
  ├── BeneficiariaComboBox (from @/app/(admin)/mulheres/...)
  ├── saveMatricula (from ../../actions.ts)
  ├── deleteMatricula (from ../../actions.ts)
  ├── Button, Badge, Table, Dialog (from @/components/ui/)
  ├── toast (from sonner)
  └── Icons: Eye, Plus, Trash2, Loader2, ArrowLeft (from lucide-react)

turmas-client.tsx (Client)
  └── router.push() (from next/navigation)
```

---

## 🗂️ Hierarquia de Pastas

```
src/app/(admin)/
└── escola/
    ├── cursos/                         [Existente]
    │   └── page.tsx
    │
    ├── turmas/                         [Existente + Novo]
    │   ├── page.tsx                    [Existente]
    │   ├── turmas-client.tsx           [✏️ Modificado]
    │   │
    │   └── [id]/                       [✨ NOVO]
    │       ├── page.tsx                [✨ NOVO]
    │       └── turma-detalhes-client.tsx [✨ NOVO]
    │
    └── actions.ts                      [✏️ Modificado]
```

---

## 🎯 Routing

```
/admin/escola/turmas              → page.tsx (Listagem)
    ↓ [clica olho]
/admin/escola/turmas/1            → [id]/page.tsx (Detalhes)
    ↓ [clica nova matrícula]
[Dialog abre]
    ↓ [confirma]
[POST /api/...] → saveMatricula()
    ↓ [sucesso]
[Tabela atualiza]
```

---

## 📚 Documentação Relacionada

- `GESTAO_MATRICULAS_IMPLEMENTACAO.md` - Documentação completa
- `GESTAO_MATRICULAS_TESTES.md` - Guia de testes

---

## ✅ Checklist de Integração

- [x] Backend (actions.ts) - 5 novas funções
- [x] Frontend (page.tsx) - Server component
- [x] Frontend (turma-detalhes-client.tsx) - Client component
- [x] Integração (turmas-client.tsx) - Coluna de navegação
- [x] Validações - Backend e Frontend
- [x] Formatações - CPF, Data, Telefone
- [x] Estados - Loading, Dialogs, Toasts
- [x] Tipos - TypeScript completo
- [x] Documentação - Implementação + Testes
- [x] Estrutura - Organização de pastas

