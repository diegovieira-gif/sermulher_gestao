# 🚀 Guia Rápido - Dashboard Unificado

## ✅ Pré-requisito Concluído

O `recharts` já está instalado no seu projeto:
```json
"recharts": "^3.6.0"
```

## 📁 Arquivos Criados/Modificados

### ✅ Criados:
1. `src/app/(admin)/dashboard/unified-dashboard-client.tsx` - Componente visual
2. `DASHBOARD_UNIFICADO.md` - Documentação completa

### ✅ Modificados:
1. `src/app/(admin)/dashboard/actions.ts` - Nova função `getUnifiedDashboardStats()`
2. `src/app/(admin)/dashboard/page.tsx` - Integração com novo dashboard

## 🔧 Como Executar

### 1. Certifique-se de que o Directus está rodando

```bash
# O Directus deve estar acessível
# Ex: http://localhost:8055
```

### 2. Configure as variáveis de ambiente

Verifique seu arquivo `.env.local`:
```env
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=seu_token_admin
```

### 3. Reinicie o servidor de desenvolvimento

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 4. Acesse o Dashboard

```
http://localhost:3000/admin/dashboard
```

## 🎯 O Que Você Vai Ver

### **Linha 1: 4 Cards KPI**
- 🩷 **Atendimentos do Mês** - Total de atendimentos realizados
- 💙 **Alunas Ativas** - Quantidade de alunas cursando
- 💚 **Turmas Abertas** - Turmas em andamento
- 💜 **Próximo Evento** - Data e nome do próximo evento

### **Linha 2: Gráfico de Evolução**
- 📊 **AreaChart** mostrando a evolução dos atendimentos nos últimos 6 meses
- Gradiente rosa elegante
- Tooltip interativo

### **Linha 3: 2 Cards Resumo**
- 📚 **Escola da Mulher** - Resumo das estatísticas educacionais
- 🩷 **Rede Mulher Atendida** - Resumo dos atendimentos

## 🐛 Resolução de Problemas

### Erro: "Cannot find module './unified-dashboard-client'"

**Causa:** Cache do TypeScript/VS Code

**Solução:**
```bash
# 1. Pare o servidor dev (Ctrl+C)
# 2. Limpe o cache do Next.js
Remove-Item -Recurse -Force .next

# 3. Reinicie o servidor
npm run dev

# 4. Se ainda persistir, reinicie o VS Code
```

### Erro: "Collection not found"

**Causa:** Collections não existem no Directus

**Solução:** Verifique se estas collections existem:
- `atendimentos`
- `escola_matriculas`
- `escola_turmas`
- `eventos_campanhas`

### Dados não aparecem

**Causa:** Collections vazias ou sem dados

**Solução:** Adicione dados de teste no Directus para cada módulo

## 📊 Estrutura de Dados Esperada

### **atendimentos**
```
id, data_abertura, status
```

### **escola_matriculas**
```
id, status (valores: "cursando", "concluída", "cancelada")
```

### **escola_turmas**
```
id, data_inicio, data_fim
```

### **eventos_campanhas**
```
id, data_inicio, titulo, local_id { nome }
```

## 🎨 Personalização

### Alterar Cores dos Cards

Edite `unified-dashboard-client.tsx`:

```tsx
// Card 1 - Atendimentos (Rosa)
text-pink-600      // Altere para outra cor
bg-pink-50         // Fundo do card
bg-pink-100        // Fundo do ícone

// Card 2 - Alunas (Azul)
text-blue-600
bg-blue-50
bg-blue-100

// Card 3 - Turmas (Verde)
text-green-600
bg-green-50
bg-green-100

// Card 4 - Eventos (Roxo)
text-purple-600
bg-purple-50
bg-purple-100
```

### Alterar Período do Gráfico

Edite `actions.ts` na função `getUnifiedDashboardStats()`:

```typescript
// Altere de 6 para outro número
for (let i = 5; i >= 0; i--) {  // Mude o 5 para outro valor
```

## 🧪 Teste Rápido

Execute este comando no PowerShell para verificar se as collections existem:

```powershell
$url = "http://localhost:8055"
$token = "SEU_TOKEN"

# Teste cada collection
@("atendimentos", "escola_matriculas", "escola_turmas", "eventos_campanhas") | ForEach-Object {
    $headers = @{ "Authorization" = "Bearer $token" }
    try {
        $response = Invoke-RestMethod -Uri "$url/items/$_?limit=1" -Headers $headers
        Write-Host "✅ $_: OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $_: Erro" -ForegroundColor Red
    }
}
```

## ✨ Funcionalidades Implementadas

- ✅ Agregação de dados de 4 módulos diferentes
- ✅ KPIs visuais com ícones e cores
- ✅ Gráfico interativo de evolução temporal
- ✅ Layout responsivo (mobile, tablet, desktop)
- ✅ Dark mode completo
- ✅ Otimização de performance
- ✅ Tratamento de erros robusto
- ✅ TypeScript type-safe
- ✅ Componentes reutilizáveis

## 📚 Documentação Completa

Consulte `DASHBOARD_UNIFICADO.md` para:
- Detalhes técnicos da implementação
- Estrutura completa do código
- Otimizações de performance
- Próximos passos sugeridos

---

**🎉 Pronto! Seu Dashboard Unificado está implementado!**

Se encontrar algum problema, verifique:
1. ✅ Directus rodando
2. ✅ Variáveis de ambiente configuradas
3. ✅ Collections existem no Directus
4. ✅ Cache limpo (`.next` removido)
5. ✅ Servidor reiniciado
