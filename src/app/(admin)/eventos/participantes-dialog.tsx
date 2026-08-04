"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import {
  getBeneficiariasParaEvento,
  getParticipantesEvento,
  registrarParticipanteEvento,
  removerParticipanteEvento,
  type BeneficiariaParaEvento,
  type ParticipanteEvento,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const formatarData = (valor?: string | null) => {
  if (!valor) return "—";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : String(valor);
};

const formatarCpf = (cpf?: string | null) => {
  if (!cpf) return "";
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const hoje = () => new Date().toISOString().slice(0, 10);

interface ParticipantesDialogProps {
  evento: { id: number; nome: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParticipantesDialog({
  evento,
  open,
  onOpenChange,
}: ParticipantesDialogProps) {
  /**
   * Dados carregados, junto do evento a que pertencem.
   *
   * Guardar o `eventoId` aqui dentro permite DERIVAR o estado de carregamento
   * (`dados` ainda não é deste evento → está carregando), em vez de chamar
   * `setCarregando(true)` dentro do efeito. Também evita exibir por um instante
   * a lista do evento anterior ao abrir outro.
   */
  const [dados, setDados] = useState<{
    eventoId: number;
    participantes: ParticipanteEvento[];
    beneficiarias: BeneficiariaParaEvento[];
  } | null>(null);

  const [salvando, startSalvamento] = useTransition();
  const [paraRemover, setParaRemover] = useState<ParticipanteEvento | null>(null);

  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [dataParticipacao, setDataParticipacao] = useState(hoje());

  const eventoId = evento?.id ?? null;
  const carregado = dados !== null && dados.eventoId === eventoId;
  const carregando = open && eventoId !== null && !carregado;

  const participantes = carregado ? dados.participantes : [];
  const beneficiarias = carregado ? dados.beneficiarias : [];

  useEffect(() => {
    if (!open || !eventoId) return;

    let cancelado = false;

    Promise.all([
      getParticipantesEvento(eventoId),
      getBeneficiariasParaEvento(),
    ]).then(([resParticipantes, resBeneficiarias]) => {
      if (cancelado) return;
      if (!resParticipantes.success) {
        toast.error(resParticipantes.error || "Erro ao carregar participantes.");
      }
      setDados({
        eventoId,
        participantes: resParticipantes.data ?? [],
        beneficiarias: resBeneficiarias.data ?? [],
      });
    });

    return () => {
      cancelado = true;
    };
  }, [open, eventoId]);

  // Quem já está no evento não deve aparecer na busca para adicionar.
  const jaRegistradas = new Set(
    participantes.map((p) => p.beneficiaria?.id).filter(Boolean),
  );

  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, "");
  const sugestoes = termo
    ? beneficiarias
        .filter((b) => !jaRegistradas.has(b.id))
        .filter((b) => {
          const nome = b.nome_completo?.toLowerCase() ?? "";
          const cpf = b.cpf?.replace(/\D/g, "") ?? "";
          return nome.includes(termo) || (digitos !== "" && cpf.includes(digitos));
        })
        .slice(0, 8)
    : [];

  const recarregar = async () => {
    if (!eventoId) return;
    const res = await getParticipantesEvento(eventoId);
    if (!res.success) return;
    setDados((atual) => ({
      eventoId,
      participantes: res.data ?? [],
      beneficiarias: atual?.beneficiarias ?? [],
    }));
  };

  const adicionar = () => {
    if (!eventoId || !selecionada) {
      toast.error("Selecione uma beneficiária.");
      return;
    }
    startSalvamento(async () => {
      const res = await registrarParticipanteEvento({
        evento: eventoId,
        beneficiaria: selecionada,
        data_participacao: dataParticipacao,
      });
      if (res.success) {
        toast.success("Participação registrada.");
        setBusca("");
        setSelecionada(null);
        await recarregar();
      } else {
        toast.error(res.error || "Erro ao registrar.");
      }
    });
  };

  const confirmarRemocao = () => {
    if (!paraRemover) return;
    startSalvamento(async () => {
      const res = await removerParticipanteEvento(paraRemover.id);
      if (res.success) {
        toast.success("Participação removida.");
        setParaRemover(null);
        await recarregar();
      } else {
        toast.error(res.error || "Erro ao remover.");
      }
    });
  };

  const nomeSelecionada = beneficiarias.find((b) => b.id === selecionada)?.nome_completo;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Participantes
            </DialogTitle>
            <DialogDescription>
              {evento?.nome}
              {!carregando && (
                <>
                  {" · "}
                  <strong>{participantes.length}</strong>{" "}
                  {participantes.length === 1 ? "participante" : "participantes"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Registrar participação */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="busca-beneficiaria">Beneficiária</Label>
                <Input
                  id="busca-beneficiaria"
                  value={selecionada ? (nomeSelecionada ?? "") : busca}
                  placeholder="Buscar por nome ou CPF..."
                  onChange={(event) => {
                    setSelecionada(null);
                    setBusca(event.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-participacao">Data</Label>
                <Input
                  id="data-participacao"
                  type="date"
                  value={dataParticipacao}
                  onChange={(event) => setDataParticipacao(event.target.value)}
                />
              </div>
              <Button type="button" onClick={adicionar} disabled={salvando || !selecionada}>
                {salvando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Registrar
              </Button>
            </div>

            {sugestoes.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-md border bg-popover">
                {sugestoes.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelecionada(b.id);
                      setBusca("");
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{b.nome_completo}</span>
                    {b.cpf && (
                      <span className="text-xs text-muted-foreground">
                        CPF: {formatarCpf(b.cpf)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {termo !== "" && sugestoes.length === 0 && !selecionada && (
              <p className="text-xs text-muted-foreground">
                Nenhuma beneficiária encontrada — ou ela já está registrada neste evento.
              </p>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[45vh] overflow-auto rounded-md border">
            {carregando ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando participantes…
              </div>
            ) : participantes.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma participação registrada neste evento ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiária</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[70px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          {p.beneficiaria?.id ? (
                            <Link
                              href={`/mulheres/beneficiarias/${p.beneficiaria.id}`}
                              className="font-medium hover:underline"
                            >
                              {p.beneficiaria.nome_completo ?? "Sem nome"}
                            </Link>
                          ) : (
                            <span className="font-medium text-muted-foreground">
                              Beneficiária removida
                            </span>
                          )}
                          {p.beneficiaria?.cpf && (
                            <span className="text-xs text-muted-foreground">
                              CPF: {formatarCpf(p.beneficiaria.cpf)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatarData(p.data_participacao)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remover participação"
                          onClick={() => setParaRemover(p)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                          <span className="sr-only">Remover participação</span>
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
            <AlertDialogTitle>Remover participação?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>
                {paraRemover?.beneficiaria?.nome_completo ?? "Esta beneficiária"}
              </strong>{" "}
              deixará de constar como participante de {evento?.nome}. O cadastro dela
              não é afetado.
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
