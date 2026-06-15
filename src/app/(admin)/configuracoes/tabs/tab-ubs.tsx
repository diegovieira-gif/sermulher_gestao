"use client";

import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem } from "../actions";
import { ubsSchema } from "../schemas";
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

interface TabUbsProps {
  data: any[];
}

export function TabUbs({ data }: TabUbsProps) {
  const columns = [
    { key: "nome", label: "Nome" },
    { key: "endereco", label: "Endereço" },
    { key: "telefone", label: "Telefone" },
    {
      key: "status",
      label: "Status",
      render: (item: any) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            item.status === "published"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100"
          }`}
        >
          {item.status === "published" ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ];

  return (
    <GenericCrudTable
      title="Unidades Básicas de Saúde (UBS)"
      description="Gerencie o cadastro de Unidades Básicas de Saúde."
      items={data}
      type="ubs"
      columns={columns}
      onSave={(v) => saveAuxItem("config_ubs", v)}
      onDelete={(id) => deleteAuxItem("config_ubs", id)}
      formSchema={ubsSchema}
      renderFormFields={(form: any) => (
        <>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
