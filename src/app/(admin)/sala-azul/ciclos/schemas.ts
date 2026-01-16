import { z } from "zod";

// --- ENUMS ---

export enum StatusSala {
  PLANEJADA = "Planejada",
  EM_ANDAMENTO = "Em Andamento",
  FINALIZADA = "Finalizada",
}

export enum StatusParticipacao {
  CURSANDO = "Cursando",
  CONCLUIDO_COM_EXITO = "Concluído com Êxito",
  REPROVADO = "Reprovado",
  EVADIDO = "Evadido",
}

// --- SCHEMAS DE CICLOS ---

export const insertSalaSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(3, "Nome obrigatório"),
  local_id: z.coerce.number({ invalid_type_error: "Selecione o local" }).positive("Selecione o local"),
  data_inicio: z.string().min(1, "Data obrigatória"),
  data_fim: z.string().min(1, "Data obrigatória"),
  status: z.string().default(StatusSala.PLANEJADA),
  facilitador: z.string().optional(),
});

export type InsertSala = z.infer<typeof insertSalaSchema>;

// --- SCHEMAS DE PARTICIPANTES ---

export const addParticipanteSchema = z.object({
  infrator: z.number().int("ID do infrator é obrigatório"),
  sala: z.number().int("ID da sala é obrigatório"),
  // CORREÇÃO: Removido o segundo argumento { errorMap... } que estava depreciado
  status_participacao: z
    .nativeEnum(StatusParticipacao)
    .default(StatusParticipacao.CURSANDO),
});

export const updateParticipacaoSchema = z.object({
  frequencia_percentual: z
    .number()
    .int("Frequência deve ser um número inteiro")
    .min(0, "Frequência não pode ser negativa")
    .max(100, "Frequência não pode ser maior que 100")
    .optional(),
  // CORREÇÃO: Removido o segundo argumento { errorMap... }
  status_participacao: z.nativeEnum(StatusParticipacao).optional(),
  parecer_psicologico: z.string().optional(),
});

export type AddParticipanteData = z.infer<typeof addParticipanteSchema>;
export type UpdateParticipacaoData = z.infer<typeof updateParticipacaoSchema>;