# 🎯 GUIA RÁPIDO - Escola da Mulher

## 📌 Checklist de Execução

### ✅ Passo 1: Criar o Schema no Directus
```bash
node update-schema-escola.js
```

**Esperado:**
```
🚀 Iniciando setup do Schema "Escola da Mulher"...

📚 Criando collection "escola_cursos"...
✅ Collection "escola_cursos" criada com sucesso.
✅ Field 'escola_cursos.nome' criado com sucesso.
✅ Field 'escola_cursos.area_atuacao' criado com sucesso.
... [mais fields]

👥 Criando collection "escola_turmas"...
✅ Collection "escola_turmas" criada com sucesso.
... [fields de turmas]

📋 Criando collection "escola_matriculas"...
✅ Collection "escola_matriculas" criada com sucesso.
... [fields de matrículas]

🔗 Criando relacionamentos...
✅ Relacionamento 'escola_turmas.curso' criado com sucesso.
✅ Relacionamento 'escola_matriculas.turma' criado com sucesso.
✅ Relacionamento 'escola_matriculas.beneficiaria' criado com sucesso.

🎉 Schema "Escola da Mulher" configurado com sucesso!
```

---

### ✅ Passo 2: Verificar Collections no Directus

1. Abra: `http://localhost:8055` (seu Directus)
2. Clique no ícone de **engrenagem** (Settings)
3. Vá em **Data Model**
4. Procure por:
   - [ ] `escola_cursos`
   - [ ] `escola_turmas`
   - [ ] `escola_matriculas`

5. Clique em cada uma e verifique:
   - [ ] Todos os fields aparecem
   - [ ] Dropdown options estão corretas
   - [ ] Relacionamentos estão configurados

**Screenshot esperado:**
```
Data Model
├─ All Collections
│  ├─ escola_cursos          ✓
│  │  ├─ ID
│  │  ├─ nome
│  │  ├─ area_atuacao
│  │  ├─ carga_horaria
│  │  └─ ementa
│  ├─ escola_turmas          ✓
│  │  ├─ ID
│  │  ├─ nome
│  │  ├─ curso (M2O)
│  │  ├─ instrutor
│  │  ├─ data_inicio
│  │  ├─ data_fim
│  │  ├─ status
│  │  └─ vagas
│  └─ escola_matriculas      ✓
│     ├─ ID
│     ├─ turma (M2O)
│     ├─ beneficiaria (M2O)
│     ├─ data_matricula
│     └─ status
```

---

### ✅ Passo 3: Testar no Frontend

1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Navegue para: `http://localhost:3000/admin/escola/cursos`

3. Verifique:
   - [ ] Página carrega sem erros
   - [ ] Botão "Novo Curso" aparece
   - [ ] Tabela vazia mostra mensagem "Nenhum curso cadastrado ainda"

---

### ✅ Passo 4: Criar Primeiro Curso

1. Clique em **"Novo Curso"**

2. Preencha o formulário:
   ```
   Nome:              "Manicure e Pedicure"
   Área de Atuação:   "Beleza"
   Carga Horária:     "40"
   Ementa:            "Técnicas modernas de manicure profissional..."
   ```

3. Clique em **"Criar Curso"**

4. Verifique:
   - [ ] Toast verde "Curso criado com sucesso!"
   - [ ] Curso aparece na tabela
   - [ ] Dialog fecha automaticamente

---

### ✅ Passo 5: Testar Operações CRUD

#### Criar (Create)
```
✓ Clique "Novo Curso"
✓ Preencha formulário
✓ Clique "Criar Curso"
✓ Veja na tabela
```

#### Ler (Read)
```
✓ Cursos carregam na tabela
✓ Dados aparecem com formatação correta
✓ Área mostra badge colorida
✓ Carga horária mostra com "h"
```

#### Atualizar (Update)
```
✓ Clique "Editar" em um curso
✓ Dialog abre com dados preenchidos
✓ Altere algum campo
✓ Clique "Atualizar Curso"
✓ Veja mudanças na tabela
```

#### Deletar (Delete)
```
✓ Clique "Deletar" em um curso
✓ Dialog de confirmação aparece
✓ Clique "Deletar"
✓ Curso desaparece da tabela
```

---

### ✅ Passo 6: Verificar Menu Sidebar

1. Na página de cursos, olhe para a **Sidebar esquerda**

2. Procure por:
   ```
   📚 ESCOLA DA MULHER
      ├─ Catálogo de Cursos ← você está aqui
      └─ Gestão de Turmas
   ```

3. Verifique:
   - [ ] Menu item aparece com ícone de livro
   - [ ] Item está ativo/destacado
   - [ ] Link para "Gestão de Turmas" funciona (pode estar vazio por enquanto)

---

## 🐛 Troubleshooting

### Erro: "❌ Variáveis de ambiente DIRECTUS_URL ou DIRECTUS_TOKEN não encontradas"

**Solução:**
1. Verifique `.env.local`:
   ```
   NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
   DIRECTUS_TOKEN=seu_token_aqui
   ```

2. Reinicie o script:
   ```bash
   node update-schema-escola.js
   ```

---

### Erro: "Collection already exists"

**Solução:** ✓ Normalmente isso significa que o schema já foi criado
- Se quer recriar, delete as collections no Directus e execute novamente

---

### Página retorna 404

**Solução:**
1. Verifique se arquivo existe: `src/app/(admin)/escola/cursos/page.tsx`
2. Reinicie servidor: `npm run dev`
3. Limpe cache: `Ctrl+Shift+Del` no navegador

---

### Formulário não valida

**Solução:**
1. Abra DevTools (F12)
2. Procure por erros no Console
3. Verifique que `zod` está instalado: `npm list zod`

---

### Dados não salvam no Directus

**Solução:**
1. Verifique token do Directus
2. Teste permissões:
   - Directus → Configurações → Permissões
   - Verifique que sua role tem acesso às collections

---

## 📊 Dados de Exemplo

Se quiser popular com dados de teste:

### SQL direto no Directus (Admin):
```sql
INSERT INTO escola_cursos (nome, area_atuacao, carga_horaria, ementa)
VALUES 
  ('Manicure e Pedicure', 'beleza', 40, 'Técnicas profissionais'),
  ('Panificação Artesanal', 'gastronomia', 30, 'Pães e bolos caseiros'),
  ('Excel Avançado', 'tecnologia', 20, 'Fórmulas e VBA'),
  ('Crochê e Amigurumi', 'artesanato', 25, 'Técnicas de crochê');
```

Ou use o formulário do frontend (recomendado):
1. Clique "Novo Curso"
2. Preencha um por um
3. Observe os dados aparecerem em tempo real

---

## 🎯 Objetivos da Fase 1

- [x] Criar collections no Directus
- [x] Criar relacionamentos M2O
- [x] Implementar Server Actions
- [x] Criar página de CRUD de cursos
- [x] Adicionar ao menu Sidebar
- [x] Validação com Zod
- [x] UI com componentes reutilizáveis
- [x] Documentação completa

---

## 📋 Arquivos Criados

```
📦 Projeto
├─ update-schema-escola.js             ← Script banco
├─ ESCOLA_DA_MULHER.md                 ← Documentação completa
├─ ESCOLA_RESUMO_IMPLEMENTACAO.md      ← Este arquivo
└─ src/app/(admin)/escola/
   ├─ actions.ts                       ← Server actions
   ├─ cursos/
   │  └─ page.tsx                      ← Página de cursos
   └─ turmas/
      └─ (placeholder para próxima fase)
```

---

## 🚀 Próxima Fase

Quando terminar os testes, avançamos para:

### Fase 2: Gestão de Turmas
- [ ] Criar `src/app/(admin)/escola/turmas/page.tsx`
- [ ] Listar turmas com dropdown de cursos
- [ ] CRUD completo

### Fase 3: Matrículas
- [ ] Criar `src/app/(admin)/escola/matriculas/page.tsx`
- [ ] Matricular beneficiárias
- [ ] Dashboard de ocupação

---

## ✅ Validação Final

Faça uma checklist final:

- [ ] Script executou sem erros
- [ ] Collections aparecem no Directus
- [ ] Página de cursos abre sem 404
- [ ] Botão "Novo Curso" funciona
- [ ] Formulário valida campos
- [ ] Curso salva no banco
- [ ] Curso aparece na tabela
- [ ] Edição funciona
- [ ] Deleção funciona
- [ ] Menu Sidebar mostra "Escola da Mulher"

Se tudo está ✅, a **Fase 1 está completa!**

---

## 📞 Suporte

- Console do navegador (F12) para erros de frontend
- Logs do servidor para erros de backend
- Painel Directus para verificar dados

**Status:** 🟢 PRONTO PARA TESTES
