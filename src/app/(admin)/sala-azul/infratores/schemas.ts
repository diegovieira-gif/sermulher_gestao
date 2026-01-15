import { z } from "zod";

// Enum para Nível de Periculosidade
export enum NivelPericulosidade {
  BAIXO = "Baixo",
  MEDIO = "Médio",
  ALTO = "Alto",
  CRITICO = "Crítico",
}

// Enum para Status Legal
export enum StatusLegal {
  EM_CUMPRIMENTO = "Em cumprimento",
  CONCLUIDO = "Concluído",
}

// Opções de Tipo de Agressão
export const TIPOS_AGRESSAO = [
  "Física",
  "Psicológica",
  "Sexual",
  "Patrimonial",
  "Moral",
] as const;

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
  nivel_periculosidade: z.nativeEnum(NivelPericulosidade, {
    errorMap: () => ({ message: "Nível de periculosidade é obrigatório" }),
  }),
  tipo_agressao: z
    .array(z.string())
    .min(1, "Selecione pelo menos um tipo de agressão"),
  status_legal: z.nativeEnum(StatusLegal, {
    errorMap: () => ({ message: "Status legal é obrigatório" }),
  }),
});

// Tipos TypeScript derivados dos schemas
export type Infrator = z.infer<typeof insertInfratorSchema>;
export type InfratorFormValues = z.input<typeof insertInfratorSchema>;
