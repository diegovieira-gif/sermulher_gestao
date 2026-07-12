import { z } from "zod";

export const contatoSchema = z.object({
  melhor_turno_contato: z.enum(["Manhã", "Tarde"]).optional().nullable(),
});

export const enderecoSchema = z.object({
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
});

export const beneficiariaSchema = z.object({
  // CORREÇÃO: coerce.number transforma "123" em 123
  id: z.coerce.number().optional(),

  nome_completo: z
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres"),

  nome_social: z.string().optional().nullable(),

  cpf: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const cpfLimpo = val.replace(/\D/g, "");
        return cpfLimpo.length === 11;
      },
      "CPF deve conter 11 dígitos numéricos",
    ),

  data_nascimento: z.string().optional().nullable(),

  // Campos demográficos (IDs das tabelas de configuração)
  raca_cor_id: z.coerce.number().optional().nullable(),
  estado_civil_id: z.coerce.number().optional().nullable(),
  escolaridade_id: z.coerce.number().optional().nullable(),
  situacao_trabalho_id: z.coerce.number().optional().nullable(),
  ubs_id: z.coerce.number().optional().nullable(),

  quantidade_filhos: z.coerce.number().min(0).optional().nullable(),

  telefone: z.string().optional().nullable(),
  telefone_validado: z.coerce.boolean().optional(),
  email: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      "Email inválido",
    )
    .optional()
    .nullable(),

  // Json de contato onde o melhor_turno fica
  contato: contatoSchema.optional().nullable(),

  endereco: enderecoSchema,

  numero_cad_unico: z.string().optional().nullable(),

  perfil_socioeconomico: z.string().optional().nullable(),

  // CORREÇÃO: coerce.boolean trata strings de checkbox
  recebe_bolsa_familia: z.coerce.boolean().optional(),
  recebe_bpc: z.coerce.boolean().optional(),
  possui_medida_protetiva: z.coerce.boolean().optional(),
});

// Tipos derivados
export type Beneficiaria = z.infer<typeof beneficiariaSchema>;
export type BeneficiariaFormValues = z.input<typeof beneficiariaSchema>;
export type Contato = z.infer<typeof contatoSchema>;
export type Endereco = z.infer<typeof enderecoSchema>;

export const entregaBeneficioSchema = z.object({
  // Input tipado como number | string: o formulário pode fornecer string e o
  // zod converte para number na validação.
  beneficiaria: z.coerce.number<number | string>().int().positive(),
  beneficio: z.coerce.number<number | string>().int().positive(),
  data_entrega: z.string().min(1),
  quantidade: z.coerce.number<number | string>().int().positive().default(1),
  observacao: z.string().optional(),
});

export type EntregaBeneficioFormInput = z.input<typeof entregaBeneficioSchema>;
export type EntregaBeneficioFormValues = z.infer<typeof entregaBeneficioSchema>;

// Participação em eventos/campanhas (coleção participacoes_evento)
export const participacaoEventoSchema = z.object({
  beneficiaria: z.coerce.number().int().positive(),
  evento: z.coerce.number().int().positive(),
  data_participacao: z.string().min(1),
  observacao: z.string().optional(),
});

// Inscrição/participação em cursos (coleção inscricoes_curso)
export const inscricaoCursoSchema = z.object({
  beneficiaria: z.coerce.number().int().positive(),
  curso: z.coerce.number().int().positive(),
  data_inscricao: z.string().min(1),
  observacao: z.string().optional(),
});

export type ParticipacaoEventoFormInput = z.input<typeof participacaoEventoSchema>;
export type ParticipacaoEventoFormValues = z.infer<typeof participacaoEventoSchema>;
export type InscricaoCursoFormInput = z.input<typeof inscricaoCursoSchema>;
export type InscricaoCursoFormValues = z.infer<typeof inscricaoCursoSchema>;
