import { z } from "zod";

export const StatusAtendimento = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  ARQUIVADO: "Arquivado",
} as const;

// Schema de Inserção/Edição
export const insertAtendimentoSchema = z.object({
  // CORREÇÃO: Usar coerce.number() pois o valor vem do Select como string mas o banco espera Int
  beneficiaria: z
    .coerce
    .number({ message: "Selecione uma beneficiária" })
    .int({ message: "Selecione uma beneficiária" })
    .positive({ message: "Selecione uma beneficiária" }),

  origem_id: z.coerce.number({ invalid_type_error: "Selecione a origem" }).positive(),

  prioridade_id: z.coerce.number({ invalid_type_error: "Selecione a prioridade" }).positive(),

  // Opcionais
  status: z
    .nativeEnum(StatusAtendimento)
    .optional()
    .default(StatusAtendimento.ABERTO),
  observacao_inicial: z.string().optional(),
});

// Para edição (upsert), permitimos `id` opcional.
// Mantém compatibilidade com ambientes onde `atendimentos.id` é UUID ou Int.
export const upsertAtendimentoSchema = insertAtendimentoSchema.extend({
  id: z
    .union([
      z.string().uuid("ID deve ser um UUID válido"),
      z.coerce
        .number({ message: "ID inválido" })
        .int()
        .positive(),
    ])
    .optional(),
  // Em edição, não aplicamos default para não sobrescrever status existente.
  status: z.nativeEnum(StatusAtendimento).optional(),
});

export type InsertAtendimento = z.infer<typeof insertAtendimentoSchema>;
export type UpsertAtendimento = z.infer<typeof upsertAtendimentoSchema>;

// Tipos úteis para formulários (antes da coerção / vindos do HTML)
export type InsertAtendimentoInput = z.input<typeof insertAtendimentoSchema>;
export type UpsertAtendimentoInput = z.input<typeof upsertAtendimentoSchema>;

// Aliases (compatibilidade com nomes anteriores usados no módulo)
export type InsertAtendimentoForm = InsertAtendimento;
export type UpsertAtendimentoForm = UpsertAtendimento;

