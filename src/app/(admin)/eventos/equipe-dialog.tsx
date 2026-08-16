"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Briefcase, Loader2, Plus, Trash2 } from "lucide-react";
import {
  getEquipeEvento,
  getUsuariosParaEquipe,
  registrarMembroEquipe,
  removerMembroEquipe,
  type MembroEquipe,
  type UsuarioParaEquipe,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EquipeDialogProps {
  evento: { id: number; nome: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const nomeDoMembro = (m: MembroEquipe): string => {
  if (!m.usuario) return "Usuário removido";
  const nome = [m.usuario.first_name, m.usuario.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return nome || m.usuario.email || "Usuário sem nome";
};

/**
 * Equipe que atuou no evento — servidoras vindas de `directus_users`.
 *
 * Espelha o diálogo de participantes, mas com dropdown em vez de busca: o
 * quadro de pessoal é pequeno e finito, então uma lista fechada é mais rápida
 * do que digitar, e elimina o erro de escrever o nome errado.
 */
export function EquipeDialog({ evento, open, onOpenChange }: EquipeDialogProps) {
  // Guardar o `eventoId` junto dos dados permite derivar o carregamento e não
  // exibir por um instante a equipe do evento anterior ao abrir outro.
  const [dados, setDados] = useState<{
    eventoId: number;
    equipe: MembroEquipe[];
    usuarios: UsuarioParaEquipe[];
  } | null>(null);

  const [salvando, startSalvamento] = useTransition();
  const [paraRemover, setParaRemover] = useState<MembroEquipe | null>(null);
  const [selecionado, setSelecionado] = useState<string>("");

  const eventoId = evento?.id ?? null;
  const carregado = dados !== null && dados.eventoId === eventoId;
  const carregando = open && eventoId !== null && !carregado;

  const equipe = carregado ? dados.equipe : [];
  const usuarios = carregado ? dados.usuarios : [];

  useEffect(() => {
    if (!open || !eventoId) return;

    let cancelado = false;

    Promise.all([getEquipeEvento(eventoId), getUsuariosParaEquipe()]).then(
      ([resEquipe, resUsuarios]) => {
        if (cancelado) return;
        if (!resEquipe.success) {
          toast.error(resEquipe.error || "Erro ao carregar a equipe.");
        }
        setDados({
          eventoId,
          equipe: resEquipe.data ?? [],
          usuarios: resUsuarios.data ?? [],
        });
      },
    );

    return () => {
      cancelado = true;
    };
  }, [open, eventoId]);

  // Limpa a seleção ao trocar de evento — senão o nome escolhido no evento
  // anterior continuaria no campo.
  useEffect(() => {
    setSelecionado("");
  }, [eventoId]);

  // Quem já está na equipe sai do dropdown: evita a tentativa de duplicar,
  // que o servidor recusaria de qualquer forma.
  const jaNaEquipe = new Set(equipe.map((m) => m.usuario?.id).filter(Boolean));
  const disponiveis = usuarios.filter((u) => !jaNaEquipe.has(u.id));

  const recarregar = async () => {
    if (!eventoId) return;
    const res = await getEquipeEvento(eventoId);
    if (!res.success) return;
    setDados((atual) => ({
      eventoId,
      equipe: res.data ?? [],
      usuarios: atual?.usuarios ?? [],
    }));
  };

  const adicionar = () => {
    if (!eventoId || !selecionado) {
      toast.error("Selecione uma pessoa da equipe.");
      return;
    }
    startSalvamento(async () => {
      const res = await registrarMembroEquipe({
        evento: eventoId,
        usuario: selecionado,
      });
      if (res.success) {
        toast.success("Pessoa adicionada à equipe.");
        setSelecionado("");
        await recarregar();
      } else {
        toast.error(res.error || "Erro ao registrar.");
      }
    });
  };

  const confirmarRemocao = () => {
    if (!paraRemover) return;
    startSalvamento(async () => {
      const res = await removerMembroEquipe(paraRemover.id);
      if (res.success) {
        toast.success("Pessoa removida da equipe.");
        setParaRemover(null);
        await recarregar();
      } else {
        toast.error(res.error || "Erro ao remover.");
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              Equipe do evento
            </DialogTitle>
            <DialogDescription>
              {evento?.nome}
              {!carregando && (
                <>
                  {" · "}
                  <strong>{equipe.length}</strong>{" "}
                  {equipe.length === 1 ? "pessoa" : "pessoas"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Adicionar */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="select-membro-equipe">Servidora ou servidor</Label>
                <Select
                  value={selecionado}
                  onValueChange={setSelecionado}
                  disabled={carregando || disponiveis.length === 0}
                >
                  <SelectTrigger id="select-membro-equipe">
                    <SelectValue
                      placeholder={
                        carregando
                          ? "Carregando..."
                          : disponiveis.length === 0
                            ? "Todos já estão na equipe"
                            : "Selecione pelo nome..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {disponiveis.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={adicionar}
                disabled={salvando || !selecionado}
              >
                {salvando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[45vh] overflow-auto rounded-md border">
            {carregando ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando equipe…
              </div>
            ) : equipe.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma pessoa registrada na equipe deste evento ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[70px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipe.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={
                              m.usuario
                                ? "font-medium"
                                : "font-medium text-muted-foreground"
                            }
                          >
                            {nomeDoMembro(m)}
                          </span>
                          {m.usuario?.email && (
                            <span className="text-xs text-muted-foreground">
                              {m.usuario.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remover da equipe"
                          onClick={() => setParaRemover(m)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                          <span className="sr-only">Remover da equipe</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={paraRemover !== null}
        onOpenChange={(aberto) => !aberto && setParaRemover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{paraRemover ? nomeDoMembro(paraRemover) : "Esta pessoa"}</strong>{" "}
              deixará de constar como equipe de {evento?.nome}. A conta de usuário
              dela não é afetada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmarRemocao();
              }}
              disabled={salvando}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
