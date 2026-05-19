"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createProposta,
  createSiteConfig,
  deleteProposta,
  updateProposta,
  updateSiteConfig,
} from "./actions";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const siteConfigSchema = z.object({
  titulo: z.string().default(""),
  subtitulo: z.string().default(""),
  biografia: z.string().default(""),
  cor_principal: z.string().default(""),
  telefone: z.string().default(""),
  email: z.string().default(""),
  instagram: z.string().default(""),
  facebook: z.string().default(""),
  whatsapp: z.string().default(""),
  website: z.string().default(""),
});

const propostaSchema = z.object({
  titulo: z.string().default(""),
  descricao: z.string().default(""),
  link: z.string().default(""),
  imagem: z.string().default(""),
  ordem: z.coerce.number().optional(),
  status: z.enum(["published", "draft", "archived"]).default("published"),
});

type SiteConfigFormValues = z.infer<typeof siteConfigSchema>;
type PropostaFormValues = z.infer<typeof propostaSchema>;

type SiteConfigRecord = SiteConfigFormValues & {
  id?: string | number;
  redes_sociais?:
    | {
        instagram?: string;
        facebook?: string;
        whatsapp?: string;
        website?: string;
      }
    | string
    | null;
};

type PropostaRecord = PropostaFormValues & {
  id?: string | number;
};

type SiteManagementClientProps = {
  initialConfig: SiteConfigRecord | null;
  initialPropostas: PropostaRecord[];
};

function normalizeSocials(config: SiteConfigRecord | null): SiteConfigFormValues {
  const socials = config?.redes_sociais;
  const parsedSocials =
    typeof socials === "string"
      ? (() => {
          try {
            return JSON.parse(socials);
          } catch {
            return {};
          }
        })()
      : socials ?? {};

  return {
    titulo: config?.titulo ?? "",
    subtitulo: config?.subtitulo ?? "",
    biografia: config?.biografia ?? "",
    cor_principal: config?.cor_principal ?? "",
    telefone: config?.telefone ?? "",
    email: config?.email ?? "",
    instagram: parsedSocials?.instagram ?? "",
    facebook: parsedSocials?.facebook ?? "",
    whatsapp: parsedSocials?.whatsapp ?? "",
    website: parsedSocials?.website ?? "",
  };
}

function getProposalDefaults(proposta?: PropostaRecord | null): PropostaFormValues {
  return {
    titulo: proposta?.titulo ?? "",
    descricao: proposta?.descricao ?? "",
    link: proposta?.link ?? "",
    imagem: proposta?.imagem ?? "",
    ordem: proposta?.ordem ?? 1,
    status: proposta?.status ?? "published",
  };
}

export function SiteManagementClient({
  initialConfig,
  initialPropostas,
}: SiteManagementClientProps) {
  const [siteConfig, setSiteConfig] = useState<SiteConfigRecord | null>(initialConfig);
  const [propostas, setPropostas] = useState<PropostaRecord[]>(initialPropostas);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PropostaRecord | null>(null);
  const [editingProposalId, setEditingProposalId] = useState<string | number | null>(null);

  const configForm = useForm<SiteConfigFormValues>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: normalizeSocials(initialConfig),
  });

  const proposalForm = useForm<PropostaFormValues>({
    resolver: zodResolver(propostaSchema),
    defaultValues: getProposalDefaults(null),
  });

  useEffect(() => {
    configForm.reset(normalizeSocials(siteConfig));
  }, [configForm, siteConfig]);

  function openCreateProposal() {
    proposalForm.reset(getProposalDefaults(null));
    setEditingProposalId(null);
    setProposalDialogOpen(true);
  }

  function openEditProposal(proposta: PropostaRecord) {
    proposalForm.reset(getProposalDefaults(proposta));
    setEditingProposalId(proposta.id ?? null);
    setProposalDialogOpen(true);
    setDeleteTarget(null);
  }

  async function handleSaveConfig(values: SiteConfigFormValues) {
    setIsSavingConfig(true);

    const payload = {
      titulo: values.titulo,
      subtitulo: values.subtitulo,
      biografia: values.biografia,
      cor_principal: values.cor_principal,
      telefone: values.telefone,
      email: values.email,
      redes_sociais: {
        instagram: values.instagram,
        facebook: values.facebook,
        whatsapp: values.whatsapp,
        website: values.website,
      },
    };

    try {
      const result = siteConfig?.id
        ? await updateSiteConfig(siteConfig.id, payload)
        : await createSiteConfig(payload);

      if (!result.success) {
        toast.error(result.error || "Não foi possível salvar as configurações.");
        return;
      }

      setSiteConfig(result.data ?? { ...siteConfig, ...payload });
      toast.success("Configurações do site atualizadas.");
    } finally {
      setIsSavingConfig(false);
    }
  }

  async function handleSaveProposal(values: PropostaFormValues) {
    const payload = {
      titulo: values.titulo,
      descricao: values.descricao,
      link: values.link,
      imagem: values.imagem,
      ordem: values.ordem ?? 1,
      status: values.status,
    };

    const result = editingProposalId
      ? await updateProposta(editingProposalId, payload)
      : await createProposta(payload);

    if (!result.success) {
      toast.error(result.error || "Não foi possível salvar a proposta.");
      return;
    }

    const savedProposal = result.data ?? {
      ...payload,
      id: editingProposalId ?? Date.now(),
    };

    setPropostas((currentList) => {
      const existingIndex = currentList.findIndex((item) => item.id === savedProposal.id);

      if (existingIndex >= 0) {
        const nextList = [...currentList];
        nextList[existingIndex] = savedProposal;
        return nextList;
      }

      return [savedProposal, ...currentList];
    });

    setProposalDialogOpen(false);
    toast.success(editingProposalId ? "Proposta atualizada." : "Proposta criada.");
  }

  async function confirmDeleteProposal() {
    if (!deleteTarget?.id) {
      return;
    }

    const result = await deleteProposta(deleteTarget.id);

    if (!result.success) {
      toast.error(result.error || "Não foi possível excluir a proposta.");
      return;
    }

    setPropostas((currentList) => currentList.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Proposta excluída.");
  }

  return (
    <Tabs defaultValue="gerais" className="space-y-6">
      <TabsList className="grid w-full max-w-xl grid-cols-2 bg-slate-100">
        <TabsTrigger value="gerais">Configurações Gerais</TabsTrigger>
        <TabsTrigger value="propostas">Propostas</TabsTrigger>
      </TabsList>

      <TabsContent value="gerais" className="mt-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Identidade do site</CardTitle>
            <CardDescription>
              Edite as informações públicas exibidas no site oficial do projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...configForm}>
              <form
                className="space-y-6"
                onSubmit={configForm.handleSubmit(handleSaveConfig)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={configForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={configForm.control}
                    name="subtitulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={configForm.control}
                    name="cor_principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor Principal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="#1D4ED8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={configForm.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(00) 00000-0000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={configForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contato@exemplo.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={configForm.control}
                  name="biografia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografia</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} placeholder="Texto institucional exibido no site." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Redes Sociais</h3>
                    <p className="text-sm text-slate-500">
                      Preencha os links que devem aparecer no site público.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={configForm.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://instagram.com/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://facebook.com/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://wa.me/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://seusite.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingConfig} className="min-w-40">
                    {isSavingConfig ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando
                      </>
                    ) : (
                      "Salvar configurações"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="propostas" className="mt-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Propostas do Site</CardTitle>
              <CardDescription>
                Organize os cards, blocos ou destaques que aparecem na página pública.
              </CardDescription>
            </div>

            <Button onClick={openCreateProposal} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Nova
            </Button>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propostas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-slate-500">
                        Nenhuma proposta cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    propostas.map((proposta) => (
                      <TableRow key={String(proposta.id)}>
                        <TableCell className="font-medium text-slate-900">
                          {proposta.titulo || "Sem título"}
                        </TableCell>
                        <TableCell>{proposta.ordem ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={proposta.status === "published" ? "default" : "secondary"}
                          >
                            {proposta.status ?? "published"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditProposal(proposta)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(proposta)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProposalId ? "Editar proposta" : "Nova proposta"}
            </DialogTitle>
            <DialogDescription>
              Atualize os dados exibidos na área pública do site.
            </DialogDescription>
          </DialogHeader>

          <Form {...proposalForm}>
            <form
              className="space-y-4"
              onSubmit={proposalForm.handleSubmit(handleSaveProposal)}
            >
              <FormField
                control={proposalForm.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={proposalForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={proposalForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={proposalForm.control}
                  name="imagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="URL da imagem" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={proposalForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={proposalForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="published">published</option>
                          <option value="draft">draft</option>
                          <option value="archived">archived</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProposalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar proposta</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será removida do site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProposal}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}