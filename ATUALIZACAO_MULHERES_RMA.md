# 📋 Atualização do Módulo de Mulheres - RMA (Relatório Mensal)

## ✅ Resumo das Mudanças Realizadas

### 1. **Beneficiárias - Schema, Form e Lista**

#### Schema (`beneficiarias/schemas.ts`)
✅ **Adicionados campos opcionais:**
- `recebe_bolsa_familia` (boolean)
- `recebe_bpc` (boolean)  
- `possui_medida_protetiva` (boolean)

```typescript
export const beneficiariaSchema = z.object({
  // ... campos existentes
  recebe_bolsa_familia: z.boolean().optional(),
  recebe_bpc: z.boolean().optional(),
  possui_medida_protetiva: z.boolean().optional(),
});
```

#### Formulário (`beneficiaria-form.tsx`)
✅ **Seção visual "Dados Sociais e Proteção" adicionada:**
- 3 Switches do Shadcn para os novos campos
- Layout responsivo com cards individuais
- Localizados na aba "Dados Sociais"

```tsx
{/* Aba: Dados Sociais e Proteção */}
<TabsContent value="dados-sociais" className="space-y-4 mt-4">
  <div className="border rounded-lg p-4 space-y-4">
    <h3 className="text-sm font-semibold">Dados Sociais e Proteção</h3>
    {/* 3 Switches aqui */}
  </div>
</TabsContent>
```

#### Listagem (`beneficiarias-client.tsx`)
✅ **Nova coluna "Status/Benefícios" com ícones:**
- **Ícone ShieldAlert (laranja/vermelho)** → Medida Protetiva
- **Ícone HandCoins (verde)** → Bolsa Família
- **Ícone Banknote (azul)** → BPC
- Tooltips em cada ícone com labels descritivos
- Query do Directus atualizada para trazer os 3 novos campos

```tsx
const renderBeneficiosStatus = (beneficiaria: any) => {
  const beneficios = [];
  
  if (beneficiaria.possui_medida_protetiva) {
    beneficios.push({
      icon: ShieldAlert,
      label: "Medida Protetiva",
      color: "text-orange-500",
    });
  }
  // ... mais ícones
  
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        {beneficios.map((beneficio, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <Icon className={`h-5 w-5 ${beneficio.color} cursor-help`} />
            </TooltipTrigger>
            <TooltipContent>{beneficio.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
```

---

### 2. **Atendimentos - Schema e Form**

#### Schema (`atendimentos/schemas.ts`)
✅ **Novos campos adicionados:**
- `encaminhamento_rma` (enum com 8 opções)
- `tipos_violencia` (array de strings)

**Enum EncaminhamentoRMA:**
```typescript
export enum EncaminhamentoRMA {
  CRAS = "cras",
  CREAS = "creas",
  SAUDE = "saude",
  EDUCACAO = "educacao",
  TERCEIRO_SETOR = "terceiro_setor",
  CASA_ABRIGO = "casa_abrigo",
  DELEGACIA = "delegacia",
  NENHUM = "nenhum",
}
```

**Tipos de Violência Disponíveis:**
```typescript
export const tiposViolenciaDisponiveis = [
  "fisica",
  "psicologica",
  "sexual",
  "patrimonial",
  "moral",
] as const;
```

#### Formulário (`atendimento-form.tsx`)
✅ **Atualizações implementadas:**

1. **Campo Encaminhamento RMA:**
   - Select (Shadcn) com as 8 opções do enum
   - Labels amigáveis para cada opção
   - Campo opcional

2. **Campo Tipos de Violência:**
   - Multisseleção com Checkboxes
   - 5 opções disponíveis
   - Array de strings armazenado
   - Conversão automática para CSV no servidor

```tsx
{/* Campo Encaminhamento RMA */}
<Select value={field.value || ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
  <option value="">Selecione o encaminhamento...</option>
  <option value={EncaminhamentoRMA.CRAS}>CRAS - Centro de Referência de Assistência Social</option>
  {/* ... outras opções */}
</Select>

{/* Campo Tipos de Violência - Checkboxes */}
<FormField
  control={form.control}
  name="tipos_violencia"
  render={() => (
    <FormItem>
      <div className="space-y-3">
        {tiposViolenciaDisponiveis.map((tipo) => (
          <FormField
            key={tipo}
            control={form.control}
            name="tipos_violencia"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={Array.isArray(field.value) && field.value.includes(tipo)}
                    onCheckedChange={(checked: boolean) => {
                      const currentValue = Array.isArray(field.value) ? field.value : [];
                      const newValue = checked
                        ? [...currentValue, tipo]
                        : currentValue.filter((value) => value !== tipo);
                      field.onChange(newValue);
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal capitalize">
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </FormLabel>
              </FormItem>
            )}
          />
        ))}
      </div>
    </FormItem>
  )}
/>
```

---

### 3. **Server Actions (`atendimentos/actions.ts`)**
✅ **Conversão automática de tipos_violencia:**
- Array → CSV para armazenamento no Directus
- CSV → Array para exibição no formulário

```typescript
// Conversão para salvar
if (validatedData.tipos_violencia && Array.isArray(validatedData.tipos_violencia)) {
  payload.tipos_violencia = validatedData.tipos_violencia.join(",");
}

// Conversão para exibir
tipos_violencia: Array.isArray(atendimento.tipos_violencia) 
  ? atendimento.tipos_violencia 
  : atendimento.tipos_violencia 
    ? atendimento.tipos_violencia.split(",").map((v: string) => v.trim()) 
    : [],
```

---

### 4. **Novo Componente Criado**

#### Tooltip (`components/ui/tooltip.tsx`)
✅ **Componente Shadcn adicionado:**
- Baseado em `@radix-ui/react-tooltip`
- Suporta animações suaves
- Integrado com Tailwind CSS

```typescript
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---

### 5. **Dependências Atualizadas**

#### `package.json`
✅ **Nova dependência adicionada:**
```json
"@radix-ui/react-tooltip": "^1.1.8"
```

---

## 📊 Estrutura Visual Final

### Beneficiárias - Listagem
```
┌─────────────────────────────────────────────────────────────────────┐
│ Nome           │ CPF        │ Telefone      │ Idade  │ Status/Benefícios │
├─────────────────────────────────────────────────────────────────────┤
│ Maria Silva    │ 123.456... │ (11) 98765... │ 32 anos│ 🛡️ 💚 💙        │
│ João Santos    │ 456.789... │ (21) 97654... │ 28 anos│ 💚                │
└─────────────────────────────────────────────────────────────────────┘

Legenda:
🛡️ = Medida Protetiva (laranja/vermelho)
💚 = Bolsa Família (verde)
💙 = BPC (azul)
```

### Beneficiárias - Formulário
```
┌─ Dados Pessoais ─ Endereço e Contato ─ Dados Sociais ─┐
│                                                         │
│ [Dados Sociais e Proteção]                             │
│                                                         │
│ ☐ Recebe Bolsa Família                          [ON]   │
│ ☐ Recebe BPC                                    [OFF]  │
│ ☐ Possui Medida Protetiva                       [ON]   │
│                                                         │
│ [Cancelar]                        [Atualizar/Cadastrar] │
└─────────────────────────────────────────────────────────┘
```

### Atendimentos - Formulário
```
┌─ Card: Dados da Triagem ─────────────────────┐
│ Origem: [Selecione...]  Prioridade: [...]   │
│ Data: [2026-01-17]      Status: [Aberto]    │
│                                              │
│ Encaminhamento RMA: [Selecione...]          │
│   ☐ CRAS                                     │
│   ☐ CREAS                                    │
│   ☐ Saúde                                    │
│   ☐ Educação                                 │
│   ☐ Terceiro Setor                          │
│   ☐ Casa Abrigo                             │
│   ☐ Delegacia                               │
│   ☐ Nenhum                                   │
└──────────────────────────────────────────────┘

┌─ Card: Tipos de Violência ──────────────────┐
│ ☑ Física                                     │
│ ☐ Psicológica                                │
│ ☐ Sexual                                     │
│ ☑ Patrimonial                                │
│ ☐ Moral                                      │
└──────────────────────────────────────────────┘
```

---

## 🔧 Arquivos Modificados

| Arquivo | Modificações |
|---------|--------------|
| `src/app/(admin)/mulheres/beneficiarias/schemas.ts` | ✅ Adicionados 3 campos booleanos |
| `src/app/(admin)/mulheres/beneficiarias/beneficiaria-form.tsx` | ✅ Adicionada aba "Dados Sociais" com 3 Switches |
| `src/app/(admin)/mulheres/beneficiarias/beneficiarias-client.tsx` | ✅ Adicionada coluna "Status/Benefícios" com ícones e tooltips |
| `src/app/(admin)/mulheres/atendimentos/schemas.ts` | ✅ Enums e schemas atualizados |
| `src/app/(admin)/mulheres/atendimentos/atendimento-form.tsx` | ✅ Novos campos Select e Checkboxes adicionados |
| `src/app/(admin)/mulheres/atendimentos/actions.ts` | ✅ Conversão CSV para array |
| `src/components/ui/tooltip.tsx` | ✅ Novo componente Shadcn criado |
| `package.json` | ✅ Dependência @radix-ui/react-tooltip adicionada |

---

## 🎨 Design & UX

✅ **Clean e Responsivo:**
- Design segue padrão Shadcn UI
- Componentes bem organizados em cards
- Tooltips informativos para melhor UX
- Ícones coloridos e intuitivos
- Validação de formulários em tempo real
- Feedback visual com Toasts (sonner)

---

## ✨ Próximos Passos (Opcional)

1. **Executar `npm install`** para instalar a nova dependência
2. **Executar testes** para validar a integração com o banco de dados
3. **Deploy** em staging/produção

---

**Status:** ✅ Implementação Completa
**Data:** 17 de Janeiro de 2026
