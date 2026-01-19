# 🧪 Guia de Testes - Gestão de Matrículas

## ✅ Checklist de Funcionalidades

### 1. Backend - Actions

- [ ] **getTurmaById(id)** 
  - Busca turma com dados do curso
  - Teste: Console log a turma retornada

- [ ] **getMatriculasByTurma(turmaId)**
  - Retorna lista vazia se nenhuma matrícula
  - Retorna matrículas ordenadas por nome
  - Teste: Comparar com dados no Directus

- [ ] **getBeneficiariasOptions()**
  - Retorna todas as beneficiárias
  - Teste: Verificar se combobox é preenchido

- [ ] **saveMatricula(turmaId, beneficiariaId)**
  - ✅ Cria matrícula com status "ativa"
  - ✅ Data matrícula é preenchida automaticamente
  - ✅ Previne duplicação (beneficiária já matriculada)
  - Teste: Tentar matricular mesma beneficiária 2x

- [ ] **deleteMatricula(id)**
  - Remove matrícula do banco
  - Revalida cache
  - Teste: Deletar e verificar se some da lista

---

### 2. Frontend - Página de Detalhes

#### Header
- [ ] Nome da turma é exibido
- [ ] Botão voltar (ArrowLeft) redireciona corretamente
- [ ] Curso é exibido
- [ ] Instrutor é exibido
- [ ] Status é exibido com Badge colorida
- [ ] Vagas é exibido

#### Tabela de Alunas
- [ ] Título mostra contagem correta
- [ ] CPF é formatado (XXX.XXX.XXX-XX)
- [ ] Data matrícula é formatada (DD/MM/YYYY)
- [ ] Telefone é exibido ou "—" se vazio
- [ ] Status tem Badge com cores corretas
- [ ] Ordenação alfabética por nome

#### Diálogo: Nova Matrícula
- [ ] Abre ao clicar "Nova Matrícula"
- [ ] BeneficiariaComboBox é renderizado
- [ ] Busca funciona por nome
- [ ] Busca funciona por CPF
- [ ] CPF é exibido no dropdown
- [ ] Seleção atualiza o combobox
- [ ] Botão "Confirmar" está desabilitado inicialmente
- [ ] Requisição POST é enviada
- [ ] Toast de sucesso aparece
- [ ] Lista é atualizada após matrícula
- [ ] Dialog fecha após sucesso

#### Diálogo: Confirmar Exclusão
- [ ] Abre ao clicar ícone Trash2
- [ ] Mensagem de confirmação é clara
- [ ] Botões de Cancelar e Remover funcionam
- [ ] Botão "Remover" é destrutivo (vermelho)
- [ ] Requisição DELETE é enviada
- [ ] Toast de sucesso aparece
- [ ] Matrícula é removida da tabela
- [ ] Dialog fecha após deleção

---

### 3. Integração - Listagem de Turmas

- [ ] Nova coluna "Detalhes" é exibida
- [ ] Ícone Eye é renderizado
- [ ] Clique redireciona para `/admin/escola/turmas/{id}`
- [ ] Tooltip mostra "Ver detalhes e gerenciar matrículas"

---

### 4. Validações

- [ ] **Duplicação:** Não permite matricular beneficiária 2x
  - Erro esperado: "Esta beneficiária já possui uma matrícula ativa nesta turma."

- [ ] **Seleção obrigatória:** Botão Confirmar desabilitado sem seleção
  - Toast: "Selecione uma beneficiária"

- [ ] **Formatações:**
  - CPF: 123.456.789-10
  - Data: 25/01/2026
  - Telefone vazio: "—"

- [ ] **Revalidação de cache:**
  - Após matrícula/deleção, dados são recarregados
  - Page.tsx é re-executado

---

## 🧬 Casos de Uso

### Caso 1: Matricular uma aluna em uma turma
```
1. Ir para /admin/escola/turmas
2. Clicar olho em uma turma
3. Clicar "Nova Matrícula"
4. Buscar beneficiária por nome
5. Selecionar da lista
6. Clicar "Confirmar Matrícula"
7. Toast de sucesso
8. Aluna aparece na tabela
```

### Caso 2: Remover matrícula
```
1. Na página de detalhes, localizar aluna
2. Clicar ícone Trash2
3. Confirmar deleção
4. Toast de sucesso
5. Aluna desaparece da tabela
```

### Caso 3: Validação de duplicação
```
1. Matricular beneficiária X na turma Y
2. Tentar matricular novamente beneficiária X
3. Erro: "Esta beneficiária já possui uma matrícula ativa nesta turma."
4. Matrícula é rejeitada
```

---

## 🐛 Debugging

### Console.log para testar:
```typescript
// No turma-detalhes-client.tsx
console.log("Turma:", turma);
console.log("Matrículas:", currentMatriculas);
console.log("Beneficiárias:", beneficiariasOptions);
```

### Verificar dados no Directus:
1. Abrir dashboard Directus
2. Collection: `escola_matriculas`
3. Verificar campos: turma, beneficiaria, data_matricula, status

### Network tab do browser:
- Verificar requisições POST/DELETE
- Conferir payload enviado
- Analisar response do server

---

## 📊 Dados de Teste Recomendados

### Turma teste:
- Nome: "Turma A"
- Curso: Qualquer (ex: "Beleza")
- Instrutor: "Teste Instructor"
- Vagas: 20
- Status: "em_andamento"

### Beneficiária teste:
- Nome: "Maria Silva"
- CPF: "123.456.789-10"
- Telefone: "(11) 99999-9999"

---

## ✨ Melhorias Sugeridas

- [ ] Adicionar loading skeleton na tabela
- [ ] Implementar paginação se > 20 alunas
- [ ] Filtros avançados (status, data)
- [ ] Busca/filtro local na tabela
- [ ] Ícone de confirmação de sucesso no header

---

## 🎯 Status

**Implementação:** ✅ Concluída
**Testes:** ⏳ Pendente
**Deploy:** ⏳ Pronto para testar em dev

