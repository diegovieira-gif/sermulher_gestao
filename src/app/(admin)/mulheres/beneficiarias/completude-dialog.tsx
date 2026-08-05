"use client";

import { CheckCircle2, PhoneOff, Sparkles } from "lucide-react";
import {
  faixaCompletude,
  type ResumoCompletude,
} from "./completude";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Modal mostrado após salvar uma ficha, com o quanto ela está completa e o que
 * falta — ordenado pelo que mais rende.
 *
 * Sem confete, som ou comemoração exagerada: o contexto de uso é o acolhimento
 * de uma mulher que pode estar ao lado da tela, muitas vezes logo após relatar
 * violência. O incentivo aqui é informativo, não festivo.
 */

const CORES: Record<
  ReturnType<typeof faixaCompletude>["nivel"],
  { barra: string; texto: string; fundo: string }
> = {
  completa: {
    barra: "bg-emerald-500",
    texto: "text-emerald-700",
    fundo: "bg-emerald-50 border-emerald-200",
  },
  boa: {
    barra: "bg-teal-500",
    texto: "text-teal-700",
    fundo: "bg-teal-50 border-teal-200",
  },
  parcial: {
    barra: "bg-amber-500",
    texto: "text-amber-700",
    fundo: "bg-amber-50 border-amber-200",
  },
  inicial: {
    barra: "bg-slate-400",
    texto: "text-slate-700",
    fundo: "bg-slate-50 border-slate-200",
  },
};

const ABA_ROTULO: Record<string, string> = {
  "dados-pessoais": "Dados Pessoais",
  "endereco-contato": "Endereço e Contato",
  "dados-sociais": "Dados Sociais",
};

interface CompletudeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome: string;
  novoCadastro: boolean;
  resumo: ResumoCompletude;
  /** Reabre o formulário para completar a ficha agora. */
  onCompletarAgora: () => void;
}

export function CompletudeDialog({
  open,
  onOpenChange,
  nome,
  novoCadastro,
  resumo,
  onCompletarAgora,
}: CompletudeDialogProps) {
  const faixa = faixaCompletude(resumo.percentual);
  const cores = CORES[faixa.nivel];
  const completa = resumo.percentual >= 100;

  // Só os pendentes que valem a pena sugerir de imediato.
  const principais = resumo.pendentes.slice(0, 5);
  const restantes = resumo.pendentes.length - principais.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {completa ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : (
              <Sparkles className="size-5 text-teal-600" />
            )}
            {novoCadastro ? "Cadastro realizado" : "Cadastro atualizado"}
          </DialogTitle>
          <DialogDescription>
            Ficha de <strong className="text-foreground">{nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`rounded-lg border p-4 ${cores.fundo}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className={`text-sm font-semibold ${cores.texto}`}>
                {faixa.titulo}
              </span>
              <span className={`text-2xl font-bold ${cores.texto}`}>
                {resumo.percentual}%
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-white/70"
              role="progressbar"
              aria-valuenow={resumo.percentual}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Completude da ficha"
            >
              <div
                className={`h-full rounded-full transition-all ${cores.barra}`}
                style={{ width: `${resumo.percentual}%` }}
              />
            </div>
          </div>

          {resumo.telefonePendenteValidacao && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <PhoneOff className="mt-0.5 size-4 shrink-0" />
              <span>
                O telefone ainda não foi <strong>validado</strong>. Marque
                &quot;Telefone validado&quot; depois de confirmar o número com a
                beneficiária.
              </span>
            </div>
          )}

          {principais.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                O que falta preencher
              </p>
              <ul className="space-y-1">
                {principais.map((pendente) => (
                  <li
                    key={pendente.rotulo}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {pendente.rotulo}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ABA_ROTULO[pendente.aba]}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      +{pendente.pontos}
                    </span>
                  </li>
                ))}
              </ul>
              {restantes > 0 && (
                <p className="text-xs text-muted-foreground">
                  e mais {restantes} {restantes === 1 ? "campo" : "campos"} de
                  menor peso.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Todos os campos acompanhados estão preenchidos. Uma ficha completa
              alimenta corretamente os relatórios e o alcance das campanhas.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!completa && (
            <Button onClick={onCompletarAgora}>Completar agora</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
