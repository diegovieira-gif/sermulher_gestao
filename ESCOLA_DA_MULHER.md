# 🎓 Módulo "Escola da Mulher" - Guia de Implementação

## ✅ Status: Implementado

Este documento descreve a estrutura completa do módulo **"Escola da Mulher"** incluindo banco de dados, backend (actions) e frontend (UI).

---

## 📋 Estrutura do Projeto

### 1. **Script de Banco de Dados** (`update-schema-escola.js`)
Localização: Raiz do projeto

Cria a estrutura relacional completa com 3 collections principais:

#### `escola_cursos` (Catálogo)
```
id          → UUID (Primary Key)
nome        → String (obrigatório)
area_atuacao → String (Dropdown: beleza, gastronomia, artesanato, tecnologia, gestao)
carga_horaria → Integer (horas)
ementa      → Text (descrição do curso)
```

#### `escola_turmas` (Oferta)
```
id          → UUID (Primary Key)
nome        → String (ex: "Turma Manhã 01")
curso       → M2O → escola_cursos (obrigatório)
instrutor   → String (nome do professor)
data_inicio → Date
data_fim    → Date
status      → String (Dropdown: aberta, em_andamento, concluida, cancelada)
vagas       → Integer (número de vagas)
```

#### `escola_matriculas` (Vínculo)
```
id              → UUID (Primary Key)
turma           → M2O → escola_turmas (obrigatório)
beneficiaria    → M2O → beneficiarias (obrigatório)
data_matricula  → Timestamp (default: NOW)
status          → String (Dropdown: cursando, aprovada, reprovada, desistente)
```

**Relacionamentos Criados:**
- `escola_turmas.curso` → `escola_cursos` (M2O)
- `escola_matriculas.turma` → `escola_turmas` (M2O)
- `escola_matriculas.beneficiaria` → `beneficiarias` (M2O)

---

### 2. **Backend - Actions** (`src/app/(admin)/escola/actions.ts`)

Funções disponíveis para gerenciar cursos, turmas e matrículas:

#### Para Cursos:
```typescript
getCursos()                          // Busca todos os cursos
saveCurso(data)                      // Cria/atualiza um curso
deleteCurso(id)                      // Deleta um curso
```

#### Para Turmas:
```typescript
getTurmas()                          // Busca todas as turmas com curso relacionado
saveTurma(data)                      // Cria/atualiza uma turma
deleteTurma(id)                      // Deleta uma turma
```

#### Para Matrículas:
```typescript
getMatriculas()                      // Busca todas as matrículas
saveMatricula(data)                  // Cria/atualiza uma matrícula
deleteMatricula(id)                  // Deleta uma matrícula
```

**Todas as funções são Server Actions** (com `"use server"`), o que significa:
- Executam no servidor (seguro)
- Integram com Directus automaticamente
- Revalidam paths quando necessário

---

### 3. **Frontend - Página de Cursos** (`src/app/(admin)/escola/cursos/page.tsx`)

Rota: `/admin/escola/cursos`

**Funcionalidades:**
- ✅ Listar todos os cursos em tabela
- ✅ Criar novo curso via dialog modal
- ✅ Editar curso existente
- ✅ Deletar curso (com confirmação)
- ✅ Validação de formulário com Zod
- ✅ Loading states e toasts de feedback

**Colunas da Tabela:**
| Nome | Área de Atuação | Carga Horária | Ações |
|------|-----------------|---------------|-------|
| (texto) | (badge colorida) | (número)h | Editar / Deletar |

**Formulário de Criação/Edição:**
- Nome (obrigatório, mín 2 caracteres)
- Área de Atuação (dropdown)
- Carga Horária (number)
- Ementa (textarea opcional)

---

### 4. **Atualização do Menu** (`src/components/layout/Sidebar.tsx`)

Novo item adicionado ao menu principal:

```
📚 Escola da Mulher
  ├─ Catálogo de Cursos    → /admin/escola/cursos
  └─ Gestão de Turmas      → /admin/escola/turmas (placeholder)
```

**Ícone:** `BookOpen` (lucide-react)
**Acesso:** Todos os usuários logados

---

## 🚀 Como Executar

### Passo 1: Criar o Schema no Directus

```bash
node update-schema-escola.js
```

**Output esperado:**
```
🚀 Iniciando setup do Schema "Escola da Mulher"...

📚 Criando collection "escola_cursos"...
✅ Collection "escola_cursos" criada com sucesso.
✅ Field 'escola_cursos.nome' criado com sucesso.
...
✅ Relacionamentos criados com sucesso.

🎉 Schema "Escola da Mulher" configurado com sucesso!
```

### Passo 2: Verificar no Directus

1. Acesse o painel Directus em `http://localhost:8055` (ou sua URL)
2. Vá em **Data Model** (engrenagem)
3. Verifique se as 3 collections aparecem:
   - `escola_cursos`
   - `escola_turmas`
   - `escola_matriculas`
4. Clique em cada uma e verifique os fields e relacionamentos

### Passo 3: Testar no Frontend

1. Acesse `/admin/escola/cursos`
2. Clique em "Novo Curso"
3. Preencha o formulário:
   - Nome: "Manicure e Pedicure"
   - Área: "Beleza"
   - Carga Horária: 40
   - Ementa: "Curso de técnicas modernas de manicure..."
4. Clique em "Criar Curso"
5. Você deve ver o curso criado na tabela

---

## 📝 Próximos Passos (TODO)

### 1. **Página de Gestão de Turmas** (`/admin/escola/turmas`)
   - Listar turmas com dropdown do curso
   - Criar/editar/deletar turmas
   - Status visual (aberta/em andamento/concluída)

### 2. **Página de Matrículas** (`/admin/escola/matriculas`)
   - Listar matrículas por turma
   - Matricular novas beneficiárias
   - Rastreamento de status

### 3. **Dashboard da Escola**
   - Estatísticas: Total de cursos, turmas ativas, beneficiárias matriculadas
   - Relatórios por área de atuação
   - Gráficos de ocupação de vagas

### 4. **Notificações & Lembretes**
   - Email de confirmação de matrícula
   - Lembretes de aulas
   - Certificados de conclusão

---

## 🔗 Relacionamentos Visualmente

```
┌─────────────────┐
│ beneficiarias   │
└────────┬────────┘
         │
         │ (1:N)
         │
         ▼
┌─────────────────────────┐      ┌──────────────────┐
│ escola_matriculas       │◄─────┤ escola_turmas    │
│ ├─ turma (M2O) ─────────┼─────►├─ curso (M2O) ───┼────┐
│ ├─ beneficiaria (M2O)   │      │ ├─ nome         │    │
│ ├─ data_matricula       │      │ ├─ instrutor    │    │
│ └─ status               │      │ ├─ data_inicio  │    │
└─────────────────────────┘      │ ├─ data_fim     │    │
                                 │ ├─ status       │    │
                                 │ └─ vagas        │    │
                                 └──────────────────┘    │
                                                         │
                                                         ▼
                                                  ┌──────────────────┐
                                                  │ escola_cursos    │
                                                  ├─ nome            │
                                                  ├─ area_atuacao    │
                                                  ├─ carga_horaria   │
                                                  └─ ementa          │
```

---

## 🛠️ Componentes Utilizados

### UI Components
- `Button` - Botões de ação
- `Dialog` - Modal para criar/editar
- `AlertDialog` - Confirmação de delete
- `Table` - Listagem de dados
- `Form` - Gerenciamento de formulários
- `Input` - Campo de texto
- `Textarea` - Campo multilinhas
- `Select` - Dropdowns
- `Card` - Container de conteúdo
- `Loader2` - Spinner de carregamento

### Bibliotecas
- `react-hook-form` - Gerenciamento de formulários
- `zod` - Validação de schema
- `sonner` - Toasts de notificação
- `lucide-react` - Ícones

---

## 📚 Referências

### Arquivos Criados
1. `update-schema-escola.js` - Script de banco de dados
2. `src/app/(admin)/escola/actions.ts` - Server actions
3. `src/app/(admin)/escola/cursos/page.tsx` - Página de cursos
4. `src/components/layout/Sidebar.tsx` - Atualizado com novo menu

### Arquivos Modificados
- `src/components/layout/Sidebar.tsx` - Adicionado item "Escola da Mulher"

---

## ❓ Dúvidas Comuns

### P: Como adicionar um novo campo na collection?
R: Edite o script `update-schema-escola.js` e adicione a chamada `ensureField()` antes de executar novamente.

### P: Como vincular uma beneficiária a uma matrícula?
R: A beneficiária é vinculada automaticamente ao criar a matrícula via campo `beneficiaria` (M2O).

### P: Posso deletar um curso que tem turmas?
R: Sim, mas configure o `on_delete` no relacionamento para `CASCADE` se desejar deletar turmas também, ou `SET NULL` para desassociar.

---

## 📞 Suporte

Para erros ou dúvidas, verifique:
1. Console do navegador (erros de frontend)
2. Logs do servidor (erros de backend)
3. Painel do Directus (estado do banco de dados)
