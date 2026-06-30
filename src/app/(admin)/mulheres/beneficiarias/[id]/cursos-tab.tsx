"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inscricaoCursoSchema,
  type InscricaoCursoFormInput,
  type InscricaoCursoFormValues,
} from "../schemas";
import { registrarInscricaoCurso, deletarInscricaoCurso } from "../actions";
import { GraduationCap, Plus, Trash2, Loader2, Calendar, User } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type HistoricoInscricaoCurso = {
  id: number;
  data_inscricao: string | null;
  observacao?: string | null;
  curso?: { id: number; nome?: string | null; titulo?: string | null } | null;
  user_created?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export type CursoOption = {
  id: number;
  nome?: string | null;
  titulo?: string | null;
};

interface CursosTabProps {
  beneficiariaId: number;
  beneficiariaNome: string;
  cursosOptions: CursoOption[];
  historico: HistoricoInscricaoCurso[];
  canDelete?: boolean;
}

function cursoLabel(curso?: { nome?: string | null; titulo?: string | null } | null) {
  return curso?.nome || curso?.titulo || "-";
}

export function CursosTab({
  beneficiariaId,
  beneficiariaNome,
  cursosOptions,
  historico,
  canDelete = true,
}: CursosTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [historicoState, setHistoricoState] = useState<HistoricoInscricaoCurso[]>(historico);

  const form = useForm<InscricaoCursoFormInput, any, InscricaoCursoFormValues>({
    resolver: zodResolver(inscricaoCursoSchema),
    defaultValues: {
      beneficiaria: beneficiariaId,
      curso: undefined,
      data_inscricao: new Date().toISOString().slice(0, 10),
      observacao: "",
    },
  });

  const cursoOptionsSorted = useMemo(
    () => [...cursosOptions].sort((a, b) => cursoLabel(a).localeCompare(cursoLabel(b))),
    [cursosOptions],
  );

  const handleSubmit = (values: InscricaoCursoFormValues) => {
    startTransition(async () => {
      const payload = { ...values, beneficiaria: beneficiariaId };

      const result = await registrarInscricaoCurso(payload);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível registrar a inscrição.");
        return;
      }

      const novaInscricao = result.data as HistoricoInscricaoCurso;
      setHistoricoState((prev) => [novaInscricao, ...prev]);
      toast.success(result.message ?? "Inscrição registrada");
      form.reset({
        beneficiaria: beneficiariaId,
        curso: undefined,
        data_inscricao: new Date().toISOString().slice(0, 10),
        observacao: "",
      });
      setIsOpen(false);
    });
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id);
      const result = await deletarInscricaoCurso(id, beneficiariaId);
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir inscrição");
        return;
      }
      setHistoricoState((prev) => prev.filter((item) => item.id !== id));
      toast.success("Inscrição removida");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao excluir inscrição");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Beneficiária</p>
            <h3 className="text-lg font-semibold leading-tight">{beneficiariaNome}</h3>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar inscrição em curso</DialogTitle>
              <DialogDescription>
                Informe o curso e a data da inscrição/participação.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="curso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Curso *
                        <InfoTooltip text="Curso do qual a beneficiária participou." />
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursoOptionsSorted.map((curso) => (
                              <SelectItem key={curso.id} value={String(curso.id)}>
                                {cursoLabel(curso)}
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
                  name="data_inscricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da inscrição *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes adicionais (opcional)"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Salvar inscrição
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Data
                <InfoTooltip text="Data da inscrição/participação no curso." />
              </TableHead>
              <TableHead>
                Curso
                <InfoTooltip text="Curso." />
              </TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>
                Registrado por
                <InfoTooltip text="Profissional que registrou a inscrição." />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historicoState.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Nenhum curso registrado para esta beneficiária.
                </TableCell>
              </TableRow>
            ) : (
              historicoState.map((inscricao) => (
                <TableRow key={inscricao.id}>
                  <TableCell>
                    {inscricao.data_inscricao
                      ? new Date(inscricao.data_inscricao).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{cursoLabel(inscricao.curso)}</TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                    {inscricao.observacao || "-"}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {inscricao.user_created
                      ? `${inscricao.user_created.first_name || ""} ${inscricao.user_created.last_name || ""}`.trim() || inscricao.user_created.email || "Usuário do Sistema"
                      : "Sistema / Importação"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            disabled={isDeleting === inscricao.id}
                          >
                            {isDeleting === inscricao.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir inscrição?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação removerá o registro do curso para esta beneficiária.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(inscricao.id)}
                              disabled={isDeleting === inscricao.id}
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-muted-foreground">Sem permissão</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
