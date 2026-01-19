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
// Importando ícones mais ricos para o Dashboard
import {
  Plus,
  Trash2,
  Edit,
  BarChart3,
  Eye,
  TrendingUp, // Linha 1
  Percent,
  Flag,
  Smartphone, // Linha 2
  Instagram,
  Globe,
  Newspaper,
  Facebook,
  Monitor, // Ícones da Tabela
} from "lucide-react";
import { saveMarketingItem, deleteMarketingItem } from "./actions";

export function MarketingClient({
  items,
  stats,
}: {
  items: any[];
  stats: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } else {
      alert("Erro ao salvar: " + (res.error || "Desconhecido"));
    }
  };

  const onDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      await deleteMarketingItem(id);
    }
  };

  // Helper para ícone da plataforma
  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case "instagram":
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case "facebook":
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case "site":
        return <Globe className="w-4 h-4 text-gray-600" />;
      case "jornal":
        return <Newspaper className="w-4 h-4 text-gray-800" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI GRID - Agora com 6 Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* --- LINHA 1 --- */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publicações (Mês)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsMes}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alcance Total
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.alcanceMes.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interações
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.interacoesMes.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        {/* --- LINHA 2 (NOVOS) --- */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Engajamento
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxaEngajamento}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Qualidade da interação
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campanhas Ativas
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
              <Flag className="h-4 w-4 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campanhasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Temas trabalhados
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canal Principal
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats.topPlataforma}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maior volume de posts
            </p>
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
                      Nenhum item encontrado.
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
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(item.plataforma)}
                          <span className="capitalize">{item.plataforma}</span>
                        </div>
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
