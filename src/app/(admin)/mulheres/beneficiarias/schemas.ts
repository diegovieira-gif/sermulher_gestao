import { z } from "zod";

// Schema para o objeto de contato
export const contatoSchema = z.object({
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z
    .string()
    .refine(
      (val) => {
        // Se vazio ou não preenchido, é válido (opcional)
        if (!val || val.trim() === "") return true;
        // Se preenchido, valida formato de email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Email inválido" }
    )
    .optional(),
});

// Schema para o objeto de endereço
export const enderecoSchema = z.object({
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
});

// Schema principal da beneficiária
export const beneficiariaSchema = z.object({
  id: z.number().optional(),
  nome_completo: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => {
        // Se não preenchido, é válido (opcional)
        if (!val || val.trim() === "") return true;
        // Se preenchido, valida formato (apenas números, 11 dígitos)
        const cpfLimpo = val.replace(/\D/g, "");
        return cpfLimpo.length === 11;
      },
      { message: "CPF deve conter 11 dígitos numéricos" }
    ),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  contato: contatoSchema,
  endereco: enderecoSchema,
  perfil_socioeconomico: z.string().optional(),
  // Novos campos de Dados Sociais e Proteção
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
  quantidade: z.coerce.number().int().positive().default(1),
  observacao: z
    .string()
    .max(500, "Observação muito longa")
    .optional()
    .or(z.literal("")),
});

export type EntregaBeneficioFormValues = z.input<typeof entregaBeneficioSchema>;
