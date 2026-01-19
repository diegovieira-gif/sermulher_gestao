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
import { BarChart3, Eye, TrendingUp } from "lucide-react";
import { z } from "zod";
import { deleteMarketingItem, saveMarketingItem } from "./actions";

// Tipo para os itens
interface MarketingItem {
  id?: number;
  titulo: string;
  data_publicacao: string;
  plataforma: string;
  link?: string;
  alcance?: number;
  interacoes?: number;
  campanha?: string;
}

// Labels e cores das plataformas
const PLATAFORMA_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  site: "Site/Blog",
  jornal: "Jornal/Revista",
  midia_tradicional: "TV/Rádio",
  outros: "Outros",
};

const PLATAFORMA_COLOR: Record<string, string> = {
  instagram: "bg-pink-600 hover:bg-pink-700 text-white",
  facebook: "bg-blue-600 hover:bg-blue-700 text-white",
  linkedin: "bg-sky-700 hover:bg-sky-800 text-white",
  site: "bg-gray-700 hover:bg-gray-800 text-white",
  jornal: "bg-slate-600 hover:bg-slate-700 text-white",
  midia_tradicional: "bg-orange-600 hover:bg-orange-700 text-white",
  outros: "bg-purple-600 hover:bg-purple-700 text-white",
};

// Schema do formulário
const marketingFormSchema = z.object({
  id: z.number().optional(),
  titulo: z.string().min(2, "Título é obrigatório"),
  data_publicacao: z.string().min(1, "Data de publicação é obrigatória"),
  plataforma: z.enum([
    "instagram",
    "facebook",
    "linkedin",
    "site",
    "jornal",
    "midia_tradicional",
    "outros"
  ]),
  link: z.string().optional(),
  alcance: z.coerce.number().int().min(0).optional(),
  interacoes: z.coerce.number().int().min(0).optional(),
  campanha: z.string().optional(),
});

const defaultFormValues = {
  titulo: "",
  data_publicacao: "",
  plataforma: "instagram" as const,
  link: "",
  alcance: 0,
  interacoes: 0,
  campanha: "",
};

function dateOnly(v?: string | null) {
  if (!v) return "";
  const d = String(v);
  return d.length >= 10 ? d.slice(0, 10) : d;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

interface MarketingClientProps {
  items: MarketingItem[];
  stats: {
    postsMes: number;
    alcanceMes: number;
    interacoesMes: number;
  };
}

export function MarketingClient({ items, stats }: MarketingClientProps) {
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Publicações do Mês */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Publicações (Mês)
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.postsMes}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Alcance Total */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Alcance Total (Mês)
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.alcanceMes.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Interações Totais */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Interações (Mês)
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.interacoesMes.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela CRUD */}
      <GenericCrudTable
        collectionName="marketing_items"
        title="Gestão de Publicações"
        items={items}
        showStatus={false}
        formSchema={marketingFormSchema}
        defaultValues={defaultFormValues}
        mapItemToFormValues={(item) => ({
          id: item.id ? Number(item.id) : undefined,
          titulo: item.titulo || "",
          data_publicacao: dateOnly(item.data_publicacao),
          plataforma: (item.plataforma as any) || "instagram",
          link: item.link || "",
          alcance: item.alcance ? Number(item.alcance) : 0,
          interacoes: item.interacoes ? Number(item.interacoes) : 0,
          campanha: item.campanha || "",
        })}
        onSave={async (values) => {
          return await saveMarketingItem(values);
        }}
        onDelete={async (id) => {
          return await deleteMarketingItem(id);
        }}
        columns={[
          {
            header: "Data",
            accessorKey: "data_publicacao",
            cell: (item) => (
              <span className="font-medium">{formatDate(item.data_publicacao)}</span>
            ),
          },
          {
            header: "Título",
            accessorKey: "titulo",
            cell: (item) => (
              <div className="max-w-md">
                <p className="truncate font-medium">{item.titulo}</p>
              </div>
            ),
          },
          {
            header: "Plataforma",
            accessorKey: "plataforma",
            cell: (item) => (
              <Badge
                className={
                  PLATAFORMA_COLOR[item.plataforma || "outros"] ||
                  "bg-gray-600 hover:bg-gray-700"
                }
              >
                {PLATAFORMA_LABEL[item.plataforma || "outros"] || "N/A"}
              </Badge>
            ),
          },
          {
            header: "Alcance",
            accessorKey: "alcance",
            cell: (item) => (
              <span className="text-gray-700">
                {item.alcance ? item.alcance.toLocaleString("pt-BR") : "-"}
              </span>
            ),
          },
          {
            header: "Campanha",
            accessorKey: "campanha",
            cell: (item) => (
              <span className="text-gray-600">{item.campanha || "-"}</span>
            ),
          },
        ]}
        renderFormFields={(form) => (
          <>
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lançamento da campanha..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_publicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Publicação *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plataforma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plataforma *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="site">Site/Blog</SelectItem>
                        <SelectItem value="jornal">Jornal/Revista</SelectItem>
                        <SelectItem value="midia_tradicional">TV/Rádio</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="campanha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campanha</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Outubro Rosa, Institucional..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (URL)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="alcance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alcance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 1500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interações</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Ex: 250"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}
