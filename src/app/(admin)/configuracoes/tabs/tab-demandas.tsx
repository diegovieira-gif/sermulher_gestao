"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, ClipboardList, Lock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { saveDemandPermissoes } from "../demanda-permissoes-actions";

interface RoleInfo {
  id: string;
  name: string;
  isAdmin: boolean;
}
interface DemandConfig {
  role: string;
  role_nome?: string | null;
  permitir_tudo?: boolean | null;
  tipos?: string[] | null;
}

interface TabDemandasProps {
  roles: RoleInfo[];
  configs: DemandConfig[];
  tipos: { id: number; nome: string }[];
}

export function TabDemandas({ roles, configs, tipos }: TabDemandasProps) {
  const configByRole = useMemo(() => {
    const map: Record<string, DemandConfig> = {};
    for (const c of configs) map[c.role] = c;
    return map;
  }, [configs]);

  const firstNonAdmin = roles.find((r) => !r.isAdmin) ?? roles[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstNonAdmin?.id ?? null);
  const [isPending, startTransition] = useTransition();

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;
  const initialConfig = selectedId ? configByRole[selectedId] : undefined;

  const [permitirTudo, setPermitirTudo] = useState<boolean>(initialConfig?.permitir_tudo ?? false);
  const [selectedTipos, setSelectedTipos] = useState<Set<string>>(
    new Set(Array.isArray(initialConfig?.tipos) ? (initialConfig?.tipos as string[]) : []),
  );
  const [loadedFor, setLoadedFor] = useState<string | null>(selectedId);

  // Recarrega o estado ao trocar de perfil.
  if (selectedId !== loadedFor) {
    const cfg = selectedId ? configByRole[selectedId] : undefined;
    setPermitirTudo(cfg?.permitir_tudo ?? false);
    setSelectedTipos(new Set(Array.isArray(cfg?.tipos) ? (cfg?.tipos as string[]) : []));
    setLoadedFor(selectedId);
  }

  const toggleTipo = (nome: string, checked: boolean) => {
    setSelectedTipos((prev) => {
      const next = new Set(prev);
      if (checked) next.add(nome);
      else next.delete(nome);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedRole) return;
    startTransition(async () => {
      const res = await saveDemandPermissoes({
        roleId: selectedRole.id,
        roleNome: selectedRole.name,
        permitirTudo,
        tipos: Array.from(selectedTipos),
      });
      if (res.success) toast.success(`Acesso de demandas de "${selectedRole.name}" salvo.`);
      else toast.error(res.error || "Falha ao salvar.");
    });
  };

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nenhum perfil encontrado no Directus.
      </div>
    );
  }

  const isAdminSelected = selectedRole?.isAdmin ?? false;

  return (
    <div className="space-y-1">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Acesso a Tipos de Demanda
        </h2>
        <p className="text-sm text-muted-foreground">
          Defina quais tipos de demanda cada perfil pode visualizar e registrar nas tramitações.
          Administradores têm acesso a todos os tipos.
        </p>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Lista de perfis */}
        <aside className="w-full md:w-56 shrink-0 space-y-1">
          <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Perfis
          </p>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                selectedId === r.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted",
              )}
            >
              <span className="truncate">{r.name}</span>
              {r.isAdmin && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">Admin</Badge>
              )}
            </button>
          ))}
        </aside>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!selectedRole ? (
            <p className="text-sm text-muted-foreground">Selecione um perfil.</p>
          ) : isAdminSelected ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <Lock className="h-5 w-5 shrink-0 text-primary" />
              <span>
                <strong>{selectedRole.name}</strong> é administrador e acessa todos os tipos de demanda.
              </span>
            </div>
          ) : tipos.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum tipo de demanda cadastrado. Cadastre em “Tipos de Tramitação”.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="demanda-tudo" className="text-sm font-medium">Acesso a todos os tipos</Label>
                  <p className="text-xs text-muted-foreground">Libera todos os tipos de demanda para este perfil.</p>
                </div>
                <Switch id="demanda-tudo" checked={permitirTudo} onCheckedChange={setPermitirTudo} />
              </div>

              <div className={cn("grid gap-2 sm:grid-cols-2 transition-opacity", permitirTudo && "pointer-events-none opacity-40")}>
                {tipos.map((t) => {
                  const checked = selectedTipos.has(t.nome);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                        checked ? "border-primary/40 bg-primary/5" : "hover:bg-muted",
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={(v) => toggleTipo(t.nome, v === true)} />
                      <span className="flex-1">{t.nome}</span>
                    </label>
                  );
                })}
              </div>

              {!permitirTudo && selectedTipos.size === 0 && (
                <p className="text-xs text-amber-600">
                  Nenhum tipo selecionado — este perfil não verá nenhuma demanda.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
