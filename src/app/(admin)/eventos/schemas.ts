import { z } from "zod";

// Schema Zod para inserção/atualização de evento
export const insertEventoSchema = z
  .object({
    id: z.number().optional(),
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    tipo_id: z.coerce.number().positive({ message: "Selecione o tipo" }),
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
    data_fim: z
      .string()
      .min(1, "Data de fim é obrigatória")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Data de fim inválida" }
      ),
    descricao: z.string().optional(),
    recorrencia: z.enum(["nao_recorrente", "mensal", "anual"]).optional(),
    tipo: z.enum(["campanha", "evento", "roda_conversa", "curso"]).optional(),
    local: z.string().optional(),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.data_inicio);
      const fim = new Date(data.data_fim);
      return fim >= inicio;
    },
    {
      message: "Data de fim não pode ser menor que a data de início",
      path: ["data_fim"],
    }
  );

// Enums para opções de select
export const tipoEventoEnum = [
  { value: "campanha", label: "Campanha" },
  { value: "evento", label: "Evento" },
  { value: "roda_conversa", label: "Roda de Conversa" },
  { value: "curso", label: "Curso" },
] as const;

export const recorrenciaEnum = [
  { value: "nao_recorrente", label: "Não recorrente" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;

/**
 * Vínculo entre um evento e uma servidora/servidor que atuou nele.
 *
 * O usuário vem de `directus_users` — são as contas que já existem no sistema,
 * não um cadastro paralelo — por isso o id é UUID, e não o inteiro dos demais
 * relacionamentos do projeto.
 */
export const membroEquipeEventoSchema = z.object({
  evento: z.coerce.number().positive({ message: "Evento inválido." }),
  usuario: z
    .string()
    .uuid({ message: "Selecione uma pessoa da equipe." }),
});

export type MembroEquipeEventoInput = z.infer<typeof membroEquipeEventoSchema>;

// Tipos TypeScript derivados dos schemas
export type Evento = z.infer<typeof insertEventoSchema>;
export type EventoFormValues = z.input<typeof insertEventoSchema>;
export type TipoEvento = typeof tipoEventoEnum[number]["value"];
export type Recorrencia = typeof recorrenciaEnum[number]["value"];
