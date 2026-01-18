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
import { z } from "zod";
import { deleteTurma, saveTurma, type TurmaPayload } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  aberta: "bg-green-600 hover:bg-green-700 text-white",
  em_andamento: "bg-blue-600 hover:bg-blue-700 text-white",
  concluida: "bg-gray-600 hover:bg-gray-700 text-white",
  cancelada: "bg-red-600 hover:bg-red-700 text-white",
};

const turmaFormSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Informe o nome da turma"),
  curso: z.coerce.number(),
  instrutor: z.string().min(2, "Informe o instrutor"),
  vagas: z.coerce.number().int().positive("Vagas deve ser maior que zero"),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]),
});

const defaultFormValues: TurmaPayload = {
  nome: "",
  curso: 0,
  instrutor: "",
  vagas: 20,
  data_inicio: "",
  data_fim: "",
  status: "aberta",
};

function dateOnly(v?: string | null) {
  if (!v) return "";
  const d = String(v);
  return d.length >= 10 ? d.slice(0, 10) : d;
}

export interface Turma {
  id?: number;
  nome: string;
  instrutor?: string;
  vagas?: number;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  curso?: any; // pode ser id ou objeto { id, nome }
  curso_nome?: string;
}

interface TurmasClientProps {
  turmas: Turma[];
  cursosOptions: Array<{ label: string; value: number | string }>;
}

export function TurmasClient({ turmas, cursosOptions }: TurmasClientProps) {
  return (
    <GenericCrudTable
      collectionName="escola_turmas"
      title="Gestão de Turmas"
      items={turmas}
      showStatus={false}
      formSchema={turmaFormSchema}
      defaultValues={defaultFormValues}
      mapItemToFormValues={(item) => ({
        id: item.id ? Number(item.id) : undefined,
        nome: item.nome || "",
        curso: item?.curso?.id ?? item?.curso ?? 0,
        instrutor: item.instrutor || "",
        vagas: item.vagas ? Number(item.vagas) : 0,
        data_inicio: dateOnly(item.data_inicio),
        data_fim: dateOnly(item.data_fim),
        status: (item.status as any) || "aberta",
      })}
      onSave={(values) => saveTurma(values)}
      onDelete={(id) => deleteTurma(id)}
      columns={[
        { key: "nome", label: "Nome da Turma" },
        {
          key: "curso_nome",
          label: "Curso",
          render: (item) => item.curso_nome || item?.curso?.nome || "—",
        },
        { key: "instrutor", label: "Instrutor" },
        { key: "vagas", label: "Vagas" },
        {
          key: "status",
          label: "Status",
          render: (item) => (
            <Badge className={STATUS_COLOR[item.status || "aberta"] || ""}>
              {STATUS_LABEL[item.status as keyof typeof STATUS_LABEL] || item.status}
            </Badge>
          ),
        },
      ]}
      renderFormFields={(form: any) => (
        <>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Turma</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Manhã A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="curso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curso</FormLabel>
                <FormControl>
                  <Select
                    value={String(field.value ?? "")}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursosOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
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
            name="instrutor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrutor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do instrutor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vagas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vagas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex: 20"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_fim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
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
