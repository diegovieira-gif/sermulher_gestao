import { z } from "zod";

export const contatoSchema = z.object({
  telefone: z.string().optional().nullable(),
  email: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Email inválido" },
    )
    .optional()
    .nullable(),
});

export const enderecoSchema = z.object({
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
});

export const beneficiariaSchema = z.object({
  // CORREÇÃO: coerce.number transforma "123" em 123
  id: z.coerce.number().optional(),

  nome_completo: z
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres"),

  cpf: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const cpfLimpo = val.replace(/\D/g, "");
        return cpfLimpo.length === 11;
      },
      { message: "CPF deve conter 11 dígitos numéricos" },
    ),

  data_nascimento: z.string().optional().nullable(),

  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),

  endereco: enderecoSchema,

  perfil_socioeconomico: z.string().optional().nullable(),

  // CORREÇÃO: coerce.boolean trata strings de checkbox
  recebe_bolsa_familia: z.coerce.boolean().optional(),
  recebe_bpc: z.coerce.boolean().optional(),
  possui_medida_protetiva: z.coerce.boolean().optional(),
});

// Tipos derivados
export type Beneficiaria = z.infer<typeof beneficiariaSchema>;
export type BeneficiariaFormValues = z.input<typeof beneficiariaSchema>;
export type Contato = z.infer<typeof contatoSchema>;
export type Endereco = z.infer<typeof enderecoSchema>;

export const entregaBeneficioSchema = z.object({
  beneficiaria: z.coerce.number().int().positive(),
  beneficio: z.coerce.number().int().positive(),
  data_entrega: z.string().min(1),
  quantidade: z.coerce.number().int().positive().default(1),
  observacao: z.string().optional(),
});
