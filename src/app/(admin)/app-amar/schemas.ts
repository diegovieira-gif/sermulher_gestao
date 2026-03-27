import { z } from "zod";

// --- CATEGORIA ---
export const categoriaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .regex(
      /^[a-z0-9-]+$/,
      "O slug deve conter apenas letras minúsculas, números e hifens (sem espaços)",
    ),
  icone: z.string().optional(),
  cor_hex: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Formato de cor hexadecimal inválido (ex: #FFFFFF)",
    )
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
    .regex(
      /^[a-z0-9-]+$/,
      "O slug deve conter apenas letras minúsculas, números e hifens (sem espaços)",
    ),
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
  titulo: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  url_instagram: z
    .string()
    .url("A URL deve ser válida")
    .regex(
      /instagram\.com\/(?:p|reel)\//i,
      "Insira um link válido de uma postagem do Instagram (contendo instagram.com/p/ ou /reel/)",
    )
    .min(1, "A URL do Instagram é obrigatória"),
  status: z.enum(["published", "draft"]),
});

export type CampanhaFormValues = z.infer<typeof campanhaSchema>;

// --- SONHO ---
export const sonhoSchema = z.object({
  nome: z.string().optional(),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  audio: z.string().uuid().optional(),
});

export type SonhoFormValues = z.infer<typeof sonhoSchema>;

// --- CURSO ---
export const cursoSchema = z.object({
  status: z.string().min(1, "O status é obrigatório"),
  titulo: z.string().min(1, "O título é obrigatório"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  categoria: z.string().min(1, "A categoria é obrigatória"),
  imagem_capa: z.string().min(1, "A imagem de capa é obrigatória"),
  carga_horaria: z.coerce.number({
    invalid_type_error: "A carga horária deve ser numérica",
  }),
  instrutor: z.string().min(1, "O instrutor é obrigatório"),
  user_created: z.string().min(1, "O usuário criador é obrigatório"),
  date_created: z.string().min(1, "A data de criação é obrigatória"),
});

export type CursoFormValues = z.infer<typeof cursoSchema>;

// --- CONTATO ---
export const contatoSchema = z.object({
  status: z.string().min(1, "O status é obrigatório"),
  nome: z.string().min(1, "O nome é obrigatório"),
  email: z
    .string()
    .min(1, "O e-mail é obrigatório")
    .email("Informe um e-mail válido"),
  telefone: z.string().min(1, "O telefone é obrigatório"),
  mensagem: z.string().min(1, "A mensagem é obrigatória"),
  lido: z.boolean(),
  date_created: z.string().min(1, "A data de criação é obrigatória"),
});

export type ContatoFormValues = z.infer<typeof contatoSchema>;

// --- PROJETO ---
export const projetoSchema = z.object({
  status: z.string().min(1, "O status é obrigatório"),
  titulo: z.string().min(1, "O título é obrigatório"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  conteudo: z.string().min(1, "O conteúdo é obrigatório"),
  imagem_capa: z.string().min(1, "A imagem de capa é obrigatória"),
  user_created: z.string().min(1, "O usuário criador é obrigatório"),
  date_created: z.string().min(1, "A data de criação é obrigatória"),
});

export type ProjetoFormValues = z.infer<typeof projetoSchema>;
