import { z } from "zod";

// Schema para o objeto de contato
export const contatoSchema = z.object({
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

// Schema para o objeto de endereço
export const enderecoSchema = z.object({
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  cep: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
});

// Schema principal da beneficiária
export const beneficiariaSchema = z.object({
  id: z.number().optional(),
  nome_completo: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .regex(/^\d{11}$/, "CPF deve conter apenas números"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  contato: contatoSchema,
  endereco: enderecoSchema,
  tags: z.array(z.string()).optional().default([]),
});

// Tipos TypeScript derivados dos schemas
export type Beneficiaria = z.infer<typeof beneficiariaSchema>;
export type Contato = z.infer<typeof contatoSchema>;
export type Endereco = z.infer<typeof enderecoSchema>;
