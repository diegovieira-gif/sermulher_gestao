"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  User as LucideUser,
  Mail as LucideMail,
  Shield as LucideShield,
  Clock as LucideClock,
  Activity as LucideActivity,
  Lock as LucideLock,
  Loader2 as LucideLoader2,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Briefcase as LucideBriefcase,
  MapPin as LucideMapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAuditLogs, type AuditLog } from "../auditoria/actions";
import { changeMyPassword, type MeuPerfil } from "./actions";

const User = LucideUser as React.ComponentType<any>;
const Mail = LucideMail as React.ComponentType<any>;
const Shield = LucideShield as React.ComponentType<any>;
const Clock = LucideClock as React.ComponentType<any>;
const Activity = LucideActivity as React.ComponentType<any>;
const Lock = LucideLock as React.ComponentType<any>;
const Loader2 = LucideLoader2 as React.ComponentType<any>;
const ChevronLeft = LucideChevronLeft as React.ComponentType<any>;
const ChevronRight = LucideChevronRight as React.ComponentType<any>;
const Briefcase = LucideBriefcase as React.ComponentType<any>;
const MapPin = LucideMapPin as React.ComponentType<any>;

const FRIENDLY_COLLECTIONS: Record<string, string> = {
  tramitacoes: "Gestão de Demandas",
  setores: "Setores",
  beneficiarias: "Beneficiárias",
  atendimentos: "Atendimentos",
  eventos_campanhas: "Agenda Institucional",
  entregas_beneficios: "Entregas de Benefícios",
  participacoes_evento: "Participações em Eventos",
  inscricoes_curso: "Inscrições em Cursos",
  directus_users: "Usuários do Sistema",
  directus_roles: "Perfis de Acesso",
};

const friendlyCollection = (c: string) => FRIENDLY_COLLECTIONS[c] || c;

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case "create":
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Criação</Badge>;
    case "update":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Edição</Badge>;
    case "delete":
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50">Exclusão</Badge>;
    case "login":
    case "authenticate":
      return <Badge className="bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50">Autenticação</Badge>;
    default:
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50">{action}</Badge>;
  }
}

const getInitials = (first?: string | null, last?: string | null) => {
  const a = (first || "").trim();
  const b = (last || "").trim();
  if (a && b) return (a[0] + b[0]).toUpperCase();
  if (a) return a.substring(0, 2).toUpperCase();
  return "US";
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return d;
  }
};

interface PerfilClientProps {
  perfil: MeuPerfil;
  initialLogs: AuditLog[];
  initialMeta: { filter_count: number; total_count: number };
}

export function PerfilClient({ perfil, initialLogs, initialMeta }: PerfilClientProps) {
  const nomeCompleto =
    [perfil.first_name, perfil.last_name].filter(Boolean).join(" ") || "Usuário";

  // Atividade
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const limit = 15;
  const totalPages = Math.max(1, Math.ceil((meta?.filter_count || 0) / limit));

  const loadPage = async (p: number) => {
    setLoadingLogs(true);
    try {
      const res = await getAuditLogs({ user: perfil.id, page: p, limit });
      if (res.success) {
        setLogs(res.data);
        setMeta(res.meta);
        setPage(p);
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  // Alteração de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação não corresponde à nova senha.");
      return;
    }
    startTransition(async () => {
      const res = await changeMyPassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Falha ao alterar senha.");
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho do perfil */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-bold text-xl border border-purple-200/50 shadow-sm">
          {getInitials(perfil.first_name, perfil.last_name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{nomeCompleto}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            {perfil.role?.name || "Sem perfil"}
          </div>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Dados */}
        <TabsContent value="dados">
          <Card>
            <CardContent className="p-6 grid gap-5 md:grid-cols-2">
              <InfoRow icon={User} label="Nome completo" value={nomeCompleto} />
              <InfoRow icon={Mail} label="E-mail" value={perfil.email || "—"} />
              <InfoRow icon={Shield} label="Perfil de acesso" value={perfil.role?.name || "—"} />
              <InfoRow icon={Briefcase} label="Cargo" value={perfil.title || "—"} />
              <InfoRow icon={MapPin} label="Localização" value={perfil.location || "—"} />
              <InfoRow icon={Clock} label="Último acesso" value={fmtDate(perfil.last_access)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Atividade */}
        <TabsContent value="atividade">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Minhas operações no sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma operação registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className={loadingLogs ? "opacity-60" : ""}>
                          <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                            {fmtDate(log.timestamp)}
                          </TableCell>
                          <TableCell><ActionBadge action={log.action} /></TableCell>
                          <TableCell className="text-sm font-medium text-slate-800">
                            {friendlyCollection(log.collection)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 font-mono">
                            {log.item ? `#${log.item}` : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {meta?.filter_count || 0} operações
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loadingLogs}
                    onClick={() => loadPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loadingLogs}
                    onClick={() => loadPage(page + 1)}
                  >
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" />
                Alterar senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <p className="text-sm text-muted-foreground">
                A senha é a mesma usada para entrar no sistema. Informe a senha atual
                para confirmar a alteração.
              </p>
              <div className="space-y-2">
                <Label htmlFor="senha-atual">Senha atual</Label>
                <Input
                  id="senha-atual"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-nova">Nova senha</Label>
                <Input
                  id="senha-nova"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-conf">Confirmar nova senha</Label>
                <Input
                  id="senha-conf"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
                  className="gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Alterar senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}
