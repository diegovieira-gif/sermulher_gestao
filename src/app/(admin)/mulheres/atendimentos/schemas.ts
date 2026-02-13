import { z } from "zod";

// Enum para Status de Atendimento
export enum StatusAtendimento {
  ABERTO = "Aberto",
  EM_ANDAMENTO = "Em andamento",
  CONCLUIDO = "Concluído",
  ARQUIVADO = "Arquivado",
}

// Schema principal de atendimento (para leitura do banco)
export const atendimentoSchema = z.object({
  id: z.number().optional(),
  beneficiaria: z
    .coerce
    .number({ message: "Selecione uma beneficiária" })
    .int({ message: "ID da beneficiária inválido" })
    .positive({ message: "Selecione uma beneficiária" }),
  origem_id: z
    .coerce
    .number({ message: "Selecione a origem" })
    .int()
    .positive()
    .optional(),
  prioridade_id: z
    .coerce
    .number({ message: "Selecione a prioridade" })
    .int()
    .positive()
    .optional(),
  status: z
    .nativeEnum(StatusAtendimento)
    .default(StatusAtendimento.ABERTO),
  data_abertura: z
    .string()
    .default(() => new Date().toISOString().split("T")[0]),
  encaminhamento_id: z
    .coerce
    .number({ message: "Selecione o encaminhamento" })
    .int()
    .positive()
    .optional(),
  tipos_violencia: z
    .union([
      z.array(z.coerce.number()),
      z.array(z.string()),
      z.string(),
    ])
    .optional(),
  medida_protetiva: z.boolean().default(false),
  gestante_puerpera: z.boolean().default(false),
  boletim_ocorrencia: z.string().optional(),
  necessidades_sociais: z.any().optional(),
  necessidades_juridicas: z.any().optional(),
  avaliacao_risco: z.record(z.string(), z.any()).optional(),
});

// Schema para uso no formulário (trabalha com array)
export const atendimentoFormSchema = z.object({
  id: z.number().optional(),
  beneficiaria: z
    .coerce
    .number({ message: "Selecione uma beneficiária" })
    .int({ message: "ID da beneficiária inválido" })
    .positive({ message: "Selecione uma beneficiária" }),
  origem_id: z
    .coerce
    .number({ message: "Selecione a origem" })
    .int()
    .positive()
    .optional(),
  prioridade_id: z
    .coerce
    .number({ message: "Selecione a prioridade" })
    .int()
    .positive()
    .optional(),
  status: z
    .nativeEnum(StatusAtendimento),
  data_abertura: z
    .string(),
  encaminhamento_id: z
    .coerce
    .number({ message: "Selecione o encaminhamento" })
    .int()
    .positive()
    .optional(),
  tipos_violencia: z.array(z.coerce.number()).optional(),
  medida_protetiva: z.boolean().default(false),
  gestante_puerpera: z.boolean().default(false),
  boletim_ocorrencia: z.string().optional(),
  necessidades_sociais: z.any().optional(),
  necessidades_juridicas: z.any().optional(),
  avaliacao_risco: z.record(z.string(), z.any()).optional(),
});

// Tipos TypeScript derivados dos schemas
export type Atendimento = z.infer<typeof atendimentoSchema>;
export type AtendimentoFormValues = z.infer<typeof atendimentoFormSchema>;
