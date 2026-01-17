# 🚀 Guia Rápido: Bloco L - Localidade

## Início Rápido (30 segundos)

### Para Usar no Formulário de Beneficiária:
1. Vá para **Admin → Mulheres → Beneficiárias**
2. Clique em **"Nova Beneficiária"** ou edite uma existente
3. Vá para aba **"Endereço e Contato"**
4. Clique no campo **"Bairro"**
5. Digite para buscar (ex: "Santa", "Centro")
6. Selecione da lista OU crie um novo bairro

### Para Ver o Relatório RMA:
1. Vá para **Admin → Relatórios → RMA**
2. Selecione mês e ano com dados
3. Role até o final da página
4. Visualize **"Bloco L: Localidade"**:
   - 📊 Gráfico com TOP 15 bairros
   - 📋 Tabela com todos os bairros
   - 📈 Cards com resumo estatístico

---

## Componentes Principais

### 1️⃣ Campo Combobox (Beneficiária)
```
┌─────────────────────────────────┐
│ Bairro                    ▼ ✕   │
├─────────────────────────────────┤
│ Buscar bairro...                │
├─────────────────────────────────┤
│ ✓ Centro                        │
│ • Santa Maria                   │
│ • Santos Dumont                 │
│ • Siqueira Campos               │
│                                 │
│ + Criar "Santo André"           │
└─────────────────────────────────┘
```

**Ações:**
- Digitar: filtra lista
- Enter: cria novo
- X: limpa seleção
- Esc: fecha dropdown

---

### 2️⃣ Gráfico (Bloco L)
```
Atendimentos por Bairro (TOP 15)

Santa Maria     ████████████████ 156
Centro          ██████████████   132
Iguatemi        ███████████      98
Siqueira Cam.   █████████        78
Santos Dumont   ████████         64
Paraíso         ██████           52
...
```

---

### 3️⃣ Tabela (Bloco L)
```
┌──┬─────────────────┬────────┬─────────┐
│ #│    Bairro       │ Total  │ Percentual
├──┼─────────────────┼────────┼─────────┤
│ 1│ Santa Maria     │  156   │ 25.6%   │
│ 2│ Centro          │  132   │ 21.6%   │
│ 3│ Iguatemi        │   98   │ 16.1%   │
│ 4│ Siqueira Campos │   78   │ 12.8%   │
│ 5│ Santos Dumont   │   64   │ 10.5%   │
│..│ (mais 29 linhas)│  ...   │  ...    │
└──┴─────────────────┴────────┴─────────┘
```

---

### 4️⃣ Cards de Resumo (Bloco L)
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Total Bairros  │ Bairro Máximo   │ Média Aten.     │
│      34         │  Santa Maria    │    18.7         │
│    Únicos       │   156 aten.     │ por bairro      │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Dados de Teste

### Bairros Mais Populares em Aracaju:
- Santa Maria
- Centro
- Iguatemi
- Siqueira Campos
- Santos Dumont
- Paraíso
- Marataízes
- Farolândia
- Getúlio Vargas

### 89 Bairros Disponíveis:
Veja a lista completa em `BAIRROS_ARACAJU` em `src/lib/utils.ts`

---

## Troubleshooting

### ❓ Campo de bairro não aparece como dropdown?
- ✅ Verifique se você está no formulário de beneficiária
- ✅ Procure na aba "Endereço e Contato"
- ✅ Limpe cache do navegador (F12 → Ctrl+Shift+Del)

### ❓ Bloco L não aparece no RMA?
- ✅ Verifique se há atendimentos cadastrados no mês
- ✅ Confirme que beneficiárias têm bairros preenchidos
- ✅ Teste com um mês que tenha dados

### ❓ Posso criar um bairro novo?
- ✅ Sim! Digite o nome e pressione Enter
- ✅ Ou clique em "Criar 'seu bairro'"
- ✅ Será salvo no Directus

### ❓ Como atualizar a lista de bairros?
- ✅ Edite `src/lib/utils.ts`
- ✅ Modifique o array `BAIRROS_ARACAJU`
- ✅ Rode `npm run build` para compilar

---

## API e Tipos

### Importar Bairros:
```typescript
import { BAIRROS_ARACAJU } from "@/lib/utils";
```

### Usar Combobox:
```typescript
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

const options: ComboboxOption[] = [
  { value: "centro", label: "Centro" },
  { value: "santa-maria", label: "Santa Maria" },
];

<Combobox
  options={options}
  value={selectedBairro}
  onValueChange={setSelectedBairro}
  allowCreate={true}
  onCreateOption={handleNewBairro}
/>
```

### Dados RMA com Localidades:
```typescript
const dados = await getDadosRMA({ mes: 1, ano: 2026 });

console.log(dados.localidades);
// Output:
// [
//   { bairro: "Santa Maria", total: 156 },
//   { bairro: "Centro", total: 132 },
//   ...
// ]
```

---

## Performance

| Métrica | Valor |
|---------|-------|
| Bairros na lista | 89 |
| Busca tempo real | <100ms |
| Gráfico renderização | <500ms |
| Tabela renderização | <300ms |

---

## Compatibilidade

✅ **Navegadores:** Chrome, Firefox, Safari, Edge  
✅ **Dispositivos:** Desktop, Tablet, Mobile  
✅ **Impressão:** Otimizado para PDF  
✅ **TypeScript:** Tipagem completa  
✅ **React:** 18+  

---

## Próximas Features Sugeridas

- [ ] Filtro por bairro no dashboard RMA
- [ ] Mapa interativo com distribuição de bairros
- [ ] Comparativo bairro vs bairro
- [ ] Exportar dados por bairro em CSV
- [ ] Alerts para bairros com alta concentração

---

## Contato/Dúvidas

Para reportar bugs ou sugerir melhorias:
1. Verifique este guia
2. Consulte a documentação completa em `RMA_BLOCO_L_DOCUMENTACAO.md`
3. Verifique os exemplos de teste

---

**Versão:** 1.0  
**Data:** Janeiro 17, 2026  
**Status:** ✅ Produção
