
"use client";

import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
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
  saveItem, 
  removeItem 
} from "./actions";
import { 
  COLLECTIONS_CONFIG, 
  ObserCollection, 
  CollectionConfig 
} from "./types";
import { Label } from "@/components/ui/label";

interface ObservatorioClientProps {
  initialData: any[];
  initialError: { message: string; status?: number } | null;
  periodos: any[];
}

export function ObservatorioClient({ 
  initialData, 
  initialError,
  periodos
}: ObservatorioClientProps) {
  const [activeTab, setActiveTab] = useState<ObserCollection>(COLLECTIONS_CONFIG[0].name);
  const [data, setData] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load data when tab or search changes
  useEffect(() => {
    if (activeTab === COLLECTIONS_CONFIG[0].name && searchTerm === "" && initialData.length > 0 && !error) {
        // Skip first load if we already have initialData for the first tab
        return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const result = await getCollectionData(activeTab, searchTerm);
      if (result.success) {
        setData(result.data as any[]);
      } else {
        setError({ message: result.error || "Erro ao carregar dados", status: result.status });
        setData([]);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm, initialData, error]);

  const currentConfig = COLLECTIONS_CONFIG.find(c => c.name === activeTab) as CollectionConfig;

  const handleCreate = () => {
    setEditingId(null);
    // Initialize with default values if any
    const initialForm: any = {};
    currentConfig.fields.forEach(f => {
      if (f.key === 'status') initialForm[f.key] = 'published';
    });
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    const cleanedData = { ...item };
    // If it's a relation, we might need just the ID for the form
    currentConfig.fields.forEach(f => {
      if (f.type === 'relation' && typeof item[f.key] === 'object' && item[f.key] !== null) {
        cleanedData[f.key] = item[f.key].id;
      }
    });
    setFormData(cleanedData);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    
    setLoading(true);
    const result = await removeItem(activeTab, id);
    if (result.success) {
      toast.success("Item removido com sucesso!");
      setData(prev => prev.filter(item => item.id !== id));
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const onSave = async () => {
    setSaving(true);
    const result = await saveItem(activeTab, formData, editingId || undefined);
    if (result.success) {
      toast.success(editingId ? "Item atualizado!" : "Item criado!");
      setIsDialogOpen(false);
      // Refresh data
      const refreshed = await getCollectionData(activeTab, searchTerm);
      if (refreshed.success) setData(refreshed.data as any[]);
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Observatório</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerenciamento de coleções e indicadores do observatório.</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as ObserCollection)}>
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 pt-4">
            <TabsList className="bg-slate-100 dark:bg-slate-800 mb-[-1px] rounded-b-none h-12">
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

          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar registros..." 
                className="pl-10 bg-white dark:bg-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Buscando dados no Directus...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-slate-500">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableHead className="w-[80px]">ID</TableHead>
                    {currentConfig.fields.map(f => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-mono text-xs text-slate-400">{item.id}</TableCell>
                      {currentConfig.fields.map(f => (
                        <TableCell key={f.key}>
                          {f.type === 'relation' ? (
                            typeof item[f.key] === 'object' && item[f.key] !== null 
                              ? item[f.key].nome || item[f.key].titulo || item[f.key].id
                              : item[f.key]
                          ) : (
                            String(item[f.key] ?? '-')
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-slate-600 dark:text-slate-400">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Registro" : "Novo Registro"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para a coleção {currentConfig.label}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {currentConfig.fields.map(f => (
              <div key={f.key} className="grid gap-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.type === 'relation' && f.relationCollection === 'obser_periodos' ? (
                  <Select 
                    value={String(formData[f.key] || "")} 
                    onValueChange={(v) => setFormData({...formData, [f.key]: parseInt(v)})}
                  >
                    <SelectTrigger id={f.key}>
                      <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'number' ? (
                  <Input 
                    id={f.key} 
                    type="number"
                    value={formData[f.key] ?? ""} 
                    onChange={(e) => setFormData({...formData, [f.key]: parseFloat(e.target.value)})}
                  />
                ) : (
                  <Input 
                    id={f.key} 
                    type={f.type === 'url' ? 'url' : 'text'}
                    value={formData[f.key] ?? ""} 
                    onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
