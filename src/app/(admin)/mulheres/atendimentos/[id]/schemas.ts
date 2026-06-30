import { z } from "zod";

// Enum para Status de Etapa (valores padrão; a lista é configurável via
// coleção config_status_etapa). Mantido para defaults e tipagem do Kanban.
export enum StatusEtapa {
  AGUARDANDO = "Aguardando",
  EM_ATENDIMENTO = "Em atendimento",
  FINALIZADO = "Finalizado",
}

// Schema para validar nova tramitação.
// tipo_demanda e status_etapa são strings livres pois agora vêm de coleções
// configuráveis (config_tipos_demanda / config_status_etapa).
export const tramitacaoSchema = z.object({
  atendimento_pai: z.coerce.number().int().positive("ID do atendimento é obrigatório"),
  tipo_demanda: z.string().min(1, "Selecione o tipo de demanda"),
  setor_responsavel: z.coerce.number().int().positive().optional(),
  relato_tecnico: z
    .string()
    .min(1, "O relato técnico é obrigatório")
    .max(50000, "Relato técnico muito longo"),
  status_etapa: z
    .string()
    .min(1)
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
