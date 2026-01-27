"use client";

import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem } from "../actions";
import { encaminhamentoSchema } from "../schemas";
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
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface TabEncaminhamentosProps {
  data: any[];
}

export function TabEncaminhamentos({ data }: TabEncaminhamentosProps) {
  return (
    <GenericCrudTable
      title="Encaminhamentos"
      description="Destinos para onde as usuárias são encaminhadas."
      items={data}
      type="encaminhamentos"
      columns={[
        { key: "nome", label: "Nome" },
        {
          key: "grupo_rma",
          label: "Grupo RMA",
          render: (item) => (
            <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs">
              {item.grupo_rma?.replace("_", " ") || "-"}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (item) => (
            <span
              className={`px-2 py-1 rounded text-xs ${item.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100"}`}
            >
              {item.status === "published" ? "Ativo" : "Inativo"}
            </span>
          ),
        },
      ]}
      onSave={(v) => saveAuxItem("config_encaminhamentos", v)}
      onDelete={(id) => deleteAuxItem("config_encaminhamentos", id)}
      formSchema={encaminhamentoSchema}
      renderFormFields={(form: any) => (
        <>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Encaminhamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: CRAS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grupo_rma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo RMA</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="assistencia_social">
                      Assistência Social
                    </SelectItem>
                    <SelectItem value="juridico">Jurídico</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="trabalho">Trabalho/Emprego</SelectItem>
                    <SelectItem value="habitacao">Habitação</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Status
                  <InfoTooltip text="Define se está disponível para seleção." />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
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
