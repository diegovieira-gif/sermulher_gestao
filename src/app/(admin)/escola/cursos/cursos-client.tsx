"use client";

import { GenericCrudTable } from "@/app/(admin)/configuracoes/generic-crud-table";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteCurso, saveCurso, type CursoPayload } from "../actions";
import { z } from "zod";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const AREA_LABEL: Record<string, string> = {
  beleza: "Beleza",
  gastronomia: "Gastronomia",
  artesanato: "Artesanato",
  tecnologia: "Tecnologia",
  gestao: "Gestão",
  outros: "Outros",
};

const AREA_COLOR: Record<string, string> = {
  beleza: "bg-pink-100 text-pink-800",
  gastronomia: "bg-amber-100 text-amber-800",
  artesanato: "bg-emerald-100 text-emerald-800",
  tecnologia: "bg-blue-100 text-blue-800",
  gestao: "bg-indigo-100 text-indigo-800",
  outros: "bg-slate-100 text-slate-800",
};

const cursoFormSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Informe o nome do curso"),
  area_atuacao: z.enum([
    "beleza",
    "gastronomia",
    "artesanato",
    "tecnologia",
    "gestao",
    "outros",
  ]),
  carga_horaria: z.coerce
    .number()
    .int()
    .positive("A carga horária deve ser maior que zero"),
  ementa: z.string().max(4000, "Ementa muito longa").optional(),
});

const defaultFormValues: CursoPayload = {
  nome: "",
  area_atuacao: "beleza",
  carga_horaria: 40,
  ementa: "",
};

export type Curso = CursoPayload;

interface CursosClientProps {
  cursos: Curso[];
}

export function CursosClient({ cursos }: CursosClientProps) {
  return (
    <GenericCrudTable
      collectionName="escola_cursos"
      title="Catálogo de Cursos"
      items={cursos}
      showStatus={false}
      formSchema={cursoFormSchema}
      defaultValues={defaultFormValues}
      mapItemToFormValues={(item) => ({
        id: item.id ? Number(item.id) : undefined,
        nome: item.nome || "",
        area_atuacao: item.area_atuacao || "outros",
        carga_horaria: item.carga_horaria ? Number(item.carga_horaria) : 0,
        ementa: item.ementa || "",
      })}
      onSave={(values) => saveCurso(values)}
      onDelete={(id) => deleteCurso(id)}
      columns={[
        { key: "nome", label: "Nome" },
        {
          key: "area_atuacao",
          label: "Área de Atuação",
          render: (item) => (
            <Badge className={AREA_COLOR[item.area_atuacao] || "bg-slate-100 text-slate-800"}>
              {AREA_LABEL[item.area_atuacao] || item.area_atuacao}
            </Badge>
          ),
        },
        {
          key: "carga_horaria",
          label: "Carga Horária",
          render: (item) => `${item.carga_horaria || 0}h`,
        },
      ]}
      renderFormFields={(form: any) => (
        <>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome
                  <InfoTooltip text="Nome identificador do curso oferecido." />
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Curso de Inclusão Digital" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_atuacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Área de Atuação
                  <InfoTooltip text="Categoria ou área de conhecimento do curso." />
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beleza">Beleza</SelectItem>
                      <SelectItem value="gastronomia">Gastronomia</SelectItem>
                      <SelectItem value="artesanato">Artesanato</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="gestao">Gestão</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carga_horaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Carga Horária
                  <InfoTooltip text="Total de horas de duração do curso." />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex: 40"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ementa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Ementa
                  <InfoTooltip text="Descrição dos conteúdos e tópicos abordados no curso." />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os tópicos principais do curso"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    />
  );
}
