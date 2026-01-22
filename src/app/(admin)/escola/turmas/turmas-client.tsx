"use client";

import { useRouter } from "next/navigation";
import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Eye } from "lucide-react";
import { z } from "zod";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { deleteTurma, saveTurma, type TurmaPayload } from "../actions";
import { EscolaCursoDB, EscolaTurmaDB } from "@/types/database";

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

export type Turma = Omit<EscolaTurmaDB, "curso_id"> & {
  curso?: EscolaCursoDB | number | null;
  curso_id?: EscolaCursoDB | number | null;
  curso_nome?: string;
  instrutor?: string;
  vagas?: number;
};

interface TurmasClientProps {
  turmas: Turma[];
  cursosOptions: Array<{ label: string; value: EscolaCursoDB["id"] | string }>;
}

export function TurmasClient({ turmas, cursosOptions }: TurmasClientProps) {
  const router = useRouter();

  return (
    <GenericCrudTable
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
        status: item.status ?? "aberta",
      })}
      onSave={async (values) => saveTurma(values)}
      onDelete={async (id) => deleteTurma(id)}
      columns={[
        {
          key: "nome",
          label: (
            <span className="inline-flex items-center gap-1">
              Nome da Turma
              <InfoTooltip text="Identificação da turma para organização e controle." />
            </span>
          ),
        },
        {
          key: "curso_nome",
          label: (
            <span className="inline-flex items-center gap-1">
              Curso
              <InfoTooltip text="Curso associado a esta turma." />
            </span>
          ),
          render: (item) =>
            item.curso_nome ||
            (typeof item.curso === "object" && item.curso
              ? item.curso.nome
              : undefined) ||
            (typeof item.curso_id === "object" && item.curso_id
              ? item.curso_id.nome
              : undefined) ||
            "—",
        },
        {
          key: "instrutor",
          label: (
            <span className="inline-flex items-center gap-1">
              Instrutor
              <InfoTooltip text="Nome do profissional responsável pela turma." />
            </span>
          ),
        },
        {
          key: "vagas",
          label: (
            <span className="inline-flex items-center gap-1">
              Capacidade Máxima
              <InfoTooltip text="Número máximo de alunos permitidos na turma." />
            </span>
          ),
        },
        {
          key: "status",
          label: (
            <span className="inline-flex items-center gap-1">
              Status
              <InfoTooltip text="Situação atual da turma (Aberta, Em andamento, Concluída, Cancelada)." />
            </span>
          ),
          render: (item) => (
            <Badge className={STATUS_COLOR[item.status || "aberta"] || ""}>
              {STATUS_LABEL[item.status as keyof typeof STATUS_LABEL] ||
                item.status}
            </Badge>
          ),
        },
        {
          key: "detalhes",
          label: (
            <span className="inline-flex items-center gap-1">
              Detalhes
              <InfoTooltip text="Acessar detalhes da turma e gerenciar matrículas." />
            </span>
          ),
          render: (item) => (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/escola/turmas/${item.id}`)}
              title="Ver detalhes e gerenciar matrículas"
            >
              <Eye className="h-4 w-4" />
            </Button>
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
                <FormLabel>
                  Nome da Turma
                  <InfoTooltip text="Identificação da turma para organização e controle." />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Manhã A"
                    {...field}
                    value={field.value ?? ""}
                  />
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
                <FormLabel>
                  Curso
                  <InfoTooltip text="Curso associado a esta turma." />
                </FormLabel>
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
                <FormLabel>
                  Instrutor
                  <InfoTooltip text="Nome do profissional responsável pela turma." />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do instrutor"
                    {...field}
                    value={field.value ?? ""}
                  />
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
                <FormLabel>
                  Vagas
                  <InfoTooltip text="Número máximo de alunos que podem ser matriculados na turma." />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex: 20"
                    value={field.value ?? ""}
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
                  <FormLabel>
                    Data de Início
                    <InfoTooltip text="Data planejada para início das aulas." />
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
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
                  <FormLabel>
                    Data de Fim
                    <InfoTooltip text="Data prevista de encerramento das aulas." />
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
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
                <FormLabel>
                  Status
                  <InfoTooltip text="Situação atual da turma (Planejada, Em Andamento, Finalizada, Cancelada)." />
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
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
