"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { marketingPostSchema, MarketingPost } from "./schemas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Edit,
  BarChart3,
  Eye,
  Flag,
  Smartphone,
  Instagram,
  Globe,
  Newspaper,
  Facebook,
  Monitor,
  ExternalLink,
  Tv,
  Radio,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { saveMarketingItem, deleteMarketingItem } from "./actions";
import { toast } from "sonner";

interface MarketingClientProps {
  items: any[];
  stats: {
    totalPosts: number;
    postsPorCanal: { name: string; value: number }[];
    alcanceTotal: number;
    campanhasAtivas: number;
    topAlcance: { titulo: string; alcance: number; canal: string } | null;
  };
  campanhasList: any[];
}

const COLORS = [
  "#E1306C", // Instagram
  "#1877F2", // Facebook
  "#10B981", // Site
  "#F59E0B", // Youtube/TV
  "#6366F1", // Outros
  "#8B5CF6",
];

export function MarketingClient({
  items,
  stats,
  campanhasList,
}: MarketingClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(marketingPostSchema),
    defaultValues: {
      titulo: "",
      data_publicacao: new Date().toISOString().split("T")[0],
      canal: "Instagram" as const,
      formato: "Feed/Post" as const,
      alcance: 0,
      link: "",
    },
  });

  const { watch, setValue } = form;
  const selectedCanal = watch("canal");

  const handleEdit = (item: any) => {
    setEditId(item.id);
    form.reset({
      titulo: item.titulo,
      data_publicacao: item.data_publicacao,
      canal: item.canal,
      formato: item.formato,
      alcance: item.alcance || 0,
      link: item.link || "",
    });
    setIsOpen(true);
  };

  const handleNew = () => {
    setEditId(null);
    form.reset({
      titulo: "",
      data_publicacao: new Date().toISOString().split("T")[0],
      canal: "Instagram",
      formato: "Feed/Post",
      alcance: 0,
      link: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, id: editId };
      const res = await saveMarketingItem(payload);

      if (res.success) {
        toast.success("Registro salvo com sucesso!");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar.");
    }
  };

  const onDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      await deleteMarketingItem(id);
      toast.success("Item removido!");
    }
  };

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case "Instagram":
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case "Facebook":
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case "Site PMA":
      case "Site SERMULHER":
        return <Globe className="w-4 h-4 text-green-600" />;
      case "Jornal":
        return <Newspaper className="w-4 h-4 text-gray-600" />;
      case "TV":
        return <Tv className="w-4 h-4 text-orange-600" />;
      case "Rádio":
        return <Radio className="w-4 h-4 text-yellow-600" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Publicações
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.alcanceTotal.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimativa acumulada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Campanhas Ativas
            </CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campanhasAtivas}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        {stats.topAlcance && (
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Top Alcance
              </CardTitle>
              <Trophy className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate text-orange-900">
                {stats.topAlcance.alcance.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-orange-700 truncate max-w-[180px]">
                {stats.topAlcance.titulo}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* GRÁFICO */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Publicações por Canal</CardTitle>
            <CardDescription>Distribuição do mês</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.postsPorCanal}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.postsPorCanal.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TABELA E BOTÃO */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Histórico Recente</CardTitle>
              <CardDescription>Ultimas postagens registradas</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew}>
                  <Plus className="w-4 h-4 mr-2" /> Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editId ? "Editar Registro" : "Novo Registro de Mídia"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título / Pauta</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Campanha X..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="data_publicacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="canal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canal</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[
                                  "Site PMA",
                                  "Site SERMULHER",
                                  "Instagram",
                                  "Facebook",
                                  "Jornal",
                                  "TV",
                                  "Rádio",
                                ].map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(selectedCanal === "Instagram" ||
                      selectedCanal === "Facebook") && (
                        <FormField
                          control={form.control}
                          name="formato"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[
                                    "Feed/Post",
                                    "Reels",
                                    "Stories",
                                    "Matéria",
                                    "Entrevista",
                                  ].map((f) => (
                                    <SelectItem key={f} value={f}>
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="alcance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alcance (Estimado)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={(field.value as number | string) ?? ""}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit">Salvar Registro</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.data_publicacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.titulo}
                        {item.formato && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            {item.formato}
                          </Badge>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-700 inline-flex items-center"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(item.canal)}
                          <span>{item.canal}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.alcance}</TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
