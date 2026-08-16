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
 * Ordenações oferecidas na aba "Gestão de Eventos".
 *
 * Vive aqui, e não em `actions.ts`, porque um arquivo `"use server"` só pode
 * exportar funções assíncronas — exportar este objeto de lá quebraria o build.
 *
 * A chave é o que vai na URL; o valor é o `sort` do Directus. Manter o mapa
 * fechado impede que um parâmetro arbitrário vire ordenação e evita erro do
 * Directus com campo inexistente.
 */
export const ORDENACOES_EVENTO = {
  data_desc: { rotulo: "Data do evento (mais recente)", sort: ["-data_inicio"] },
  data_asc: { rotulo: "Data do evento (mais antiga)", sort: ["data_inicio"] },
  titulo_asc: { rotulo: "Título (A–Z)", sort: ["nome"] },
  titulo_desc: { rotulo: "Título (Z–A)", sort: ["-nome"] },
  local_asc: { rotulo: "Local (A–Z)", sort: ["local", "-data_inicio"] },
  cadastro_desc: { rotulo: "Cadastrados por último", sort: ["-id"] },
} as const;

export type ChaveOrdenacaoEvento = keyof typeof ORDENACOES_EVENTO;

export const ORDENACAO_PADRAO: ChaveOrdenacaoEvento = "data_desc";

export interface EventosListaQuery {
  page?: number;
  ordenacao?: string;
  tipoId?: number;
  categoria?: string;
  situacao?: string;
  /** Busca por título ou local. */
  busca?: string;
}

export interface EventosListaMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  ordenacao: ChaveOrdenacaoEvento;
}

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
