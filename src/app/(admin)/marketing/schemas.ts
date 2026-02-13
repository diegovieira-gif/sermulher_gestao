import { z } from "zod";

export const marketingPostSchema = z
    .object({
        titulo: z.string().min(1, "Título é obrigatório"),
        data_publicacao: z.string().min(1, "Data é obrigatória"), // HTML date input returns string
        canal: z.enum(
            [
                "Site PMA",
                "Site SERMULHER",
                "Instagram",
                "Facebook",
                "Jornal",
                "TV",
                "Rádio",
            ]
        ),
        formato: z
            .enum(["Feed/Post", "Reels", "Stories", "Matéria", "Entrevista"])
            .optional()
            .nullable(),
        alcance: z.coerce.number().optional(), // Coerce to handle string input from forms
        link: z.string().url("URL inválida").optional().or(z.literal("")),
    })
    .refine(
        (data) => {
            if (
                (data.canal === "Instagram" || data.canal === "Facebook") &&
                !data.formato
            ) {
                return false;
            }
            return true;
        },
        {
            message: "Formato é obrigatório para Instagram/Facebook",
            path: ["formato"],
        },
    );

export type MarketingPost = z.infer<typeof marketingPostSchema>;
