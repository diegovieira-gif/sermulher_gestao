"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, KeyRound, Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  codigoPareamentoWhatsapp,
  gerarQrCodeWhatsapp,
  reconectarWhatsapp,
  statusWhatsapp,
} from "./gowa-sessao";

/**
 * Reconexão do WhatsApp do GoWA pela própria tela de campanhas: QR Code ou
 * código de pareamento, sem entrar no painel do GoWA. Enquanto o diálogo está
 * aberto, a situação é consultada a cada poucos segundos; quando o celular
 * conecta, o diálogo fecha sozinho.
 */
export function ConectarWhatsappDialog({
  open,
  onOpenChange,
  onConectado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConectado: () => void;
}) {
  const [aba, setAba] = useState("qr");
  const [qr, setQr] = useState<string | null>(null);
  const [validade, setValidade] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [pedindoCodigo, setPedindoCodigo] = useState(false);
  const [reconectando, setReconectando] = useState(false);
  const abertoRef = useRef(open);
  abertoRef.current = open;

  const concluir = useCallback(() => {
    toast.success("WhatsApp conectado!");
    onConectado();
    onOpenChange(false);
  }, [onConectado, onOpenChange]);

  const gerarQr = useCallback(async () => {
    setGerando(true);
    setErro(null);
    try {
      const r = await gerarQrCodeWhatsapp();
      if (!abertoRef.current) return;
      if (!r.success) {
        setErro(r.error);
        setQr(null);
      } else if (r.jaConectado) {
        concluir();
      } else {
        setQr(r.imagem);
        setValidade(r.validadeSeg);
      }
    } finally {
      setGerando(false);
    }
  }, [concluir]);

  // Abriu → QR novo; fechou → limpa tudo.
  useEffect(() => {
    if (open) {
      setAba("qr");
      setCodigo(null);
      void gerarQr();
    } else {
      setQr(null);
      setErro(null);
      setCodigo(null);
    }
  }, [open, gerarQr]);

  // Contagem regressiva do QR; ao vencer, gera outro (só na aba do QR).
  useEffect(() => {
    if (!open || !qr || aba !== "qr") return;
    if (validade <= 0) {
      void gerarQr();
      return;
    }
    const t = setTimeout(() => setValidade((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [open, qr, validade, aba, gerarQr]);

  // Enquanto aberto, confere a cada 4 s se o celular já conectou.
  useEffect(() => {
    if (!open) return;
    const t = setInterval(async () => {
      const r = await statusWhatsapp().catch(() => null);
      if (abertoRef.current && r?.success && r.logado) concluir();
    }, 4000);
    return () => clearInterval(t);
  }, [open, concluir]);

  const pedirCodigo = async () => {
    setPedindoCodigo(true);
    setCodigo(null);
    try {
      const r = await codigoPareamentoWhatsapp(telefone);
      if (r.success) setCodigo(r.codigo);
      else toast.error(r.error);
    } finally {
      setPedindoCodigo(false);
    }
  };

  const reconectar = async () => {
    setReconectando(true);
    try {
      const r = await reconectarWhatsapp();
      if (!r.success) toast.error(r.error);
      else if (r.logado) concluir();
      else toast.warning("A sessão anterior não voltou. Conecte pelo QR Code ou pelo código.");
    } finally {
      setReconectando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Use o celular da <strong>Recepção</strong> ou o número definido pelo{" "}
            <strong>Gabinete/Ascom</strong> para os disparos em nome da Secretaria — nunca um celular
            pessoal. No WhatsApp, abra{" "}
            <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-1" /> QR Code
            </TabsTrigger>
            <TabsTrigger value="codigo">
              <KeyRound className="h-4 w-4 mr-1" /> Código
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="flex flex-col items-center gap-3 pt-2">
            <div className="h-64 w-64 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR Code para conectar o WhatsApp" className="h-full w-full object-contain" />
              ) : gerando ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-sm text-muted-foreground px-4 text-center">{erro || "Sem QR Code"}</span>
              )}
            </div>
            {qr && (
              <p className="text-xs text-muted-foreground">
                Aponte a câmera do WhatsApp para o código. Um novo é gerado em {validade}s.
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => void gerarQr()} disabled={gerando}>
              <RefreshCw className={`h-3 w-3 mr-1 ${gerando ? "animate-spin" : ""}`} /> Gerar outro QR Code
            </Button>
          </TabsContent>

          <TabsContent value="codigo" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Para quando não dá para escanear (por exemplo, a tela está no próprio celular). No WhatsApp,
              em <strong>Conectar um aparelho</strong>, toque em <strong>Conectar com número de telefone</strong> e
              digite o código abaixo.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="(79) 99999-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                inputMode="tel"
              />
              <Button onClick={pedirCodigo} disabled={pedindoCodigo || telefone.replace(/\D/g, "").length < 10}>
                {pedindoCodigo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar código"}
              </Button>
            </div>
            {codigo && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/30 p-4 text-center">
                <div className="text-3xl font-mono font-bold tracking-widest text-purple-700 dark:text-purple-300">
                  {codigo}
                </div>
                <p className="text-xs text-muted-foreground mt-1">O código vale por poucos minutos.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Aguardando o celular…
          </span>
          <Button variant="ghost" size="sm" onClick={reconectar} disabled={reconectando}>
            {reconectando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
            Só reconectar a sessão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
