import { z } from "zod";

// Schema Zod para inserção/atualização de infrator
export const insertInfratorSchema = z.object({
  id: z.number().optional(),
  nome_completo: z
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .regex(/^\d{11}$/, "CPF deve conter apenas números"),
  // Novos Campos
  data_nascimento: z.string().optional().nullable(),
  telefone: z.string().optional(), // Virtual - será salvo dentro de 'contato' (JSON)
  numero_processo: z.string().optional(),
  // Input tipado como number | string: os selects fornecem string e o zod
  // converte para number na validação.
  nivel_id: z.coerce
    .number<number | string>()
    .positive(),
  status_legal_id: z.coerce
    .number<number | string>()
    .positive(),
  tipos_agressao_ids: z
    .array(z.number())
    .min(1, "Selecione pelo menos um tipo"),
});

// Tipos TypeScript derivados dos schemas
export type Infrator = z.infer<typeof insertInfratorSchema>;
export type InfratorFormValues = z.input<typeof insertInfratorSchema>;
export type InsertInfrator = z.infer<typeof insertInfratorSchema>;
