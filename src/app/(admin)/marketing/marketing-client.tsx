"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Users,
  MousePointerClick,
  Plus,
  Trash2,
  Edit,
  Calendar,
} from "lucide-react";
import { saveMarketingItem, deleteMarketingItem } from "./actions";
import { useToast } from "@/components/ui/use-toast"; // Se não tiver useToast, pode remover ou trocar por alert

export function MarketingClient({
  items,
  stats,
}: {
  items: any[];
  stats: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: null,
    titulo: "",
    data_publicacao: new Date().toISOString().split("T")[0],
    plataforma: "instagram",
    link: "",
    alcance: "",
    interacoes: "",
    campanha: "",
  });

  // Função para abrir modal de edição
  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      titulo: item.titulo,
      data_publicacao: item.data_publicacao,
      plataforma: item.plataforma,
      link: item.link || "",
      alcance: item.alcance || "0",
      interacoes: item.interacoes || "0",
      campanha: item.campanha || "",
    });
    setIsOpen(true);
  };

  // Função para limpar e abrir modal de novo item
  const handleNew = () => {
    setFormData({
      id: null,
      titulo: "",
      data_publicacao: new Date().toISOString().split("T")[0],
      plataforma: "instagram",
      link: "",
      alcance: "",
      interacoes: "",
      campanha: "",
    });
    setIsOpen(true);
  };

  // Salvar
  const onSave = async () => {
    if (!formData.titulo || !formData.data_publicacao) {
      alert("Preencha Título e Data!");
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      alcance: Number(formData.alcance),
      interacoes: Number(formData.interacoes),
    };

    const res = await saveMarketingItem(payload);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      // O Next.js deve revalidar a página automaticamente via server action
    } else {
      alert("Erro ao salvar: " + (res.error || "Desconhecido"));
    }
  };

  // Deletar
  const onDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      await deleteMarketingItem(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cards de KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Publicações (Mês)
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsMes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.alcanceMes.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.interacoesMes.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Área da Tabela */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestão de Comunicação</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {formData.id ? "Editar Publicação" : "Nova Publicação"}
                </DialogTitle>
              </DialogHeader>

              {/* FORMULÁRIO EXPLÍCITO */}
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Título / Manchete</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Ex: Post sobre o evento..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.data_publicacao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_publicacao: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={formData.plataforma}
                      onValueChange={(val) =>
                        setFormData({ ...formData, plataforma: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="jornal">Jornal</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Campanha</Label>
                  <Input
                    value={formData.campanha}
                    onChange={(e) =>
                      setFormData({ ...formData, campanha: e.target.value })
                    }
                    placeholder="Ex: Outubro Rosa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Alcance</Label>
                    <Input
                      type="number"
                      value={formData.alcance}
                      onChange={(e) =>
                        setFormData({ ...formData, alcance: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Interações</Label>
                    <Input
                      type="number"
                      value={formData.interacoes}
                      onChange={(e) =>
                        setFormData({ ...formData, interacoes: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button onClick={onSave} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Título</th>
                  <th className="p-4 font-medium">Plataforma</th>
                  <th className="p-4 font-medium">Campanha</th>
                  <th className="p-4 font-medium">Alcance</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Nenhuma publicação encontrada.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        {new Date(item.data_publicacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td className="p-4 font-medium">{item.titulo}</td>
                      <td className="p-4 capitalize">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.plataforma}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {item.campanha || "-"}
                      </td>
                      <td className="p-4 font-mono">{item.alcance}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
