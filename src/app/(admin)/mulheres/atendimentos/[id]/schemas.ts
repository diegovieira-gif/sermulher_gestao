import { z } from "zod";

// Enum para Tipo de Demanda
export enum TipoDemanda {
  JURIDICA = "Jurídica",
  TERAPIA = "Terapia",
  MEDIDA_PROTETIVA = "Medida Protetiva",
  EXAME = "Exame",
}

// Enum para Status de Etapa
export enum StatusEtapa {
  AGUARDANDO = "Aguardando",
  EM_ATENDIMENTO = "Em atendimento",
  FINALIZADO = "Finalizado",
}

// Schema para validar nova tramitação
export const tramitacaoSchema = z.object({
  atendimento_pai: z.coerce.number().int().positive("ID do atendimento é obrigatório"),
  tipo_demanda: z.nativeEnum(TipoDemanda, {
    errorMap: () => ({ message: "Selecione um tipo de demanda válido" }),
  }),
  setor_responsavel: z.coerce.number().int().positive().optional(),
  relato_tecnico: z
    .string()
    .min(1, "O relato técnico é obrigatório")
    .max(50000, "Relato técnico muito longo"),
  status_etapa: z
    .nativeEnum(StatusEtapa)
    .default(StatusEtapa.AGUARDANDO)
    .optional(),
  data_recebimento: z
    .string()
    .default(() => new Date().toISOString())
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Data de recebimento inválida" }
    )
    .optional(),
});

// Tipos TypeScript derivados dos schemas
export type TramitacaoData = z.infer<typeof tramitacaoSchema>;
export type TramitacaoFormValues = z.input<typeof tramitacaoSchema>;
