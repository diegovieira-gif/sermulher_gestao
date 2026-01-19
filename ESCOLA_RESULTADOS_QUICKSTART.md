# 🚀 QUICK START - RESULTADOS E CERTIFICAÇÃO

## ⚡ 30 Segundos de Explicação

**O que foi feito?**

Implementação da fase final do módulo "Escola da Mulher": Resultados e Certificação.

- ✅ Função backend que calcula frequência e aprova alunas (>= 75%)
- ✅ Interface visual com tabela de resultados
- ✅ Certificado profissional otimizado para impressão
- ✅ Nova aba integrada na página de turmas

---

## 🎯 Como Usar

### 1️⃣ Acessar Resultados de uma Turma

```
1. Vá para: /admin/escola/turmas
2. Clique em uma turma
3. Clique na aba "Resultados" (ícone de troféu)
4. Pronto! Veja a tabela com frequência de cada aluna
```

### 2️⃣ Imprimir Certificado

```
1. Na aba "Resultados", procure a aluna aprovada (>= 75%)
2. Clique no botão "Certificado" (ícone de impressora)
3. Uma nova aba abre com o certificado
4. Clique em "Imprimir Certificado"
5. Salve como PDF ou imprima
```

### 3️⃣ Entender os Dados

```
Frequência = (Presenças / Total de Aulas) × 100

Exemplo:
- Aluna A: 8 presenças em 10 aulas = 80% ✅ Aprovada
- Aluna B: 7 presenças em 10 aulas = 70% ❌ Reprovada
```

---

## 📂 Arquivos Principais

```
src/app/(admin)/escola/
│
├── actions.ts
│   └── Função: getTurmaPerformance() [nova]
│
├── turmas/[id]/
│   ├── page.tsx [modificado]
│   ├── turma-detalhes-client.tsx [modificado]
│   └── resultados-client.tsx [novo]
│
└── certificado/[id]/
    ├── page.tsx [novo]
    ├── certificado-client.tsx [novo]
    └── certificado.css [novo]
```

---

## 🔧 Desenvolvimento

### Para Adicionar Funcionalidade

**1. Customizar Certificado:**
```
Arquivo: certificado-client.tsx
- Mudar layout
- Alterar texto
- Adicionar logo

Arquivo: certificado.css
- Cores
- Fonts
- Margens
```

**2. Alterar Critério de Aprovação:**
```
Arquivo: actions.ts
Função: getTurmaPerformance()

Linha: const aprovada = frequencia_percentual >= 75;

Mudar para: >= 80 (ou outro valor)
```

**3. Customizar Tabela de Resultados:**
```
Arquivo: resultados-client.tsx
- Adicionar colunas
- Mudar cores
- Adicionar filtros
```

---

## 🧪 Testes Rápidos

### Teste 1: Ver Resultados
```
✅ Turma com alunas e frequência registrada
✅ Clique em "Resultados"
✅ Deve exibir tabela
```

### Teste 2: Imprimir Certificado
```
✅ Aluna com >= 75%
✅ Clique em "Certificado"
✅ Nova aba abre
✅ Clique "Imprimir"
✅ PDF salvo
```

### Teste 3: Botão Desabilitado
```
✅ Aluna com < 75%
✅ Botão "Certificado" deve estar cinza (desabilitado)
```

---

## 📊 Dados Necessários

Para que tudo funcione, você precisa de:

```
1. Turma cadastrada (escola_turmas)
   └─ Com curso associado (escola_cursos)

2. Alunas matriculadas (escola_matriculas)
   └─ Com beneficiárias (beneficiarias)

3. Frequência registrada (escola_frequencia)
   └─ Com datas de aulas

Exemplo:
Turma: "Turma 01"
  ├─ Aluna 1: 8 presenças em 10 aulas
  ├─ Aluna 2: 9 presenças em 10 aulas
  └─ Aluna 3: 7 presenças em 10 aulas
```

---

## 🐛 Troubleshooting

### "Aba Resultados não aparece"
- ✅ Verifique se a turma tem alunas matriculadas
- ✅ Verifique se há registros de frequência

### "Nenhum dado de performance disponível"
- ✅ Adicione frequência no "Diário de Classe"
- ✅ Clique em "Resultados" novamente

### "Botão Certificado está desabilitado"
- ✅ Normal! Aluna precisa de >= 75%
- ✅ Aumentar frequência para >= 75%

### "Certificado não imprime bem"
- ✅ Use navegador moderno (Chrome/Edge)
- ✅ Defina margens como "Mínimo" na impressão
- ✅ Desabilite headers/footers

---

## 📚 Documentação Completa

Leia estes arquivos para detalhes:

```
ESCOLA_RESULTADOS_CERTIFICACAO.md
├─ Implementação técnica
├─ Tipos TypeScript
├─ Funções backend
└─ Componentes frontend

ESCOLA_RESULTADOS_TESTES.md
├─ Checklist de testes
├─ Cenários de teste
├─ Dados de exemplo
└─ Bugs conhecidos

ESCOLA_RESULTADOS_VISUAL.md
├─ Sumário visual
├─ Fluxo de uso
├─ Estatísticas
└─ Próximos passos
```

---

## 🎓 Exemplo de Uso Completo

### Cenário: Emitir Certificado para Maria

```
Passo 1: Acessar Turma
   URL: /admin/escola/turmas/123

Passo 2: Ver Resultados
   Clique: Aba "Resultados"
   Resultado: Tabela com 3 alunas
   - Maria: 8/10 = 80% ✅ Aprovada
   - Ana: 9/10 = 90% ✅ Aprovada
   - Paula: 7/10 = 70% ❌ Reprovada

Passo 3: Abrir Certificado de Maria
   Clique: Botão "Certificado" de Maria
   Resultado: Nova aba abre
   URL: /admin/escola/certificado/456

Passo 4: Exibir Certificado
   Dados Exibidos:
   - Nome: MARIA OLIVEIRA SANTOS
   - Curso: GASTRONOMIA
   - Carga: 40 horas
   - Período: 10/01/2025 a 20/02/2025
   - Data: 19 de janeiro de 2026

Passo 5: Imprimir
   Clique: "Imprimir Certificado"
   Ação: window.print()
   Resultado: Diálogo de impressão
   
Passo 6: Salvar/Imprimir
   Opção 1: Salvar como PDF
   Opção 2: Imprimir em papel
   Resultado: Certificado em mãos
```

---

## 🎨 Características Principais

```
🎯 Tabela de Resultados
   ✅ Nome da aluna
   ✅ Presenças (8/10)
   ✅ Frequência (80%)
   ✅ Barra visual (verde/vermelho)
   ✅ Status (Aprovada/Reprovada)
   ✅ Botão Certificado

🏆 Certificado
   ✅ Layout profissional
   ✅ Dados completos
   ✅ Borda ornamental
   ✅ Otimizado para PDF
   ✅ Sem headers/footers na impressão

📊 Resumo
   ✅ Total de alunas
   ✅ Aprovadas (card verde)
   ✅ Reprovadas (card vermelho)
```

---

## 💡 Dicas e Truques

### Salvar Certificado como PDF
```
1. Clique em "Imprimir Certificado"
2. No diálogo, selecione: "Salvar como PDF"
3. Escolha pasta e nome
4. Clique "Salvar"
```

### Imprimir Vários Certificados
```
1. Abra certificado da 1ª aluna
2. Imprima (Ctrl+P)
3. Volte (browser back button)
4. Clique em próxima aluna
5. Repita
```

### Customizar Cores
```
Editar: src/app/(admin)/escola/certificado/[id]/certificado.css

Procure: #1a472a (verde principal)
Substitua por: seu código de cor
```

---

## 🔗 URLs Importantes

```
Listar Turmas:
/admin/escola/turmas

Turma Específica:
/admin/escola/turmas/[id]

Certificado:
/admin/escola/certificado/[matriculaId]

API:
getTurmaPerformance(turmaId)
```

---

## ❓ FAQ

**P: Posso imprimir múltiplos certificados?**
R: Sim, abra cada um em aba separada e imprima em sequência.

**P: Posso alterar o critério de aprovação?**
R: Sim, edite `actions.ts` na função `getTurmaPerformance()`.

**P: E se a impressão sair cortada?**
R: Nas configurações de impressão, selecione "Mínimo" para margens.

**P: Como enviar certificado por email?**
R: Salve como PDF e envie manualmente (automação futura).

---

## 📞 Suporte

```
Erro na Aba "Resultados"?
→ Verifique console (F12)
→ Veja ESCOLA_RESULTADOS_CERTIFICACAO.md

Certificado não carrega?
→ Verifique se matriculaId é válida
→ Veja se dados existem no banco

Impressão com problemas?
→ Use navegador Chrome/Edge
→ Desabilite extensões
→ Limpe cache (Ctrl+Shift+Del)
```

---

## ✅ Checklist Final

- [ ] Leia este arquivo (Quick Start)
- [ ] Acesse uma turma com alunas
- [ ] Clique em "Resultados"
- [ ] Veja a tabela de frequência
- [ ] Clique em "Certificado" de uma aluna aprovada
- [ ] Imprima certificado
- [ ] Teste em mobile
- [ ] Leia documentação completa se necessário

---

## 🎉 Pronto!

Você está pronto para usar a funcionalidade de Resultados e Certificação!

**Próximas documentações:**
- `ESCOLA_RESULTADOS_CERTIFICACAO.md` - Técnico
- `ESCOLA_RESULTADOS_TESTES.md` - Testes
- `ESCOLA_RESULTADOS_VISUAL.md` - Visão Geral

---

**Desenvolvido em:** Janeiro 2026  
**Última atualização:** 19/01/2026  
**Versão:** 1.0  
**Status:** ✅ Produção Pronta
