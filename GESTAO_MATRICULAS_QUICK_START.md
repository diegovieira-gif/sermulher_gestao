# 🚀 Guia Rápido - Como Usar Gestão de Matrículas

## 📋 Índice

1. [Acessar a Funcionalidade](#acessar)
2. [Gerenciar Matrículas](#gerenciar)
3. [Solução de Problemas](#problemas)
4. [API Reference](#api)

---

## <a name="acessar"></a>1. 📍 Acessar a Funcionalidade

### Passo 1: Ir para Gestão de Turmas
```
Dashboard → Escola → Turmas
ou
URL: /admin/escola/turmas
```

### Passo 2: Ver Detalhes da Turma
```
Tabela de turmas aparecerá com uma coluna "Detalhes"
Clique no ícone 👁️ (Eye) para abrir a página de detalhes
```

### Passo 3: Você está na página de detalhes!
```
URL: /admin/escola/turmas/{id}
Exibe:
  ├─ Nome da Turma
  ├─ Curso
  ├─ Instrutor
  ├─ Status (Badge)
  ├─ Vagas
  └─ Lista de alunas matriculadas
```

---

## <a name="gerenciar"></a>2. 👥 Gerenciar Matrículas

### ✅ Adicionar Aluna à Turma

**Procedimento:**
```
1. Na página de detalhes, clique no botão "Nova Matrícula"
   └─ Botão verde com ícone + no topo à direita
   
2. Um dialog abrirá:
   ├─ Título: "Adicionar Aluna à Turma"
   └─ Campo: "Beneficiária"
   
3. Selecione a aluna no combobox:
   ├─ Clique no campo
   ├─ Digite o nome ou CPF
   ├─ Selecione da lista
   └─ CPF aparece junto ao nome
   
4. Clique "Confirmar Matrícula"
   ├─ Botão fica em estado de carregamento
   ├─ Se sucesso → Toast verde "Matrícula realizada com sucesso!"
   └─ Se erro → Toast vermelho com mensagem de erro
   
5. A aluna aparecerá na tabela imediatamente
```

**Validações:**
- ❌ Não pode matricular 2x a mesma aluna
- ❌ Deve selecionar uma beneficiária
- ❌ Apenas beneficiárias cadastradas aparecem no combobox

---

### ❌ Remover Matrícula

**Procedimento:**
```
1. Localize a aluna na tabela
2. Clique no ícone 🗑️ (Trash) na coluna "Ações"
3. Um alerta de confirmação aparecerá:
   ├─ Título: "Remover Matrícula"
   └─ Mensagem: "Tem certeza que deseja remover..."
   
4. Clique "Remover" para confirmar
   ├─ Botão fica em estado de carregamento
   ├─ Se sucesso → Toast "Matrícula removida com sucesso!"
   └─ Se erro → Toast com mensagem de erro
   
5. A aluna desaparecerá da tabela
```

**Efeito:**
- Matrícula é deletada do banco de dados
- Cache é revalidado
- Página é refrescada com novos dados

---

## <a name="problemas"></a>3. 🔧 Solução de Problemas

### ❓ Problema: Combobox não aparece com nenhuma beneficiária

**Possíveis causas:**
- Nenhuma beneficiária cadastrada no sistema
- Beneficiárias estão marcadas como inativas

**Solução:**
```
1. Vá para Mulheres → Beneficiárias
2. Verifique se existem beneficiárias cadastradas
3. Se nenhuma existir, crie uma nova
4. Volte para Detalhes da Turma e tente novamente
```

---

### ❓ Problema: "Esta beneficiária já possui uma matrícula ativa nesta turma"

**Causa:**
- Aluna já está matriculada na mesma turma
- Status da matrícula é "ativa"

**Solução:**
```
1. Verifique a tabela se a aluna já aparece
2. Se sim, remova a matrícula anterior
3. Tente matricular novamente
```

---

### ❓ Problema: Tabela está vazia / Nenhuma aluna aparece

**Possíveis causas:**
- Turma realmente não tem alunas matriculadas
- Erro ao carregar dados do servidor

**Solução:**
```
1. Clique "Nova Matrícula" e adicione uma aluna
2. Se ainda vazio, recarregue a página (F5)
3. Se problema persistir, verifique o console (F12)
```

---

### ❓ Problema: Botão "Confirmar Matrícula" não funciona

**Possíveis causas:**
- Nenhuma beneficiária foi selecionada
- Requisição ao servidor está falhando

**Solução:**
```
1. Certifique-se de ter selecionado uma beneficiária
2. Verifique o console (F12) para erros
3. Tente novamente em poucos segundos
4. Se persistir, contate o suporte técnico
```

---

## <a name="api"></a>4. 🔌 API Reference

### Backend Functions

#### `getTurmaById(id: number)`
```typescript
// Entrada
id: 1

// Saída (sucesso)
{
  success: true,
  data: {
    id: 1,
    nome: "Turma A",
    instrutor: "João Silva",
    vagas: 20,
    status: "em_andamento",
    curso: {
      id: 5,
      nome: "Beleza e Estética",
      area_atuacao: "beleza"
    }
  }
}

// Saída (erro)
{
  success: false,
  error: "Turma não encontrada."
}
```

---

#### `getMatriculasByTurma(turmaId: number)`
```typescript
// Entrada
turmaId: 1

// Saída (sucesso)
{
  success: true,
  data: [
    {
      id: 10,
      turma: 1,
      data_matricula: "2026-01-20T10:30:00Z",
      status: "ativa",
      beneficiaria: {
        id: 3,
        nome_completo: "Maria Silva",
        cpf: "123.456.789-10",
        telefone: "(11) 99999-9999"
      }
    }
  ]
}

// Saída (vazio)
{
  success: true,
  data: []
}
```

---

#### `saveMatricula(turmaId: number, beneficiariaId: number)`
```typescript
// Entrada
turmaId: 1
beneficiariaId: 3

// Saída (sucesso)
{
  success: true
}

// Saída (erro - duplicação)
{
  success: false,
  error: "Esta beneficiária já possui uma matrícula ativa nesta turma."
}

// Saída (erro - genérico)
{
  success: false,
  error: "Erro ao salvar matrícula."
}
```

---

#### `deleteMatricula(id: number)`
```typescript
// Entrada
id: 10

// Saída (sucesso)
{
  success: true
}

// Saída (erro)
{
  success: false,
  error: "Erro ao deletar matrícula."
}
```

---

#### `getBeneficiariasOptions()`
```typescript
// Entrada
(nenhuma)

// Saída (sucesso)
{
  success: true,
  data: [
    {
      id: 1,
      nome_completo: "Ana Costa",
      cpf: "111.111.111-11"
    },
    {
      id: 2,
      nome_completo: "Brenda Lima",
      cpf: "222.222.222-22"
    },
    {
      id: 3,
      nome_completo: "Maria Silva",
      cpf: "333.333.333-33"
    }
  ]
}
```

---

### Client Component Props

#### `TurmaDetalhesClient`
```typescript
interface Props {
  turma: {
    id: number;
    nome: string;
    instrutor: string;
    vagas: number;
    status: "aberta" | "em_andamento" | "concluida" | "cancelada";
    curso: {
      id: number;
      nome: string;
      // ... outros campos
    };
  };
  
  matriculas: Matricula[];
  // {
  //   id: number;
  //   turma: number;
  //   beneficiaria: {
  //     id: number;
  //     nome_completo: string;
  //     cpf: string;
  //     telefone: string;
  //   };
  //   data_matricula: string;
  //   status: "ativa" | "concluida" | "cancelada";
  // }
  
  beneficiarias: Array<{
    id: number;
    nome_completo: string;
    cpf: string;
  }>;
}
```

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────┐
│ Listagem de Turmas  │
│  /admin/escola      │
│   /turmas           │
└──────────┬──────────┘
           │
      [Clique olho]
           │
           ▼
┌────────────────────────────┐
│ Detalhes da Turma          │
│ /admin/escola/turmas/{id}  │
├────────────────────────────┤
│ ┌─ Header (Turma info)     │
│ ├─ Tabela (Alunas)         │
│ ├─ Novo Matrícula          │
│ └─ Deletar Matrícula       │
└────────────┬───────────────┘
             │
      ┌──────┴───────┐
      │              │
  [+] │         [🗑️] │
      │              │
      ▼              ▼
   Dialog       Alert
   Adicionar    Deletar
   Matrícula    Matrícula
```

---

## 📞 Contacte o Suporte

Se você encontrar algum problema que não está documentado aqui:

1. Verifique o console (F12 → Console)
2. Copie o erro
3. Contate o desenvolvedor com:
   - URL onde o erro ocorreu
   - Mensagem do erro
   - Passos para reproduzir

---

## ✨ Dicas e Truques

- 💡 Use a busca do combobox digitando nome ou CPF
- 💡 Você pode cancelar um dialog clicando fora dele
- 💡 Toasts aparecem no topo direito por 3 segundos
- 💡 A página se recarrega automaticamente após ações bem-sucedidas
- 💡 Telefone vazio aparece como "—" na tabela

