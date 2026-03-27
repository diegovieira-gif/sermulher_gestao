"use client";

import { useState, useTransition, useRef } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Pause,
  Download,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { deleteSonho } from "../actions";
import { SonhoForm } from "@/app/(admin)/app-amar/sonhos/sonho-form";

interface Sonho {
  id: number;
  nome?: string;
  telefone?: string;
  cpf?: string;
  audio?: string;
  date_created?: string;
}

interface SonhosClientProps {
  initialData: Sonho[];
}

export function SonhosClient({ initialData }: SonhosClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sonho | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteSonho(deleteId);
      if (result.success) {
        toast.success("Sonho excluído com sucesso.");
      } else {
        toast.error(`Erro ao excluir sonho: ${result.error}`);
      }
      setDeleteId(null);
    });
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (sonho: Sonho) => {
    setEditingItem(sonho);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handlePlayAudio = (audioId: string, sonhoId: number) => {
    if (!audioRef.current) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://192.168.0.115:8055";
    const audioUrl = `${baseUrl}/files/${audioId}`;

    console.log("[Audio] Playing WebM:", audioUrl);

    if (playingAudioId === sonhoId && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      // Define o tipo MIME para WebM (formato do arquivo)
      audioRef.current.type = "audio/webm";
      audioRef.current.src = audioUrl;

      audioRef.current
        .play()
        .then(() => {
          setPlayingAudioId(sonhoId);
          toast.success("Reproduzindo áudio...");
        })
        .catch((err) => {
          console.error("[Audio] Erro:", err);
          toast.error(
            "Erro ao reproduzir áudio: " +
              (err.message ||
                "Arquivo não encontrado ou formato não suportado (WebM)"),
          );
          setPlayingAudioId(null);
        });
    }
  };

  const handleDownloadAudio = (audioId: string, fileName?: string) => {
    try {
      // Usar rota API proxy que tem autenticação do servidor
      const downloadUrl = `/api/files/${audioId}`;

      console.log("[Download] Proxy URL:", downloadUrl);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || "sonho.webm";
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download iniciado!");
    } catch (err) {
      console.error("[Download] Erro:", err);
      toast.error("Erro ao baixar áudio");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium">Lista de Sonhos</h3>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Sonho
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Áudio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum sonho encontrado.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((sonho) => (
                <TableRow key={sonho.id}>
                  <TableCell className="font-medium">
                    {sonho.nome || "-"}
                  </TableCell>
                  <TableCell>{sonho.telefone || "-"}</TableCell>
                  <TableCell>{sonho.cpf || "-"}</TableCell>
                  <TableCell>
                    {sonho.audio ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handlePlayAudio(sonho.audio!, sonho.id)
                          }
                          className="h-8 w-8 p-0"
                          title="Reproduzir áudio"
                        >
                          {playingAudioId === sonho.id ? (
                            <Pause className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Play className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAudio(sonho.audio!)}
                          className="h-8 w-8 p-0"
                          title="Baixar áudio"
                        >
                          <Download className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">sem áudio</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(sonho)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeleteId(sonho.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingItem ? "Editar Sonho" : "Novo Sonho"}
            </SheetTitle>
            <SheetDescription>
              {editingItem
                ? "Atualize os detalhes do sonho abaixo."
                : "Preencha os dados para cadastrar um novo sonho."}
            </SheetDescription>
          </SheetHeader>
          <SonhoForm
            initialData={editingItem as any}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto excluirá permanentemente o
              sonho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioId(null)}
        onPlay={() => {}}
        className="hidden"
        controlsList="nodownload"
      >
        <source type="audio/webm" />
      </audio>
    </div>
  );
}
