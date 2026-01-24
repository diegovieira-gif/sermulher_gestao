import { z } from "zod";

// Schema para o objeto de contato
export const contatoSchema = z.object({
  telefone: z.string().optional(),
  email: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Email inválido" },
    )
    .optional(),
});

// Schema para o objeto de endereço (Tudo Opcional)
export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
});

// Schema principal da beneficiária
export const beneficiariaSchema = z.object({
  id: z.number().optional(),
  // ÚNICO CAMPO OBRIGATÓRIO
  nome_completo: z
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres"),

  // Opcionais
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const cpfLimpo = val.replace(/\D/g, "");
        return cpfLimpo.length === 11;
      },
      { message: "CPF deve conter 11 dígitos numéricos" },
    ),

  data_nascimento: z.string().optional(),

  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),

  endereco: enderecoSchema,

  perfil_socioeconomico: z.string().optional(),

  // Campos de Dados Sociais e Proteção
  recebe_bolsa_familia: z.boolean().optional(),
  recebe_bpc: z.boolean().optional(),
  possui_medida_protetiva: z.boolean().optional(),
});

// Tipos TypeScript derivados dos schemas
export type Beneficiaria = z.infer<typeof beneficiariaSchema>;
export type BeneficiariaFormValues = z.input<typeof beneficiariaSchema>;
export type Contato = z.infer<typeof contatoSchema>;
export type Endereco = z.infer<typeof enderecoSchema>;

// Schema para registrar entregas de benefícios vinculadas à beneficiária
export const entregaBeneficioSchema = z.object({
  beneficiaria: z.coerce.number().int().positive("Beneficiária é obrigatória"),
  beneficio: z.coerce.number().int().positive("Benefício é obrigatório"),
  data_entrega: z
    .string()
    .min(1, "Data de entrega é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  quantidade: z.coerce
    .number()
    .int()
    .positive("Quantidade deve ser maior que 0")
    .default(1),
  observacao: z.string().optional(),
});
