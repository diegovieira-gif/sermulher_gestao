"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getCollectionData,
  getRelationData,
  saveItem,
  removeItem
} from "./actions";
import {
  COLLECTIONS_CONFIG,
  type CampoConfig,
  type CollectionConfig,
  type ObserCollection,
  type ObserId,
} from "./types";
import { exibirValor } from "./registro";
import { Label } from "@/components/ui/label";

type Registro = Record<string, unknown> & { id: ObserId };
type Periodo = { id: string; nome_periodo: string | null };

interface ObservatorioClientProps {
  initialData: Registro[];
  initialError: { message: string; status?: number } | null;
  periodos: Periodo[];
}

export function ObservatorioClient({
  initialData,
  initialError,
  periodos: periodosIniciais
}: ObservatorioClientProps) {
  const [activeTab, setActiveTab] = useState<ObserCollection>(COLLECTIONS_CONFIG[0].name);
  const [data, setData] = useState<Registro[]>(initialData);
  const [periodos, setPeriodos] = useState<Periodo[]>(periodosIniciais);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<ObserId | null>(null);
  const [saving, setSaving] = useState(false);

  // Aba vigente e número da última consulta: uma resposta que chega depois de
  // trocar de aba (ou de digitar outra busca) é descartada. Antes, a lista de
  // uma aba podia aparecer sob outra — e editar/excluir mirava o registro
  // errado, pois o id era o da coleção anterior.
  const abaAtual = useRef(activeTab);
  const ultimaConsulta = useRef(0);
  // Só a PRIMEIRA montagem aproveita os dados vindos do servidor. Voltar à
  // primeira aba depois precisa buscar de novo, senão ela exibia o que
  // estivesse em `data` — a lista da aba anterior.
  const primeiraCarga = useRef(true);

  // Load data when tab or search changes
  useEffect(() => {
    abaAtual.current = activeTab;
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      if (!initialError) return;
    }

    const consulta = ++ultimaConsulta.current;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const result = await getCollectionData(activeTab, searchTerm);
      if (consulta !== ultimaConsulta.current) return; // resposta atrasada
      if (result.success) {
        setData(result.data as Registro[]);
      } else {
        setError({ message: result.error || "Erro ao carregar dados", status: result.status });
        setData([]);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm, initialError]);

  const trocarAba = (aba: ObserCollection) => {
    // Limpa na hora: durante o debounce a tabela não pode mostrar (nem deixar
    // editar) os registros da aba anterior.
    setData([]);
    setLoading(true);
    setActiveTab(aba);
  };

  const currentConfig = COLLECTIONS_CONFIG.find(c => c.name === activeTab) as CollectionConfig;
  const colunas = currentConfig.fields.filter((f) => f.listar);
  const nomeDoPeriodo = (id: unknown) =>
    periodos.find((p) => p.id === id)?.nome_periodo ?? String(id ?? "-");

  const handleCreate = () => {
    setEditingId(null);
    const initialForm: Record<string, unknown> = {};
    currentConfig.fields.forEach(f => {
      // período novo já entra no site; desmarque para preparar sem publicar
      if (f.type === 'boolean' && f.key === 'ativo') initialForm[f.key] = true;
    });
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Registro) => {
    setEditingId(item.id);
    const cleanedData: Record<string, unknown> = { ...item };
    currentConfig.fields.forEach(f => {
      const valor = item[f.key];
      if (f.type === 'relation' && typeof valor === 'object' && valor !== null) {
        cleanedData[f.key] = (valor as { id?: unknown }).id;
      }
      if (f.type === 'date' && typeof valor === 'string') cleanedData[f.key] = valor.slice(0, 10);
    });
    setFormData(cleanedData);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: ObserId) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    setLoading(true);
    const result = await removeItem(activeTab, id);
    if (result.success) {
      toast.success("Item removido com sucesso!");
      setData(prev => prev.filter(item => item.id !== id));
      if (activeTab === 'obser_periodos') setPeriodos(prev => prev.filter(p => p.id !== id));
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const onSave = async () => {
    setSaving(true);
    const result = await saveItem(activeTab, formData, editingId ?? undefined);
    if (result.success) {
      toast.success(editingId ? "Item atualizado!" : "Item criado!");
      setIsDialogOpen(false);
      // Refresh data
      const aba = activeTab;
      const refreshed = await getCollectionData(aba, searchTerm);
      // Se a pessoa trocou de aba enquanto salvava, não sobrescreve a lista nova.
      if (refreshed.success && abaAtual.current === aba) setData(refreshed.data as Registro[]);
      if (activeTab === 'obser_periodos') {
        const novos = await getRelationData('obser_periodos');
        if (novos.success) setPeriodos(novos.data as Periodo[]);
      }
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const celula = (f: CampoConfig, item: Registro) => {
    const valor = item[f.key];
    if (f.type === 'relation' && (typeof valor !== 'object' || valor === null)) return nomeDoPeriodo(valor);
    return exibirValor(f.type, valor);
  };

  const campoDoFormulario = (f: CampoConfig) => {
    const valor = formData[f.key];
    const definir = (v: unknown) => setFormData({ ...formData, [f.key]: v });
    if (f.type === 'relation') {
      return (
        <Select value={valor ? String(valor) : ""} onValueChange={definir}>
          <SelectTrigger id={f.key}>
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nome_periodo || p.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === 'boolean') {
      // o Directus (SQLite) devolve booleano como 1/0
      return <Switch id={f.key} checked={valor === true || valor === 1} onCheckedChange={definir} />;
    }
    return (
      <Input
        id={f.key}
        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
        inputMode={f.type === 'number' ? 'numeric' : undefined}
        min={f.type === 'number' ? 0 : undefined}
        value={valor === null || valor === undefined ? "" : String(valor)}
        onChange={(e) => definir(e.target.value)}
      />
    );
  };

  // Campos do formulário agrupados por seção (o consolidado tem 26 campos).
  const secoes: { titulo: string | null; campos: CampoConfig[] }[] = [];
  for (const f of currentConfig.fields) {
    const titulo = f.secao ?? null;
    const ultima = secoes[secoes.length - 1];
    if (ultima && ultima.titulo === titulo) ultima.campos.push(f);
    else secoes.push({ titulo, campos: [f] });
  }

  if (error && error.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="size-16 text-yellow-500" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Observatório</h1>
          <p className="text-muted-foreground">
            Indicadores publicados no site público do Observatório (dados-sermulher.aracaju.se.gov.br).
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Tabs defaultValue={activeTab} onValueChange={(v) => trocarAba(v as ObserCollection)}>
          <div className="border-b border-border px-4 pt-4 overflow-x-auto">
            <TabsList className="bg-muted mb-[-1px] rounded-b-none h-12">
              {COLLECTIONS_CONFIG.map(config => (
                <TabsTrigger
                  key={config.name}
                  value={config.name}
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-x border-t border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-800 rounded-t-lg px-6"
                >
                  {config.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-border">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar registros..."
                className="pl-10 bg-card"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Buscando dados no Directus...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-muted-foreground">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {colunas.map(f => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={String(item.id)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {colunas.map(f => (
                        <TableCell key={f.key}>{celula(f, item)}</TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-muted-foreground" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Registro" : "Novo Registro"}</DialogTitle>
            <DialogDescription>
              {currentConfig.label}. Campos com * são obrigatórios. O que for salvo aparece no site público.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {secoes.map((s, i) => (
              <Fragment key={s.titulo ?? `s${i}`}>
                {s.titulo && <h3 className="text-sm font-semibold pt-2 border-t border-border">{s.titulo}</h3>}
                <div className="grid gap-4 sm:grid-cols-2">
                  {s.campos.map(f => (
                    <div key={f.key} className={f.type === 'boolean' ? "flex items-center justify-between gap-2 rounded-lg border p-3 sm:col-span-2" : "grid gap-2"}>
                      <Label htmlFor={f.key}>{f.label}{f.required ? " *" : ""}</Label>
                      {campoDoFormulario(f)}
                      {f.dica && <p className="text-xs text-muted-foreground">{f.dica}</p>}
                    </div>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
