"use client";

import { useEffect, useState, useCallback } from "react";
import { GenericCrudTable } from "../generic-crud-table";
import {
  getCampanhas,
  saveCampanha,
  deleteCampanha,
  type Campanha,
} from "./actions";
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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function CampanhasPage() {
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await getCampanhas();
    if (res.success) setItems(res.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <p className="text-muted-foreground">
          Cadastre e padronize campanhas temáticas (ex: Outubro Rosa).
        </p>
      </div>

      <GenericCrudTable
        collectionName="config_campanhas"
        title="Campanha"
        items={items}
        hasColorField={true}
        showStatus={false}
        columns={[
          { key: "nome", label: "Nome" },
          { key: "mes", label: "Mês de Referência" },
          {
            key: "cor",
            label: "Cor",
            render: (item) => (
              <div className="flex items-center gap-2">
                {item.cor && (
                  <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ backgroundColor: item.cor }}
                  />
                )}
                <span>{item.cor || "-"}</span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (item) => (
              <Badge
                variant={
                  !item.status || item.status === "ativo"
                    ? "default"
                    : "secondary"
                }
                className={
                  !item.status || item.status === "ativo"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                {!item.status || item.status === "ativo" ? "Ativo" : "Inativo"}
              </Badge>
            ),
          },
        ]}
        // Mapeia para valores do formulário ao editar
        mapItemToFormValues={(item) => ({
          id: item.id,
          nome: item.nome || "",
          mes: item.mes || "",
          cor: item.cor || "#000000",
          status: item.status || "ativo",
        })}
        // Schema específico para campanhas
        formSchema={undefined}
        // Campos customizados do formulário (Nome, Mês, Cor, Status)
        renderFormFields={(form: any) => (
          <>
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Outubro Rosa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        {...field}
                      />
                    </FormControl>
                    <Input
                      placeholder="#ff69b4"
                      {...field}
                      className="flex-1"
                    />
                  </div>
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
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        // Persistência customizada com reload de lista
        onSave={async (values) => {
          const res = await saveCampanha(values as Campanha);
          if (res.success) await load();
          return res as any;
        }}
        onDelete={async (id: number) => {
          const res = await deleteCampanha(id);
          if (res.success) await load();
          return res as any;
        }}
        defaultValues={{ nome: "", mes: "", cor: "#ff69b4", status: "ativo" }}
      />
    </div>
  );
}
