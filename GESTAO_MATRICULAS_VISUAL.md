# 🎨 VISUAL REFERENCE - Gestão de Matrículas

## Fluxo de Navegação

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD ADMIN                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ [Menu]
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      ┌─▼─┐          ┌─▼─┐          ┌─▼──┐
      │   │          │   │          │    │
    [Mulheres]    [Sala]     [ESCOLA]◄──── VOCÊ ESTÁ AQUI
    (Beneficiários) (Azul)     [Turmas]
                               [Cursos]
                                  │
                              ┌───▼────────────────┐
                              │ Listagem de Turmas │
                              └───────┬────────────┘
                                      │
                      [Clica Eye 👁️ na coluna Detalhes]
                                      │
                          ┌───────────▼────────────────┐
                          │  Página Detalhes Turma     │
                          │  /turmas/[id]              │
                          │                            │
                          │  ┌─ HEADER ─────────────┐  │
                          │  │ Turma, Curso,        │  │
                          │  │ Instrutor, Status    │  │
                          │  └──────────────────────┘  │
                          │                            │
                          │  ┌─ TABELA ──────────────┐ │
                          │  │ Alunas Matriculadas   │ │
                          │  │ ┌──────────────────┐  │ │
                          │  │ │ Nome             │  │ │
                          │  │ │ CPF (formatado)  │  │ │
                          │  │ │ Data (formatado) │  │ │
                          │  │ │ Telefone         │  │ │
                          │  │ │ Status (badge)   │  │ │
                          │  │ └──────────────────┘  │ │
                          │  │ [🗑️ Deletar]         │ │
                          │  └──────────────────────┘  │
                          │                            │
                          │  [➕ Nova Matrícula]       │
                          └───────────────────────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      │                               │
          ┌───────────▼──────────────┐     ┌────────▼──────────────┐
          │ DIALOG: Nova Matrícula   │     │ ALERT: Deletar?       │
          │                          │     │                       │
          │ Beneficiária             │     │ Tem certeza?          │
          │ [BeneficiariaComboBox]   │     │ Esta ação não pode    │
          │   ├─ Busca por nome      │     │ ser desfeita.         │
          │   ├─ Busca por CPF       │     │                       │
          │   └─ Exibe CPF           │     │ [Cancelar] [Remover]  │
          │                          │     └───────────────────────┘
          │ [Cancelar] [Confirmar]   │
          └──────────────────────────┘
```

---

## Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                       │
│                     (Directus)                          │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐
│  escola_turmas   │      │ escola_matriculas │ ◄─ VOCÊ ESTÁ AQUI
├──────────────────┤      ├──────────────────┤
│ id               │◄─────│ id               │
│ nome             │  1:N │ turma (FK)       │
│ curso (FK)       │      │ beneficiaria(FK)─┐
│ instrutor        │      │ data_matricula   │
│ vagas            │      │ status           │
│ status           │      └──────────────────┘
│ data_inicio      │
│ data_fim         │           ┌──────────────────┐
└──────────────────┘           │  beneficiarias   │
         ▲                      ├──────────────────┤
         │                      │ id               │
         │                      │ nome_completo    │
    ┌────┴─────────────┐        │ cpf              │
    │                  │        │ telefone         │
┌───▼──────────┐  ┌────▼──────┐│ ...              │
│escola_cursos │  │(Relação)  ││                  │
├──────────────┤  └───────────┘│                  │
│ id           │               │                  │
│ nome         │               │ ◄─── Referenciado por
│ area_atuacao │               │      escola_matriculas
│ ...          │               └──────────────────┘
└──────────────┘
```

---

## Fluxo de Estado (Client Component)

```
TurmaDetalhesClient
├── state.dialogOpen
│   └── Dialog: Nova Matrícula abre/fecha
├── state.selectedBeneficiaria
│   └── ID selecionado no combobox
├── state.isLoading
│   └── Requisição POST em progresso
├── state.deleteDialogOpen
│   └── Alert: Deletar abre/fecha
├── state.matriculaToDelete
│   └── ID da matrícula a deletar
├── state.isDeleting
│   └── Requisição DELETE em progresso
└── state.currentMatriculas
    └── Lista local de matrículas

    handlers:
    ├── handleAddMatricula()
    │   ├── Valida seleção
    │   ├── POST saveMatricula()
    │   ├── Toast sucesso/erro
    │   └── router.refresh()
    └── handleDeleteMatricula()
        ├── DELETE deleteMatricula()
        ├── Toast sucesso/erro
        ├── Atualiza lista local
        └── router.refresh()
```

---

## Fluxo de Requisições HTTP

```
┌─────────────────────────────────────────────────────────┐
│              CLIENT (Browser)                           │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
    ┌─────▼──┐  ┌────▼────┐ ┌──▼──────┐
    │ GET    │  │  POST   │ │ DELETE  │
    │Inicial │  │Matrícula│ │Matrícula│
    └─────┬──┘  └────┬────┘ └──┬──────┘
          │         │          │
    ┌─────▼─────────▼──────────▼──────┐
    │     Next.js Server Actions      │
    │                                 │
    │ getTurmaById()                  │
    │ getMatriculasByTurma()          │
    │ getBeneficiariasOptions()       │
    │ saveMatricula()                 │
    │ deleteMatricula()               │
    └─────┬───────────┬────────────┬──┘
          │           │            │
    ┌─────▼──────┬────▼────────┬───▼────┐
    │  readItems │ createItem  │ deleteItem
    │ (GET)      │  (POST)     │  (DELETE)
    └─────┬──────┴────┬────────┴────┬────┘
          │           │             │
          └───────────┼─────────────┘
                      │
              ┌───────▼───────┐
              │  Directus API │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │ PostgreSQL DB │
              │               │
              │ Collections:  │
              │ ├ Turmas      │
              │ ├ Matrículas  │
              │ ├ Beneficiárias
              │ └ Cursos      │
              └───────────────┘
```

---

## Estrutura de Componentes

```
page.tsx (Server)
├── getTurmaById()
├── getMatriculasByTurma()
├── getBeneficiariasOptions()
└── <TurmaDetalhesClient />
    │
    └── turma-detalhes-client.tsx (Client)
        │
        ├── useState() - Gerencia diálogos e estado
        ├── useRouter() - Navegação
        │
        ├── <Header />
        │   ├─ Turma nome
        │   ├─ Curso
        │   ├─ Instrutor
        │   ├─ Status (Badge)
        │   └─ Vagas
        │
        ├── <Tabela Alunas />
        │   ├─ Table
        │   ├─ TableHeader
        │   ├─ TableBody
        │   │   └─ TableRow (para cada matrícula)
        │   │       ├─ Nome (formatado)
        │   │       ├─ CPF (formatado)
        │   │       ├─ Data (formatado)
        │   │       ├─ Telefone
        │   │       ├─ Status (Badge)
        │   │       └─ Ações (Trash2)
        │
        ├── <Dialog Nova Matrícula />
        │   ├─ BeneficiariaComboBox
        │   ├─ Botões: Cancelar, Confirmar
        │   └─ Toast feedback
        │
        └── <AlertDialog Deletar />
            ├─ Mensagem confirmação
            ├─ Botões: Cancelar, Remover
            └─ Toast feedback
```

---

## Matriz de Cores

```
Status Badge Colors:
├─ Ativa       → 🟢 Verde (bg-green-600)
├─ Concluída   → ⚫ Cinza (bg-gray-600)
├─ Cancelada   → 🔴 Vermelho (bg-red-600)
└─ Em Andamento→ 🔵 Azul (bg-blue-600)

Button States:
├─ Default    → Azul primário
├─ Hover      → Azul escuro
├─ Disabled   → Cinza
└─ Loading    → Cinza + Spinner

Dialog:
├─ Overlay    → Preto com 50% opacidade
├─ Fundo      → Branco
├─ Border     → Cinza claro
└─ Sombra     → Cinza com blur
```

---

## Fluxo de Formatações

```
CPF:
Input: "12345678910"
  ↓
Remove special chars: "12345678910"
  ↓
Check length == 11: ✓
  ↓
Replace: $1.$2.$3-$4
  ↓
Output: "123.456.789-10"

DATA:
Input: "2026-01-25T10:30:00Z"
  ↓
Parse Date
  ↓
toLocaleDateString('pt-BR')
  ↓
Output: "25/01/2026"

TELEFONE:
Input: "(11) 99999-9999" OR null/""
  ↓
Output: Exibir ou "—" se vazio
```

---

## Ciclo de Vida da Matrícula

```
┌──────────────────────────────────────┐
│      Usuário clica "Nova Matrícula"  │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼─────────┐
        │ Dialog abre      │
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │ Usuário seleciona│
        │ beneficiária     │
        └────────┬─────────┘
                 │
        ┌────────▼─────────────────┐
        │ Clica "Confirmar"        │
        │ isLoading = true         │
        └────────┬─────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │ POST saveMatricula()           │
        │ Backend valida                │
        │ ├─ Turma existe? ✓            │
        │ ├─ Beneficiária existe? ✓     │
        │ ├─ Já matriculada? ✓ (bloqueia)
        │ └─ Cria registro              │
        └────────┬──────────────────────┘
                 │
        ┌────────▼────────┐
        │ Sucesso?        │
        └────┬─────────┬──┘
             │ SIM     │ NÃO
        ┌────▼────┐  ┌─▼──────┐
        │Toast    │  │Toast   │
        │SUCCESS  │  │ERROR   │
        └────┬────┘  └─┬──────┘
             │        │
        ┌────▼────┐  ┌─▼──────┐
        │Fechar   │  │Dialog  │
        │Dialog   │  │fica    │
        │         │  │aberto  │
        └────┬────┘  └────────┘
             │
        ┌────▼────────────────┐
        │ router.refresh()    │
        │ Recarrega dados     │
        │ Atualiza tabela     │
        └────────────────────┘
             │
        ┌────▼──────────────┐
        │ Aluna aparece na  │
        │ tabela            │
        └───────────────────┘
```

---

## Performance Timeline

```
Usuário acessa /admin/escola/turmas/1
│
├─ 0ms: Page carrega server component
│
├─ 50ms: getTurmaById(1) inicia
├─ 51ms: getMatriculasByTurma(1) inicia  ┐ Paralelo
├─ 52ms: getBeneficiariasOptions() inicia┘
│
├─ 200ms: Directus responde
│
├─ 250ms: React renderiza TurmaDetalhesClient
│
├─ 300ms: Page completa (FCP)
│
├─ 350ms: Interativo (TTI)
│
└─ 500ms: Tudo renderizado (LCP)

Total Time to Interactive: ~350ms
```

---

**Diagrama gerado em:** 18/01/2026
**Formato:** ASCII Art
**Propósito:** Referência visual rápida

