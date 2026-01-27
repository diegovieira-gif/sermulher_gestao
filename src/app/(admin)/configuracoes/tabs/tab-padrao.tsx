"use client";

import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem, ConfigCollection } from "../actions";
import { baseSchema, colorSchema } from "../schemas";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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

interface TabPadraoProps {
  title: string;
  description?: string;
  data: any[];
  collectionName: ConfigCollection; // Nome técnico da coleção para a Action
  type: string; // Tipo string para o GenericCrudTable (compatibilidade)
  hasColor?: boolean;
}

export function TabPadrao({
  title,
  description,
  data,
  collectionName,
  type,
  hasColor = false,
}: TabPadraoProps) {
  const columns = [
    { key: "nome", label: "Nome" },
    ...(hasColor
      ? [
          {
            key: "cor",
            label: "Cor",
            render: (item: any) => (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: item.cor || "#000" }}
                />
                <span className="text-xs font-mono">{item.cor}</span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "status",
      label: "Status",
      render: (item: any) => (
        <span
          className={`px-2 py-1 rounded text-xs ${item.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
        >
          {item.status === "published" ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ];

  return (
    <GenericCrudTable
      title={title}
      description={description}
      items={data}
      type={type}
      columns={columns}
      onSave={(v) => saveAuxItem(collectionName, v)}
      onDelete={(id) => deleteAuxItem(collectionName, id)}
      formSchema={hasColor ? colorSchema : baseSchema}
      // Renderização manual para garantir que todos os campos apareçam na edição
      renderFormFields={(form: any) => (
        <>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasColor && (
            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-2">
                    <Input type="color" className="w-12 p-1 h-10" {...field} />
                    <Input {...field} placeholder="#000000" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Ativo</SelectItem>
                    <SelectItem value="draft">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    />
  );
}
