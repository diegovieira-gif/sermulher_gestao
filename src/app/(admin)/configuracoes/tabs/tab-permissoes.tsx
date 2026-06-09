"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Lock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MENU_REGISTRY,
  ALWAYS_ON_KEYS,
  type MenuMeta,
} from "@/lib/menu-registry";
import { savePermissoes } from "../permissoes-actions";

interface RoleInfo {
  id: string;
  name: string;
  isAdmin: boolean;
}
interface RolePermission {
  role: string;
  role_nome?: string | null;
  permitir_tudo?: boolean | null;
  menus?: string[] | null;
}

interface TabPermissoesProps {
  roles: RoleInfo[];
  configs: RolePermission[];
}

const GROUP_LABEL: Record<MenuMeta["group"], string> = {
  main: "Menu Principal",
  system: "Sistema",
};

export function TabPermissoes({ roles, configs }: TabPermissoesProps) {
  const configByRole = useMemo(() => {
    const map: Record<string, RolePermission> = {};
    for (const c of configs) map[c.role] = c;
    return map;
  }, [configs]);

  const firstNonAdmin = roles.find((r) => !r.isAdmin) ?? roles[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    firstNonAdmin?.id ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;
  const initialConfig = selectedId ? configByRole[selectedId] : undefined;

  // Estado editável do perfil selecionado.
  const [permitirTudo, setPermitirTudo] = useState<boolean>(
    initialConfig?.permitir_tudo ?? false,
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(
      Array.isArray(initialConfig?.menus)
        ? (initialConfig?.menus as string[])
        : [],
    ),
  );
  // Chave do perfil cujo estado está carregado, para detectar troca.
  const [loadedFor, setLoadedFor] = useState<string | null>(
    selectedId,
  );

  // Recarrega o estado ao trocar de perfil.
  if (selectedId !== loadedFor) {
    const cfg = selectedId ? configByRole[selectedId] : undefined;
    setPermitirTudo(cfg?.permitir_tudo ?? false);
    setSelectedKeys(
      new Set(Array.isArray(cfg?.menus) ? (cfg?.menus as string[]) : []),
    );
    setLoadedFor(selectedId);
  }

  const grouped = useMemo(() => {
    const g: Record<string, MenuMeta[]> = { main: [], system: [] };
    for (const m of MENU_REGISTRY) g[m.group].push(m);
    return g;
  }, []);

  const toggleKey = (key: string, checked: boolean) => {
    if (ALWAYS_ON_KEYS.includes(key)) return; // não pode desmarcar
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedRole) return;
    startTransition(async () => {
      const res = await savePermissoes({
        roleId: selectedRole.id,
        roleNome: selectedRole.name,
        permitirTudo,
        menus: Array.from(
          new Set([...ALWAYS_ON_KEYS, ...Array.from(selectedKeys)]),
        ),
      });
      if (res.success) {
        toast.success(`Permissões de "${selectedRole.name}" salvas.`);
      } else {
        toast.error(res.error || "Falha ao salvar permissões.");
      }
    });
  };

  if (roles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nenhum perfil encontrado no Directus. Crie perfis (roles) no Directus
        para gerenciar suas permissões de acesso aqui.
      </div>
    );
  }

  const isAdminSelected = selectedRole?.isAdmin ?? false;

  return (
    <div className="space-y-1">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Permissões de Menu
        </h2>
        <p className="text-sm text-muted-foreground">
          Defina quais itens do menu lateral cada perfil de usuário pode
          acessar. Administradores têm acesso total e não podem ser
          restringidos.
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
                selectedId === r.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-muted",
              )}
            >
              <span className="truncate">{r.name}</span>
              {r.isAdmin && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  Admin
                </Badge>
              )}
            </button>
          ))}
        </aside>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!selectedRole ? (
            <p className="text-sm text-muted-foreground">
              Selecione um perfil.
            </p>
          ) : isAdminSelected ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <Lock className="h-5 w-5 shrink-0 text-primary" />
              <span>
                <strong>{selectedRole.name}</strong> é um perfil administrador e
                possui acesso irrestrito a todos os itens do menu.
              </span>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="permitir-tudo" className="text-sm font-medium">
                    Acesso total
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Libera todos os itens para este perfil.
                  </p>
                </div>
                <Switch
                  id="permitir-tudo"
                  checked={permitirTudo}
                  onCheckedChange={setPermitirTudo}
                />
              </div>

              <div
                className={cn(
                  "space-y-6 transition-opacity",
                  permitirTudo && "pointer-events-none opacity-40",
                )}
              >
                {(["main", "system"] as const).map((group) => (
                  <div key={group} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {GROUP_LABEL[group]}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {grouped[group].map((m) => {
                        const always = ALWAYS_ON_KEYS.includes(m.key);
                        const checked = always || selectedKeys.has(m.key);
                        return (
                          <label
                            key={m.key}
                            className={cn(
                              "flex items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                              checked
                                ? "border-primary/40 bg-primary/5"
                                : "hover:bg-muted",
                              always && "opacity-70",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={always}
                              onCheckedChange={(v) =>
                                toggleKey(m.key, v === true)
                              }
                            />
                            <span className="flex-1">{m.label}</span>
                            {always && (
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                Fixo
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isPending} className="gap-2">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar permissões
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
