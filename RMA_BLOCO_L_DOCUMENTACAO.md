# Padronização do Bloco L - Localidade (RMA)

## Sumário das Alterações

Este documento descreve as mudanças implementadas para a **automação total do Relatório Mensal de Atendimento (RMA)**, especificamente o **Bloco L - Localidade** (bairros), conforme solicitado.

---

## 1. Padronização de Dados

### Arquivo: `src/lib/utils.ts`

**Alteração:** Criada a constante exportada `BAIRROS_ARACAJU` contendo a lista oficial de bairros de Aracaju.

- **89 bairros** cadastrados e ordenados alfabeticamente
- Inclui variações como "Parque *", "São *", "Tabuleiro *", etc.
- Lista completa conforme documento oficial do RMA

```typescript
export const BAIRROS_ARACAJU = [
  "17 de Março",
  "Aeroporto",
  "Almirante Tamandaré",
  // ... (86 mais)
  "Vitória Régia",
] as const;
```

**Uso:** A constante é importada e utilizada em todo o sistema para garantir consistência.

---

## 2. Novo Componente Combobox

### Arquivo: `src/components/ui/combobox.tsx` (NOVO)

**Criação:** Componente Combobox com suporte a busca e criação de novas opções.

**Recursos:**
- ✅ Busca em tempo real com filtro case-insensitive
- ✅ Permite criar novos bairros se não estiverem na lista (fallback)
- ✅ Limpeza de seleção com botão X
- ✅ Interface responsiva e acessível
- ✅ Suporte a TypeScript

**Propriedades:**
```typescript
interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowCreate?: boolean;
  onCreateOption?: (newOption: string) => void;
  disabled?: boolean;
  clearable?: boolean;
}
```

---

## 3. Atualização do Formulário

### Arquivo: `src/app/(admin)/mulheres/beneficiarias/beneficiaria-form.tsx`

**Mudanças:**

1. **Import do Combobox:**
   ```typescript
   import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
   import { BAIRROS_ARACAJU } from "@/lib/utils";
   ```

2. **Substituição do campo "Bairro":**
   - **Antes:** `<Input placeholder="Centro" {...field} />`
   - **Depois:** `<Combobox>` com lista de `BAIRROS_ARACAJU`

3. **Comportamento:**
   - Exibe lista dropdown com bairros padronizados
   - Permite busca/filtro dinâmico
   - Permite adicionar novo bairro se não existir (com notificação toast)
   - Mantém validação Zod obrigatória

**Linha aproximada:** 300-330

---

## 4. Lógica RMA - Agregação por Bairro

### Arquivo: `src/app/(admin)/relatorios/rma/actions.ts`

**Mudanças na função `getDadosRMA()`:**

1. **Novo tipo exportado:**
   ```typescript
   export type LocalidadeRMA = {
     bairro: string;
     total: number;
   };
   ```

2. **Atualização do tipo `DadosRMA`:**
   ```typescript
   export type DadosRMA = {
     volume: VolumeRMA;
     perfil: PerfilRMA;
     encaminhamentos: Encaminhamentos;
     tipos_violencia: TiposViolencia;
     localidades: LocalidadeRMA[];  // ← NOVO
   };
   ```

3. **Query melhorada:**
   - Agora inclui `beneficiaria.endereco.bairro` nos campos recuperados
   - Tipo `AtendimentoRMA` atualizado com campo `endereco_bairro`

4. **Agregação implementada:**
   - Novo `Map<string, number>` para contar atendimentos por bairro
   - Itera sobre todos os atendimentos do mês
   - Agrupa por `beneficiaria.endereco_bairro`
   - Ordena resultado por **total decrescente** (maior para menor)

5. **Retorno:**
   ```typescript
   localidades: Array.from(localidadesMap.entries())
     .map(([bairro, total]) => ({ bairro, total }))
     .sort((a, b) => b.total - a.total) // Ordenado por total
   ```

---

## 5. Dashboard RMA - Bloco L Visual

### Arquivo: `src/app/(admin)/relatorios/rma/rma-client.tsx`

**Adição da seção "Bloco L: Localidade"** no final do relatório.

### Componentes implementados:

#### 5.1 Gráfico de Barras Horizontal
- Exibe **TOP 15 bairros** com mais atendimentos
- Usa `Recharts` (BarChart em layout vertical)
- Cores visuais consistentes (roxo principal)

#### 5.2 Tabela Detalhada
- 4 colunas: Posição | Bairro | Atendimentos | Percentual
- Linhas alternadas em cor clara (zebrada)
- Todos os bairros listados
- Percentual de cada bairro em relação ao total

#### 5.3 Cards de Resumo
Três cards informativos:
- **Total de Bairros:** Quantidade única de bairros com atendimentos
- **Bairro com Mais Atendimentos:** Nome e total do principal
- **Média de Atendimentos:** Total ÷ Quantidade de bairros

#### 5.4 Estados Vazios
- Mensagem: "Nenhum registro de localidade encontrado no período"
- Renderizado apenas se `dados.localidades.length === 0`

---

## 6. Integração Completa

### Fluxo de Dados:

```
1. Beneficiária preenchida com Combobox de bairro
   ↓
2. Dado salvo no Directus (endereco.bairro)
   ↓
3. Relatório RMA consulta atendimentos do mês
   ↓
4. getDadosRMA() agrega por bairro
   ↓
5. RMAClient renderiza Bloco L com gráficos e tabela
```

---

## 7. Validações e Garantias

✅ **TypeScript:** Tipagem completa sem `any`  
✅ **Compilação:** Sem erros de build  
✅ **Acessibilidade:** Componente Combobox acessível com teclado  
✅ **Responsividade:** Gráfico e tabela adaptáveis  
✅ **Impressão:** Css `print:hidden` aplicado onde necessário  
✅ **Dados Reais:** Integrado com Directus API  

---

## 8. Como Testar

### 1. Formulário de Beneficiária
```
→ Navegue para: /admin/mulheres/beneficiarias
→ Clique em "Nova Beneficiária" ou edite uma existente
→ Vá para a aba "Endereço e Contato"
→ Clique no campo "Bairro"
→ Teste a busca digitando (ex: "Santa")
→ Tente criar um novo bairro
```

### 2. Relatório RMA
```
→ Navegue para: /relatorios/rma
→ Selecione mês e ano com dados
→ Role até o final: "Bloco L: Localidade"
→ Verifique gráfico, tabela e cards
→ Teste impressão (Ctrl+P)
```

---

## 9. Extensões Futuras

1. **Exportação PDF:** Bloco L já preparado para incluir em PDF
2. **Filtros:** Adicionar filtro por bairro no dashboard
3. **Geolocalização:** Integrar com mapas (Google Maps, etc)
4. **Comparativos:** Gráficos de bairros mês a mês
5. **Integração RMA:** Exportar diretamente para formato oficial da secretaria

---

## 10. Referências de Arquivos

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `src/lib/utils.ts` | Modified | Constante BAIRROS_ARACAJU |
| `src/components/ui/combobox.tsx` | Created | Novo componente |
| `src/app/(admin)/mulheres/beneficiarias/beneficiaria-form.tsx` | Modified | Campo Bairro com Combobox |
| `src/app/(admin)/relatorios/rma/actions.ts` | Modified | Tipos + Agregação de bairros |
| `src/app/(admin)/relatorios/rma/rma-client.tsx` | Modified | Bloco L visual |

---

## ✅ Status: COMPLETO

**Data:** Janeiro 17, 2026  
**Ambiente:** Next.js + React + TypeScript + Directus  
**Teste de Compilação:** ✅ PASSOU  

Todas as funcionalidades foram implementadas conforme especificado e estão prontas para produção.
