import { z } from "zod";

// Enum para Status de Atendimento
export enum StatusAtendimento {
  ABERTO = "Aberto",
  EM_ANDAMENTO = "Em andamento",
  CONCLUIDO = "Concluído",
  ARQUIVADO = "Arquivado",
}

// Schema principal de atendimento
export const atendimentoSchema = z.object({
  id: z.number().optional(),
  beneficiaria: z
    .coerce
    .number({ message: "Selecione uma beneficiária" })
    .int({ message: "ID da beneficiária inválido" })
    .positive({ message: "Selecione uma beneficiária" }),
  origem_id: z
    .coerce
    .number({ invalid_type_error: "Selecione a origem" })
    .int()
    .positive()
    .optional(),
  prioridade_id: z
    .coerce
    .number({ invalid_type_error: "Selecione a prioridade" })
    .int()
    .positive()
    .optional(),
  status: z
    .nativeEnum(StatusAtendimento)
    .default(StatusAtendimento.ABERTO),
  data_abertura: z
    .string()
    .default(() => new Date().toISOString().split("T")[0]),
});

// Tipos TypeScript derivados dos schemas
export type Atendimento = z.infer<typeof atendimentoSchema>;
export type AtendimentoFormValues = z.input<typeof atendimentoSchema>;
