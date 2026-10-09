import { z } from "zod";

export const baseSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Nome é obrigatório"),
  status: z.string().default("published"),
});

export const colorSchema = baseSchema.extend({
  cor: z.string().optional(),
});

export const encaminhamentoSchema = baseSchema.extend({
  grupo_rma: z.string().min(1, "Grupo RMA é obrigatório"),
});

export const periculosidadeSchema = colorSchema.extend({
  peso: z.coerce.number().optional(),
});

/**
 * Status de `config_campanhas`: o campo no Directus tem as opções
 * "ativo"/"inativo" (padrão "ativo"), e a tela /configuracoes/campanhas usa
 * esses valores. A aba Campanhas da tela principal gravava "published"/"draft"
 * (padrão das outras listas auxiliares) — por isso o mesmo cadastro aparecia
 * numa tela e sumia na outra. Registros antigos são lidos pela equivalência.
 */
export type StatusCampanha = "ativo" | "inativo";
export function normalizarStatusCampanha(valor: unknown): StatusCampanha {
  return valor === "inativo" || valor === "draft" || valor === "archived"
    ? "inativo"
    : "ativo";
}

export const campanhaSchema = colorSchema.extend({
  mes: z.string().min(1, "Mês é obrigatório"),
  status: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? undefined : normalizarStatusCampanha(v)),
    z.enum(["ativo", "inativo"]).default("ativo"),
  ),
});

export const racaCorSchema = baseSchema;
export const estadoCivilSchema = baseSchema;
export const escolaridadeSchema = baseSchema;
export const situacaoTrabalhoSchema = baseSchema;
export const bairroSchema = baseSchema;

export const ubsSchema = baseSchema.extend({
  endereco: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
});
