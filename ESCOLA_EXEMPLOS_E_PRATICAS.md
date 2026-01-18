# 💡 ESCOLA DA MULHER - Exemplos e Melhores Práticas

## 🎓 Como Usar a API de Cursos

### Exemplo 1: Buscar todos os cursos

**Frontend (Client Component):**
```tsx
"use client";

import { useEffect, useState } from "react";
import { getCursos } from "../actions";

export function CursosList() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCursos = async () => {
      const result = await getCursos();
      if (result.success) {
        setCursos(result.data || []);
      }
      setLoading(false);
    };

    loadCursos();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <ul>
      {cursos.map(curso => (
        <li key={curso.id}>{curso.nome} - {curso.area_atuacao}</li>
      ))}
    </ul>
  );
}
```

---

### Exemplo 2: Criar novo curso

**Frontend (Form Component):**
```tsx
"use client";

import { saveCurso } from "../actions";
import { toast } from "sonner";
import { useState } from "react";

export function NovoForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    
    const resultado = await saveCurso({
      nome: formData.get("nome"),
      area_atuacao: formData.get("area"),
      carga_horaria: parseInt(formData.get("horas")),
      ementa: formData.get("ementa"),
    });

    if (resultado.success) {
      toast.success("Curso criado!");
      // Limpar form...
    } else {
      toast.error(resultado.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="nome" required />
      <select name="area" required>
        <option value="beleza">Beleza</option>
        <option value="gastronomia">Gastronomia</option>
      </select>
      <input name="horas" type="number" />
      <textarea name="ementa" />
      <button disabled={loading}>Criar</button>
    </form>
  );
}
```

---

### Exemplo 3: Editar curso existente

```tsx
const handleEdit = async (cursoId: string) => {
  const resultado = await saveCurso({
    id: cursoId,  // Quando tem ID, atualiza
    nome: "Nome Atualizado",
    area_atuacao: "tecnologia",
    carga_horaria: 50,
  });

  if (resultado.success) {
    toast.success("Curso atualizado!");
  }
};
```

---

### Exemplo 4: Deletar curso

```tsx
const handleDelete = async (cursoId: string) => {
  // Pedir confirmação primeiro
  if (!confirm("Tem certeza?")) return;

  const resultado = await deleteCurso(cursoId);

  if (resultado.success) {
    toast.success("Curso deletado!");
    // Remover da lista...
  } else {
    toast.error(resultado.error);
  }
};
```

---

## 🏫 Exemplos com Turmas e Matrículas

### Exemplo 5: Buscar turmas com dados do curso

```tsx
"use client";

import { useEffect, useState } from "react";
import { getTurmas } from "../actions";

export function TurmasList() {
  const [turmas, setTurmas] = useState([]);

  useEffect(() => {
    const load = async () => {
      const result = await getTurmas();
      // result.data já vem com curso.* expandido
      if (result.success) {
        setTurmas(result.data);
      }
    };
    load();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Turma</th>
          <th>Curso</th>
          <th>Instrutor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {turmas.map(turma => (
          <tr key={turma.id}>
            <td>{turma.nome}</td>
            <td>{turma.curso?.nome}</td>
            <td>{turma.instrutor}</td>
            <td>{turma.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### Exemplo 6: Matricular beneficiária

```tsx
const handleMatricular = async (beneficiaria_id: string, turma_id: string) => {
  const resultado = await saveMatricula({
    turma: turma_id,
    beneficiaria: beneficiaria_id,
    status: "cursando",
    // data_matricula: agora é preenchida automaticamente
  });

  if (resultado.success) {
    toast.success("Beneficiária matriculada!");
  }
};
```

---

### Exemplo 7: Filtrar matrículas por status

```tsx
const handleGetMatriculas = async () => {
  const resultado = await getMatriculas();

  if (resultado.success) {
    const cursando = resultado.data.filter(m => m.status === "cursando");
    const aprovadas = resultado.data.filter(m => m.status === "aprovada");
    const desistentes = resultado.data.filter(m => m.status === "desistente");

    console.log(`Cursando: ${cursando.length}`);
    console.log(`Aprovadas: ${aprovadas.length}`);
    console.log(`Desistentes: ${desistentes.length}`);
  }
};
```

---

## 🎨 Padrões Reutilizáveis

### Padrão 1: Hook Customizado para Cursos

Crie `src/hooks/useCursos.ts`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { getCursos, saveCurso, deleteCurso } from "@/app/(admin)/escola/actions";
import { toast } from "sonner";

export function useCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCursos = async () => {
    setLoading(true);
    const result = await getCursos();
    if (result.success) {
      setCursos(result.data);
    }
    setLoading(false);
  };

  const criar = async (data: any) => {
    const result = await saveCurso(data);
    if (result.success) {
      toast.success("Curso criado!");
      await loadCursos();
    } else {
      toast.error(result.error);
    }
    return result;
  };

  const deletar = async (id: string) => {
    const result = await deleteCurso(id);
    if (result.success) {
      toast.success("Curso deletado!");
      await loadCursos();
    } else {
      toast.error(result.error);
    }
    return result;
  };

  useEffect(() => {
    loadCursos();
  }, []);

  return { cursos, loading, criar, deletar, reload: loadCursos };
}
```

**Uso:**
```tsx
"use client";

import { useCursos } from "@/hooks/useCursos";

export function MeuComponente() {
  const { cursos, loading, criar, deletar } = useCursos();

  return (
    <div>
      {loading ? <span>Carregando...</span> : (
        <button onClick={() => criar({ nome: "Novo", area_atuacao: "beleza" })}>
          Criar
        </button>
      )}
    </div>
  );
}
```

---

### Padrão 2: Context para Estado Compartilhado

Crie `src/contexts/EscolaContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useState } from "react";

type EscolaContextType = {
  selectedCurso: any | null;
  setSelectedCurso: (curso: any) => void;
  selectedTurma: any | null;
  setSelectedTurma: (turma: any) => void;
};

const EscolaContext = createContext<EscolaContextType | null>(null);

export function EscolaProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);

  return (
    <EscolaContext.Provider
      value={{
        selectedCurso,
        setSelectedCurso,
        selectedTurma,
        setSelectedTurma,
      }}
    >
      {children}
    </EscolaContext.Provider>
  );
}

export function useEscola() {
  const context = useContext(EscolaContext);
  if (!context) {
    throw new Error("useEscola deve ser usado dentro de EscolaProvider");
  }
  return context;
}
```

---

### Padrão 3: Componente Reutilizável de CRUD

Crie `src/components/escola/CrudTable.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CrudTableProps {
  title: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
  }>;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onNew: () => void;
}

export function CrudTable({
  title,
  data,
  columns,
  onEdit,
  onDelete,
  onNew,
}: CrudTableProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>{title}</h2>
        <Button onClick={onNew}>Novo</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
              {columns.map(col => (
                <TableCell key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </TableCell>
              ))}
              <TableCell>
                <Button size="sm" onClick={() => onEdit(item)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                  Deletar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Uso:**
```tsx
import { CrudTable } from "@/components/escola/CrudTable";

export function CursosPage() {
  return (
    <CrudTable
      title="Cursos"
      data={cursos}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "area_atuacao", label: "Área" },
        { key: "carga_horaria", label: "Carga Horária" },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
}
```

---

## ⚠️ Melhores Práticas

### 1. Sempre Validar no Frontend

```tsx
// ✅ BOM
const schema = z.object({
  nome: z.string().min(2),
  area: z.enum(["beleza", "gastronomia"]),
});

const resultado = await saveCurso(schema.parse(data));

// ❌ RUIM
const resultado = await saveCurso(data);
```

---

### 2. Usar Server Actions para Operações Sensíveis

```tsx
// ✅ BOM: Operação no servidor (segura)
"use server";
export async function saveCurso(data) {
  // Validar permissões aqui
  // Fazer auditoria aqui
  // Operação segura
}

// ❌ RUIM: Exposição de API insegura
export async function saveCurso(data) {
  const response = await fetch("/api/cursos", { method: "POST", body: data });
  return response.json();
}
```

---

### 3. Revalidar Cache Apropriadamente

```tsx
// ✅ BOM
export async function saveCurso(data) {
  // ... salvar ...
  revalidatePath("/escola/cursos"); // Apenas page necessária
}

// ❌ RUIM
export async function saveCurso(data) {
  // ... salvar ...
  revalidatePath("/"); // Revalida tudo (performance ruim)
}
```

---

### 4. Tratar Erros Apropriadamente

```tsx
// ✅ BOM
try {
  const result = await getCursos();
  if (!result.success) {
    toast.error(result.error || "Erro desconhecido");
    return;
  }
  setCursos(result.data);
} catch (error) {
  toast.error("Erro ao conectar com servidor");
  console.error(error);
}

// ❌ RUIM
const result = await getCursos();
setCursos(result.data); // Pode quebrar se result.data for undefined
```

---

### 5. Loading States

```tsx
// ✅ BOM
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await saveCurso(data);
  } finally {
    setLoading(false); // Sempre resetar, mesmo com erro
  }
};

// ❌ RUIM
const handleSubmit = async () => {
  setLoading(true);
  await saveCurso(data);
  setLoading(false); // Não trata erros
};
```

---

### 6. Type Safety

```tsx
// ✅ BOM: Tipos bem definidos
interface Curso {
  id: string;
  nome: string;
  area_atuacao: "beleza" | "gastronomia" | "artesanato" | "tecnologia" | "gestao";
  carga_horaria?: number;
  ementa?: string;
}

export async function saveCurso(data: Curso) { ... }

// ❌ RUIM: Any type
export async function saveCurso(data: any) { ... }
```

---

### 7. Feedback ao Usuário

```tsx
// ✅ BOM: Múltiplas formas de feedback
toast.success("Curso criado!"); // Notificação
setLoading(false); // Loading state
await reloadCursos(); // Dados atualizados
navigateTo("/"); // Redirecionamento

// ❌ RUIM: Sem feedback
await saveCurso(data);
// Usuário não sabe se funcionou
```

---

## 🧪 Testes

### Teste Manual: Fluxo Completo

1. Criar um curso
2. Editar o curso criado
3. Listar cursos e verificar a mudança
4. Deletar o curso
5. Verificar que foi removido

### Teste com Dados Reais

```typescript
// Mock data para testes
const testCurso = {
  nome: "Teste Curso",
  area_atuacao: "beleza",
  carga_horaria: 30,
  ementa: "Teste ementa",
};

// Executar
const result = await saveCurso(testCurso);

// Verificar
console.assert(result.success, "Salvar deveria suceder");
```

---

## 📚 Recursos Adicionais

- [Server Actions - Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Sonner Toast](https://sonner.emilkowal.ski/)
- [Directus SDK](https://docs.directus.io/reference/sdk/)

---

**Última Atualização:** 18/01/2026
**Status:** 🟢 Pronto para uso
