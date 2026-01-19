# 🧪 GUIA DE TESTES - RESULTADOS E CERTIFICAÇÃO

## ✅ Checklist de Funcionalidades

### 1. Backend - getTurmaPerformance()

- [ ] **Busca matrículas da turma**
  - Teste: Abrir aba "Resultados" de uma turma com alunas
  - Resultado esperado: Lista carrega sem erro

- [ ] **Calcula frequência percentual**
  - Teste: Aluna com 8 presenças em 10 aulas
  - Resultado esperado: 80% exibido corretamente

- [ ] **Determinação de aprovação (>= 75%)**
  - Teste: Alunas com 75%, 74%, 80%, 50%
  - Resultado esperado: Apenas >= 75% marcadas como aprovadas

- [ ] **Dados retornados completos**
  - Teste: Verificar todos os campos em resposta
  - Campos: aulas_totais, presencas, frequencia_percentual, aprovada

---

### 2. Frontend - Componente Resultados

#### 2.1 Tabela de Performance

- [ ] **Exibição de dados**
  - Coluna: Nome da Aluna
  - Coluna: Presenças (ex: "8 / 10")
  - Coluna: Frequência (barra + %)
  - Coluna: Status (badge)
  - Coluna: Ação (botão Certificado)

- [ ] **Barra de progresso visual**
  - Teste: Aluna com 80%
  - Esperado: Barra preenchida em 80%, cor verde
  - Teste: Aluna com 60%
  - Esperado: Barra preenchida em 60%, cor vermelha

- [ ] **Status visual**
  - Teste: Aluna aprovada
  - Esperado: ✅ Aprovada (verde) com ícone
  - Teste: Aluna reprovada
  - Esperado: ❌ Reprovada (vermelho) com ícone

- [ ] **Botão Certificado**
  - Teste: Clicar botão de aluna aprovada
  - Esperado: Abre nova aba com certificado
  - Teste: Botão de aluna reprovada
  - Esperado: Botão desabilitado (cinza)

#### 2.2 Cards Resumo

- [ ] **Card Total de Alunas**
  - Esperado: Número total de matrículas

- [ ] **Card Aprovadas**
  - Teste: 3 aprovadas em 5
  - Esperado: "3" em verde

- [ ] **Card Reprovadas**
  - Teste: 2 reprovadas em 5
  - Esperado: "2" em vermelho

---

### 3. Página do Certificado

#### 3.1 Dados Exibidos

- [ ] **Nome da aluna em MAIÚSCULAS**
  - Esperado: "MARIA OLIVEIRA SANTOS"

- [ ] **Nome do curso em MAIÚSCULAS**
  - Esperado: "CURSO DE GASTRONOMIA"

- [ ] **Carga horária**
  - Esperado: "40 horas"

- [ ] **Data de início e fim**
  - Esperado: "10 de janeiro de 2025 a 20 de fevereiro de 2025"

- [ ] **Data de impressão**
  - Esperado: "São Paulo, 19 de janeiro de 2026"

#### 3.2 Design e Layout

- [ ] **Borda ornamental**
  - Esperado: Borda verde com cantos decorativos

- [ ] **Proporção 16:11**
  - Teste: Certificado em tela desktop
  - Esperado: Aparência profissional e simétrica

- [ ] **Fonte e espaçamento**
  - Esperado: Texto bem distribuído e legível

#### 3.3 Botões

- [ ] **Botão "Imprimir Certificado"**
  - Teste: Clicar antes de abrir print
  - Esperado: Abre diálogo de impressão

- [ ] **Botão "Fechar"**
  - Teste: Clicar
  - Esperado: Fecha a aba

- [ ] **Botões desaparecem na impressão**
  - Teste: Abrir preview de impressão (Ctrl+P)
  - Esperado: Apenas certificado visível

#### 3.4 Impressão

- [ ] **Preview de impressão limpo**
  - Teste: Ctrl+P ou Print Preview
  - Esperado: Apenas certificado, sem header/footer

- [ ] **Tamanho A4 correto**
  - Teste: Salvar como PDF
  - Resultado: PDF com dimensões corretas

- [ ] **Cores preservadas**
  - Teste: Imprimir com cores
  - Resultado: Borda verde visível no PDF

---

### 4. Integração - Página da Turma

- [ ] **Nova aba "Resultados" visível**
  - Teste: Abrir turma
  - Esperado: 3 abas (Alunas, Diário, Resultados)

- [ ] **Ícone Award na aba**
  - Esperado: Ícone visível e apropriado

- [ ] **Carregamento ao clicar**
  - Teste: Clicar em "Resultados"
  - Esperado: Spinner de carregamento + dados após 1-2s

- [ ] **Mensagem vazia**
  - Teste: Turma sem matrículas ou frequência
  - Esperado: "Nenhum dado de performance disponível"

---

## 🧬 Dados de Teste

### Cenário 1: Turma com Alunas Aprovadas

**Dados:**
- Turma: "Turma Manhã 01"
- Aula com 3 alunas
- Data: 2025-01-10, 2025-01-12, 2025-01-15, 2025-01-17, 2025-01-19, 2025-01-22, 2025-01-24, 2025-01-26, 2025-01-29, 2025-01-31

**Frequência:**
- Maria: presente em 8/10 = 80% ✅
- Ana: presente em 9/10 = 90% ✅
- Paula: presente em 7/10 = 70% ❌

**Ações:**
1. Abrir turma
2. Clicar "Resultados"
3. Verificar tabela com 3 alunas
4. Clicar "Certificado" em Maria → nova aba
5. Imprimir como PDF
6. Tentar clicar "Certificado" em Paula → desabilitado

---

### Cenário 2: Turma Vazia

**Dados:**
- Turma: "Turma sem Alunas"
- Sem matrículas

**Ações:**
1. Abrir turma
2. Clicar "Resultados"
3. Esperado: Mensagem "Nenhum dado de performance disponível"

---

## 📊 Verificações de Cálculo

| Presenças | Total | % | Aprovada | Badge |
|-----------|-------|-----|----------|--------|
| 8 | 10 | 80% | ✅ | Verde |
| 7.5 | 10 | 75% | ✅ | Verde |
| 7 | 10 | 70% | ❌ | Vermelho |
| 15 | 20 | 75% | ✅ | Verde |
| 14 | 20 | 70% | ❌ | Vermelho |

---

## 🖨️ Teste de Impressão

### Steps:

1. Abrir certificado de aluna aprovada
2. Pressionar `Ctrl+P` (Windows) ou `Cmd+P` (Mac)
3. Verificar:
   - ✅ Certificado aparece no preview
   - ✅ Botões NÃO aparecem
   - ✅ Header/Sidebar NÃO aparecem
   - ✅ Proporção 16:11 ou A4 mantida
   - ✅ Texto legível em preto
   - ✅ Borda verde visível
4. Salvar como PDF
5. Abrir PDF e verificar qualidade

---

## 🐛 Bugs Conhecidos para Testar

- [ ] Trocar tab Resultados → Diário → Resultados (recarrega dados?)
- [ ] Adicionar nova matrícula enquanto está em Resultados (dados atualizam?)
- [ ] Impressão em mobile (layout responsivo?)
- [ ] Múltiplas abas de certificado abertas (cada uma funciona?)

---

## ✅ Checklist Final

- [ ] Backend getTurmaPerformance() retorna dados corretos
- [ ] Frontend exibe tabela com todos os dados
- [ ] Cálculo de frequência está correto (>= 75%)
- [ ] Certificado abre em nova aba
- [ ] Certificado imprime sem header/footer
- [ ] Botão desabilitado para < 75%
- [ ] Aba Resultados integrada na página
- [ ] Sem erros no console
- [ ] Responsividade em mobile OK
- [ ] Toast notifications funcionam

---

**Status:** 🟢 Pronto para Teste

**Responsável:** QA/Desenvolvedor

**Data:** Janeiro 2026
