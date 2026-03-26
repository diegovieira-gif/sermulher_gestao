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

export const campanhaSchema = colorSchema.extend({
  mes: z.string().min(1, "Mês é obrigatório"),
});

export const racaCorSchema = baseSchema;
export const estadoCivilSchema = baseSchema;
export const escolaridadeSchema = baseSchema;
export const situacaoTrabalhoSchema = baseSchema;
export const bairroSchema = baseSchema;

export const integracaoSchema = baseSchema.extend({
  gemini_api_key: z.string().optional(),
});
