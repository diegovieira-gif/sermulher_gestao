import { z } from "zod";

// --- CATEGORIA ---
export const categoriaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens (sem espaços)"),
  icone: z.string().optional(),
  cor_hex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Formato de cor hexadecimal inválido (ex: #FFFFFF)")
    .optional()
    .or(z.literal("")),
  ordem: z.coerce.number().optional(),
  status: z.enum(["published", "draft"]),
});

export type CategoriaFormValues = z.infer<typeof categoriaSchema>;


// --- SERVIÇO ---
export const servicoSchema = z.object({
  titulo: z.string().min(2, "O título deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens (sem espaços)"),
  descricao_curta: z
    .string()
    .max(255, "A descrição curta deve ter no máximo 255 caracteres")
    .optional(),
  documentos_necessarios: z.string().optional(),
  endereco_mapa: z
    .string()
    .url("O endereço/mapa deve ser uma URL válida")
    .optional()
    .or(z.literal("").or(z.string())), // Allow generic string or URL since "url/string" was mentioned
  horario_atendimento: z.string().optional(),
  link_externo_acao: z
    .string()
    .url("O link para ação deve ser uma URL válida")
    .optional()
    .or(z.literal("")),
  categoria_id: z.string().uuid("O ID da categoria deve ser um UUID válido"),
  status: z.enum(["published", "draft"]),
});

export type ServicoFormValues = z.infer<typeof servicoSchema>;


// --- CAMPANHA ---
export const campanhaSchema = z.object({
  titulo: z.string().min(2, "O título deve ter pelo menos 2 caracteres"),
  imagem_capa: z
    .string()
    .uuid("A imagem deve ser um UUID válido do Directus")
    .optional()
    .or(z.literal("")),
  link_destino: z
    .string()
    .url("O link de destino deve ser uma URL válida")
    .optional()
    .or(z.literal("")),
  data_inicio: z
    .string()
    .datetime({ message: "A data de início deve ser uma data válida" })
    .optional()
    .or(z.literal(""))
    .or(z.date()),
  data_fim: z
    .string()
    .datetime({ message: "A data de fim deve ser uma data válida" })
    .optional()
    .or(z.literal(""))
    .or(z.date()),
  status: z.enum(["published", "draft"]),
});

export type CampanhaFormValues = z.infer<typeof campanhaSchema>;
