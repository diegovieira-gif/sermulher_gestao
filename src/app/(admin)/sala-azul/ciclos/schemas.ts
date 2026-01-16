import { z } from "zod";

// Enum para Status da Sala
export enum StatusSala {
  PLANEJADA = "Planejada",
  EM_ANDAMENTO = "Em Andamento",
  FINALIZADA = "Finalizada",
}

// Schema Zod para inserção/atualização de sala
export const insertSalaSchema = z
  .object({
    id: z.number().optional(),
    nome_ciclo: z.string().min(3, "Nome do ciclo deve ter no mínimo 3 caracteres"),
    data_inicio: z
      .string()
      .min(1, "Data de início é obrigatória")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Data de início inválida" }
      ),
    data_termino: z
      .string()
      .min(1, "Data de término é obrigatória")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Data de término inválida" }
      ),
    status: z.nativeEnum(StatusSala, {
      errorMap: () => ({ message: "Status é obrigatório" }),
    }),
    local_id: z.coerce.number({ invalid_type_error: "Selecione o local" }).positive("Selecione o local"),
    responsavel_tecnico: z.string().uuid("Responsável técnico é obrigatório"),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.data_inicio);
      const termino = new Date(data.data_termino);
      return termino >= inicio;
    },
    {
      message: "Data de término não pode ser anterior à data de início",
      path: ["data_termino"],
    }
  );

// Tipos TypeScript derivados dos schemas
export type Sala = z.infer<typeof insertSalaSchema>;
export type SalaFormValues = z.input<typeof insertSalaSchema>;
