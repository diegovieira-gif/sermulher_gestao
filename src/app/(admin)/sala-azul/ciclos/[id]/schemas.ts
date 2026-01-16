import { z } from "zod";

// Enum para Status de Participação
export enum StatusParticipacao {
  CURSANDO = "Cursando",
  CONCLUIDO_COM_EXITO = "Concluído com Êxito",
  REPROVADO = "Reprovado",
  EVADIDO = "Evadido",
}

// Schema para adicionar participante
export const addParticipanteSchema = z.object({
  infrator: z.number().int("ID do infrator é obrigatório"),
  sala: z.number().int("ID da sala é obrigatório"),
  status_participacao: z
    .nativeEnum(StatusParticipacao)
    .default(StatusParticipacao.CURSANDO),
});

// Schema para atualizar participação
export const updateParticipacaoSchema = z.object({
  frequencia_percentual: z
    .number()
    .int("Frequência deve ser um número inteiro")
    .min(0, "Frequência não pode ser negativa")
    .max(100, "Frequência não pode ser maior que 100")
    .optional(),
  status_participacao: z.nativeEnum(StatusParticipacao).optional(),
  parecer_psicologico: z.string().optional(),
});

// Schema para criar/editar sessão
export const sessaoSchema = z.object({
  id: z.number().int().optional(),
  data: z
    .string()
    .min(1, "Data é obrigatória")
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Data inválida" }
    ),
  tema: z.string().min(1, "Tema é obrigatório").max(255, "Tema muito longo"),
  relatorio: z.string().optional(),
  sala_id: z.number().int("ID da sala é obrigatório"),
});

// Tipos TypeScript derivados dos schemas
export type AddParticipanteData = z.infer<typeof addParticipanteSchema>;
export type UpdateParticipacaoData = z.infer<typeof updateParticipacaoSchema>;
export type AddParticipanteFormValues = z.input<typeof addParticipanteSchema>;
export type UpdateParticipacaoFormValues = z.input<typeof updateParticipacaoSchema>;
export type SessaoData = z.infer<typeof sessaoSchema>;
export type SessaoFormValues = z.input<typeof sessaoSchema>;
