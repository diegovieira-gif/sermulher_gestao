"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BeneficiariaForm } from "./beneficiaria-form";
import { deleteBeneficiaria } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  MapPin,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";
import { formatDateDisplay } from "@/lib/utils";
import type { Beneficiaria } from "./schemas";

const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return "-";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

interface BeneficiariasClientProps {
  initialData: any[]; // Changed from beneficiarias
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  // searchParams removed
  formOptions: {
    racas: any[];
    estadosCivis: any[];
    escolaridades: any[];
    situacoesTrabalho: any[];
    bairros: any[];
  } | null;
}

export function BeneficiariasClient({
  initialData,
  meta,
  formOptions,
}: BeneficiariasClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Use hook instead of prop

  // Estados locais
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBeneficiaria, setSelectedBeneficiaria] =
    useState<Beneficiaria | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca e Exportação
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("q") || ""
  );
  const [isExporting, setIsExporting] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      // Se o termo de busca mudou, reseta para a página 1 (mas evita loop se o searchTerm for igual ao da url)
      if (searchTerm !== (searchParams.get("q") || "")) {
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [searchTerm, router, pathname, searchParams]);

  // Use initialData directly, filtering is done on server
  const filteredData = initialData;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Usar filteredData (que agora é o dado retornado do servidor)
      if (filteredData.length > 0) {
        // Gerar CSV
        const headers = [
          "Nome Completo",
          "CPF",
          "Telefone",
          "Data Nascimento",
          "Bairro",
          "Cidade",
        ];
        const rows = filteredData.map((b: any) => [
          b.nome_completo,
          b.cpf || "",
          b.telefone || "",
          b.data_nascimento || "",
          b.endereco?.bairro || "",
          b.endereco?.cidade || "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((r: any[]) =>
            r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `beneficiarias_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
      } else {
        toast.error("Nenhum dado para exportar.");
      }
    } catch (e) {
      toast.error("Erro ao exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (beneficiaria: Beneficiaria) => {
    setSelectedBeneficiaria(beneficiaria);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!idToDelete) return;
    setIsDeleting(true);
    const result = await deleteBeneficiaria(idToDelete);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setIdToDelete(null);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beneficiárias</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro das mulheres atendidas ({meta.total} registros).
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedBeneficiaria(null);
            setFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Beneficiária
        </Button>
      </div>

      {/* Barra de Ferramentas */}
      <div className="flex gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-9 bg-transparent border-none focus-visible:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75">
              <TableHead className="font-semibold text-slate-700">Beneficiária</TableHead>
              <TableHead className="font-semibold text-slate-700">CPF</TableHead>
              <TableHead className="font-semibold text-slate-700">Contato</TableHead>
              <TableHead className="font-semibold text-slate-700">Localização</TableHead>
              <TableHead className="font-semibold text-slate-700">Idade</TableHead>
              <TableHead className="font-semibold text-slate-700">Cadastro</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((b: any) => (
                <TableRow key={b.id} className="hover:bg-slate-50/40 transition-colors duration-200">
                  <TableCell className="font-medium py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-semibold text-xs border border-purple-200/50 shadow-sm">
                        {getInitials(b.nome_completo)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-none">{b.nome_completo}</span>
                        {b.nome_social && (
                          <span className="text-xs text-slate-500 mt-1 italic">
                            Nome social: {b.nome_social}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                          {b.possui_medida_protetiva && (
                            <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] py-0 px-1.5 font-medium hover:bg-red-50">
                              Medida Protetiva
                            </Badge>
                          )}
                          {b.recebe_bolsa_familia && (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0 px-1.5 font-medium hover:bg-emerald-50">
                              Bolsa Família
                            </Badge>
                          )}
                          {b.recebe_bpc && (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] py-0 px-1.5 font-medium hover:bg-blue-50">
                              BPC
                            </Badge>
                          )}
                          {b.origem_dado === "importacao_odoo" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] py-0 px-1.5 font-medium hover:bg-amber-50">
                              Importado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {formatCPF(b.cpf)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-800 text-sm font-medium">{formatPhone(b.telefone)}</span>
                      {b.email && (
                        <span className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[180px]">
                          {b.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.endereco?.cidade || b.endereco?.bairro ? (
                      <div className="flex items-start gap-1 text-slate-800 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{b.endereco.bairro || "-"}</span>
                          <span className="text-slate-500 text-xs mt-1">{b.endereco.cidade || "-"}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.data_nascimento ? (
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-sm font-medium">
                          {(() => {
                            const today = new Date();
                            const birthDate = new Date(b.data_nascimento);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (
                              m < 0 ||
                              (m === 0 && today.getDate() < birthDate.getDate())
                            ) {
                              age--;
                            }
                            return age + " anos";
                          })()}
                        </span>
                        <span className="text-slate-400 text-xs font-mono mt-0.5">
                          {formatDateDisplay(b.data_nascimento)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.created_at ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-slate-800 text-sm font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateDisplay(b.created_at)}</span>
                        </div>
                        {b.updated_at && b.updated_at !== b.created_at && (
                          <span className="text-[10px] text-slate-400 mt-1 pl-4.5">
                            Atu: {formatDateDisplay(b.updated_at)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/mulheres/beneficiarias/${b.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                        onClick={() => handleEdit(b)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                        onClick={() => handleDeleteClick(b.id)}
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Itens por página:</span>
          <Select
            value={String(meta.limit)}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams);
              params.set("limit", value);
              params.set("page", "1"); // Resetar para a primeira página
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue placeholder={String(meta.limit)} />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-500">
          Mostrando <strong>{(meta.page - 1) * meta.limit + 1}</strong> a{" "}
          <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> de{" "}
          <strong>{meta.total}</strong> resultados
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <div className="flex items-center justify-center px-4 font-medium text-sm">
            Página {meta.page} de {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
          >
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <BeneficiariaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedBeneficiaria(null);
        }}
        beneficiaria={selectedBeneficiaria}
        formOptions={formOptions || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A beneficiária será excluída
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
