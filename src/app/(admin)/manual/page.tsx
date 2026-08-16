import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  LayoutDashboard,
  HeartHandshake,
  GraduationCap,
  ShieldAlert,
  GitPullRequest,
  Calendar,
  FileText,
  Megaphone,
  Settings,
  Compass,
  Smartphone,
  Lock,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  Search,
  Download,
  Users,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Globe,
  UserCog,
  KeyRound,
  ListFilter,
  History,
  type LucideIcon,
} from "lucide-react";

/* ----------------------------------------------------------------------------
 * Componentes visuais reutilizáveis (ilustrações renderizadas em tela —
 * não dependem de capturas de tela que ficariam desatualizadas).
 * ------------------------------------------------------------------------- */

function Callout({
  variant = "tip",
  title,
  children,
}: {
  variant?: "tip" | "warn" | "new";
  title: string;
  children: ReactNode;
}) {
  const map = {
    tip: { wrap: "border-primary/30 bg-primary/5", ic: "text-primary", Icon: Lightbulb },
    warn: {
      wrap: "border-amber-500/30 bg-amber-500/10",
      ic: "text-amber-600",
      Icon: AlertTriangle,
    },
    new: {
      wrap: "border-emerald-500/30 bg-emerald-500/10",
      ic: "text-emerald-600",
      Icon: Sparkles,
    },
  }[variant];
  const Icon = map.Icon;
  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${map.wrap}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${map.ic}`} />
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{title}</p>
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </span>
          <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Ilustração do menu lateral, espelhando os itens reais. */
function SidebarMap() {
  const main: { label: string; icon: LucideIcon }[] = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Gestão de Demandas", icon: GitPullRequest },
    { label: "Agenda Institucional", icon: Calendar },
    { label: "Marketing e Comunicação", icon: Megaphone },
    { label: "Gestão de Mulheres", icon: HeartHandshake },
    { label: "CRAM", icon: ClipboardList },
    { label: "Escola da Mulher", icon: GraduationCap },
    { label: "Sala Azul", icon: ShieldAlert },
    { label: "Relatórios", icon: FileText },
    { label: "Observatório", icon: LayoutDashboard },
    { label: "App Amar", icon: Smartphone },
  ];
  const system: { label: string; icon: LucideIcon }[] = [
    { label: "Manual do Usuário", icon: Book },
    { label: "Configurações", icon: Settings },
    { label: "Meu Site", icon: Globe },
    { label: "Sair", icon: LogOut },
  ];
  const Row = ({ label, icon: Icon, active }: { label: string; icon: LucideIcon; active?: boolean }) => (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
  return (
    <div className="w-full max-w-xs rounded-xl border border-border bg-sidebar p-3 shadow-sm">
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Menu Principal
      </p>
      <div className="space-y-0.5">
        {main.map((m, i) => (
          <Row key={m.label} {...m} active={i === 0} />
        ))}
      </div>
      <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sistema
      </p>
      <div className="space-y-0.5">
        {system.map((m) => (
          <Row key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}

/** Ilustração do quadro Kanban de Gestão de Demandas. */
function KanbanIllustration() {
  const cols = [
    { title: "Aguardando", color: "border-t-amber-500", cards: ["Triagem · Maria S.", "Encaminhamento Jurídico"] },
    { title: "Em Análise", color: "border-t-sky-500", cards: ["Acompanhamento Psicossocial"] },
    { title: "Concluído", color: "border-t-emerald-500", cards: ["Benefício entregue · Ana P."] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cols.map((c) => (
        <div
          key={c.title}
          className={`rounded-lg border border-t-4 ${c.color} bg-muted/40 p-3`}
        >
          <p className="mb-2 text-xs font-semibold text-foreground">{c.title}</p>
          <div className="space-y-2">
            {c.cards.map((card) => (
              <div
                key={card}
                className="rounded-md border bg-card p-2 text-xs text-muted-foreground shadow-sm"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ilustração de cartões de KPI do Dashboard. */
function KpiIllustration() {
  const kpis = [
    { label: "Atendimentos (Mês)", value: "128", accent: "border-l-primary", Icon: ClipboardList },
    { label: "Mulheres Ativas", value: "1.461", accent: "border-l-fuchsia-500", Icon: Users },
    { label: "Eventos (7 dias)", value: "6", accent: "border-l-sky-500", Icon: Calendar },
    { label: "Pendências", value: "3", accent: "border-l-amber-500", Icon: AlertTriangle },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const Icon = k.Icon;
        return (
          <div
            key={k.label}
            className={`rounded-lg border border-l-4 ${k.accent} bg-card p-3 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                {k.label}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Exemplos visuais de selos de status/prioridade. */
function BadgeShowcase() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-600">
        Alta prioridade
      </span>
      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600">
        Em análise
      </span>
      <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-600">
        Em andamento
      </span>
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
        Concluído
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Casca de seção
 * ------------------------------------------------------------------------- */

function Section({
  id,
  number,
  title,
  description,
  icon: Icon,
  iconClass = "text-primary",
  children,
}: {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className={`h-5 w-5 ${iconClass}`} />
          </span>
          <span>
            <span className="mr-1 text-muted-foreground">{number}.</span>
            {title}
          </span>
        </CardTitle>
        <CardDescription className="pl-12">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------------------------
 * Página
 * ------------------------------------------------------------------------- */

const TOC: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "primeiros-passos", label: "Primeiros Passos", icon: Compass },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "mulheres", label: "Gestão de Mulheres", icon: HeartHandshake },
  { id: "cram", label: "CRAM", icon: ClipboardList },
  { id: "demandas", label: "Gestão de Demandas", icon: GitPullRequest },
  { id: "agenda", label: "Agenda Institucional", icon: Calendar },
  { id: "escola", label: "Escola da Mulher", icon: GraduationCap },
  { id: "sala-azul", label: "Sala Azul", icon: ShieldAlert },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "observatorio", label: "Observatório", icon: LayoutDashboard },
  { id: "app-amar", label: "App Amar", icon: Smartphone },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "perfil", label: "Meu Perfil", icon: UserCog },
  { id: "permissoes", label: "Controle de Acesso", icon: Lock },
];

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 p-8 text-white shadow-lg md:p-10">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Book className="h-7 w-7" />
            </span>
            <div className="flex gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                Versão 1.2
              </Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                Atualizado em {new Date().getFullYear()}
              </Badge>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Manual do Usuário
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/85">
            Guia completo do <strong>Portal SERMULHER</strong> — o Sistema
            Integrado de Gestão, Monitoramento e Acolhimento da Secretaria
            Municipal do Respeito às Políticas para as Mulheres. Aprenda, módulo
            a módulo, a registrar atendimentos, organizar demandas, gerir cursos
            e gerar relatórios oficiais.
          </p>
        </div>
      </div>

      {/* Sumário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="h-5 w-5 text-primary" />
            Sumário
          </CardTitle>
          <CardDescription>
            Clique em um tópico para ir direto à seção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOC.map((t) => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {t.label}
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 1. Primeiros Passos */}
      <Section
        id="primeiros-passos"
        number={1}
        title="Primeiros Passos"
        description="Acesso, navegação e estrutura geral do sistema."
        icon={Compass}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Como acessar</h3>
            <Steps
              items={[
                <>
                  Abra o sistema e informe seu <strong>e-mail institucional</strong>{" "}
                  e <strong>senha</strong> na tela de login.
                </>,
                <>
                  Suas credenciais são as mesmas cadastradas no Directus pela
                  equipe de TI/administração.
                </>,
                <>
                  Após entrar, você cai direto no <strong>Dashboard</strong>.
                </>,
              ]}
            />
            <Callout variant="tip" title="Esqueceu a senha?">
              Procure um administrador do sistema. As contas são gerenciadas
              centralmente — por segurança, a redefinição é feita pela equipe
              responsável.
            </Callout>
            <Callout variant="warn" title="Limite de tentativas">
              Após <strong>5 senhas erradas</strong> na mesma conta, o acesso
              fica bloqueado por cerca de 15 minutos. O bloqueio é por conta,
              não pela rede — o erro de uma colega não impede as demais de
              entrar.
            </Callout>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">O menu lateral</h3>
            <p className="text-sm text-muted-foreground">
              Toda a navegação acontece pelo menu à esquerda, dividido em{" "}
              <strong>Menu Principal</strong> (os módulos de trabalho) e{" "}
              <strong>Sistema</strong> (manual, configurações e sair). O item em
              destaque (roxo) indica onde você está.
            </p>
            <SidebarMap />
          </div>
        </div>
        <Callout variant="new" title="Itens do menu podem variar conforme seu perfil">
          Administradores podem definir quais módulos cada perfil de usuário
          enxerga. Se algum item não aparece para você, é porque seu perfil não
          tem acesso a ele — veja a seção{" "}
          <a href="#permissoes" className="font-medium text-primary underline">
            Permissões de Menu
          </a>
          .
        </Callout>
      </Section>

      {/* 2. Dashboard */}
      <Section
        id="dashboard"
        number={2}
        title="Dashboard"
        description="Sua central de indicadores e atalhos do dia a dia."
        icon={LayoutDashboard}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          O Dashboard é a tela inicial. Ele reúne, em tempo real, os principais
          indicadores (KPIs) da secretaria e atalhos para as ações mais comuns.
        </p>
        <KpiIllustration />
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="d1">
            <AccordionTrigger>O que cada indicador mostra</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Atendimentos (Mês):</strong> total de atendimentos
                registrados no mês corrente.
              </p>
              <p>
                <strong>Mulheres Ativas:</strong> beneficiárias em acompanhamento.
              </p>
              <p>
                <strong>Eventos:</strong> compromissos agendados para os próximos
                dias.
              </p>
              <p>
                <strong>Pendências:</strong> casos aguardando triagem ou
                providência.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="d2">
            <AccordionTrigger>Gráficos e Agenda Rápida</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              O bloco <strong>Fluxo de Atendimentos</strong> mostra a evolução
              diária no período. A <strong>Agenda Rápida</strong> lista os
              próximos compromissos. Os botões{" "}
              <strong>Novo Atendimento</strong> e <strong>Sala Azul</strong> dão
              acesso imediato às rotinas mais usadas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="d3">
            <AccordionTrigger>
              Mudar o período de referência{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              O seletor de <strong>mês/ano</strong> no topo muda o período dos
              indicadores mensais e do gráfico — útil para responder &quot;como
              foi em junho?&quot;. Totais acumulados (beneficiárias cadastradas,
              turmas ativas) não mudam, pois não são mensais. O padrão é o mês
              corrente.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 3. Gestão de Mulheres */}
      <Section
        id="mulheres"
        number={3}
        title="Gestão de Mulheres"
        description="Cadastro de beneficiárias, atendimentos e prontuário eletrônico."
        icon={HeartHandshake}
        iconClass="text-fuchsia-600"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">Beneficiárias</p>
            <p className="text-xs text-muted-foreground">Cadastro e busca</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <ClipboardList className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">Atendimentos</p>
            <p className="text-xs text-muted-foreground">Prontuário e protocolo</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <LayoutDashboard className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">Indicadores</p>
            <p className="text-xs text-muted-foreground">Visão do módulo</p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="m1">
            <AccordionTrigger>Cadastrar uma nova beneficiária</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Steps
                items={[
                  <>
                    Acesse <strong>Gestão de Mulheres → Beneficiárias</strong>.
                  </>,
                  <>
                    Clique em <strong>Nova Beneficiária</strong> (botão roxo no
                    topo direito).
                  </>,
                  <>Preencha os dados e salve.</>,
                ]}
              />
              <Callout variant="new" title="Cadastro simplificado">
                Apenas o <strong>Nome Completo</strong> é obrigatório no início.
                CPF, endereço, telefone e demais dados podem ser completados
                depois, conforme o atendimento avança.
              </Callout>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m2">
            <AccordionTrigger>Buscar e exportar dados</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Use a barra <em>“Buscar por nome ou CPF…”</em> para localizar uma
                beneficiária rapidamente.
              </p>
              <p className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                O botão <strong>Exportar CSV</strong> baixa a lista atual
                (respeitando a busca) com <strong>todos os campos gravados</strong>
                : identificação, contato, endereço, dados sociais, marcadores e
                quem criou ou alterou o registro. Marcando linhas na caixa de
                seleção, a exportação cobre apenas as selecionadas.
              </p>
              <Callout variant="warn" title="Exportar não é fazer backup">
                O arquivo cobre apenas as beneficiárias. Atendimentos, CRAM,
                tramitações e os vínculos entre eles não estão nele — para isso é
                preciso backup do banco de dados.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="m7">
            <AccordionTrigger>
              Completude da ficha{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Ao salvar um cadastro, o sistema mostra o quanto a ficha está
                <strong> completa</strong> e lista o que falta, do mais
                importante para o menos.
              </p>
              <p>
                Os campos têm pesos diferentes:{" "}
                <strong>telefone e bairro</strong> pesam mais porque sem eles a
                beneficiária fica fora das campanhas;{" "}
                <strong>raça/cor e escolaridade</strong> alimentam os relatórios
                oficiais.
              </p>
              <p>
                <strong>Completar agora</strong> devolve o foco aos campos sem
                sair da ficha — o registro já foi salvo, e continuar preenchendo
                atualiza o mesmo cadastro.
              </p>
              <Callout variant="tip" title="Telefone validado conta à parte">
                Um telefone preenchido mas não confirmado com a beneficiária é
                diferente de um telefone ausente, por isso o aviso aparece
                separado do percentual.
              </Callout>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m8">
            <AccordionTrigger>
              Linha do Tempo{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                A aba <strong>Linha do Tempo</strong> da ficha reúne, em ordem
                cronológica, tudo o que aconteceu com a beneficiária:
                atendimentos, instrumentais do CRAM, benefícios entregues,
                eventos e cursos.
              </p>
              <p>
                É o resumo do caso para consultar <strong>antes de um
                atendimento</strong>. Itens com tela própria (atendimento, CRAM)
                são clicáveis e abrem o registro completo.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m9">
            <AccordionTrigger>
              Rascunho automático{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Os formulários grandes — <strong>beneficiária</strong>,{" "}
                <strong>atendimento</strong> e <strong>Instrumental CRAM</strong>{" "}
                — salvam um rascunho no computador enquanto você digita. Se a
                sessão expirar ou a aba fechar sem querer, reabra o formulário:
                uma faixa amarela oferece <strong>Recuperar</strong> ou{" "}
                <strong>Descartar</strong>.
              </p>
              <p>
                O rascunho é apagado ao salvar com sucesso e expira em 24 horas.
                O navegador também avisa antes de fechar a aba com alterações
                não salvas — e, se um campo obrigatório de outra aba impedir o
                salvamento, um aviso indica <strong>em qual aba</strong> está a
                pendência.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m3">
            <AccordionTrigger>Registrar um atendimento</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              No perfil da beneficiária, clique em{" "}
              <strong>Novo Atendimento</strong>. Informe o tipo de violência (se
              houver) e relate o ocorrido. O sistema gera automaticamente um{" "}
              <strong>número de protocolo</strong> e abre o{" "}
              <strong>prontuário eletrônico</strong>, onde todo o histórico fica
              registrado.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m4">
            <AccordionTrigger>Tramitações (encaminhamentos)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Dentro de um atendimento, use as <strong>Tramitações</strong> para
              encaminhar o caso a outro setor (Jurídico, Psicossocial, etc.).
              Isso cria automaticamente uma pendência na{" "}
              <a href="#demandas" className="font-medium text-primary underline">
                Gestão de Demandas
              </a>{" "}
              do setor de destino.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m5">
            <AccordionTrigger>
              Eventos e Cursos da beneficiária{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <Callout variant="tip" title="Como chegar à ficha completa">
                Na lista de beneficiárias, clique no <strong>nome</strong> dela —
                ou no botão de <strong>ficha</strong> (ícone de documento) na
                linha. É lá que ficam as abas abaixo. O botão de lápis abre
                apenas o formulário de dados cadastrais.
              </Callout>
              <p>
                Para ir <strong>direto a uma aba</strong>, use o botão de{" "}
                <strong>vínculos</strong> (ícone de elo, em verde-azulado) na
                linha da beneficiária: ele abre um menu com Benefícios, Eventos e
                Cursos, e leva à aba escolhida já aberta.
              </p>
              <p>
                Na ficha da beneficiária, as abas <strong>Eventos</strong> e{" "}
                <strong>Cursos</strong> registram de quais eventos/campanhas e
                cursos ela participou. Clique em <strong>Registrar</strong>,
                escolha o item, informe a data e uma observação opcional.
              </p>
              <p>
                Ao escolher um evento, a <strong>data é sugerida</strong>: se
                hoje está dentro do período dele, hoje; senão, a data de início.
                Um aviso aparece se a data ficar fora do período — alerta, não
                bloqueio, já que registrar depois pode ser legítimo.
              </p>
              <p>
                A aba <strong>Benefícios</strong> continua registrando as entregas
                de benefícios da mesma forma.
              </p>
              <p>
                Pelo lado do evento existe a visão inversa — a lista de quem
                participou. Veja{" "}
                <a href="#agenda" className="font-medium text-primary underline">
                  Agenda Institucional
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="m6">
            <AccordionTrigger>
              Filtros e telefone validado{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-primary" />
                O botão <strong>Filtros</strong> abre um painel para refinar a
                lista por <strong>bairro</strong>, ordenação e marcadores
                (Medida Protetiva, Bolsa Família, BPC). Os filtros ativos
                aparecem como etiquetas removíveis.
              </p>
              <p>
                No cadastro, o campo <strong>Telefone validado</strong> permite
                marcar que o número foi confirmado com a beneficiária.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 4. CRAM */}
      <Section
        id="cram"
        number={4}
        title="CRAM — Instrumental de Atendimento"
        description="Centro de Referência de Atendimento à Mulher em Situação de Violência: o formulário completo de acolhimento e o Plano Individual."
        icon={ClipboardList}
        iconClass="text-rose-600"
      >
        <Callout variant="new" title="Para que serve este módulo">
          O <strong>CRAM</strong> reproduz no sistema o{" "}
          <strong>Instrumental de Atendimento</strong> em papel — o formulário
          longo preenchido no acolhimento, com o contexto socioassistencial,
          jurídico e psicológico da assistida. Ele é <em>separado</em> do cadastro
          de beneficiárias: lá ficam os dados pessoais, aqui fica a história do
          atendimento.
        </Callout>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <ClipboardList className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">Instrumental</p>
            <p className="text-xs text-muted-foreground">4 partes do formulário</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">Risco</p>
            <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <History className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground">PIA</p>
            <p className="text-xs text-muted-foreground">Plano e evolução</p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="c1">
            <AccordionTrigger>Registrar um novo atendimento</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Steps
                items={[
                  <>
                    Acesse <strong>CRAM → Novo Atendimento</strong>.
                  </>,
                  <>
                    Busque a <strong>assistida</strong> pelo nome ou CPF. Ela
                    precisa já estar cadastrada em{" "}
                    <a
                      href="#mulheres"
                      className="font-medium text-primary underline"
                    >
                      Gestão de Mulheres
                    </a>
                    .
                  </>,
                  <>
                    Informe <strong>data</strong> e <strong>turno</strong>, e
                    percorra as quatro abas preenchendo o que a assistida
                    relatar.
                  </>,
                  <>
                    Clique em <strong>Registrar atendimento</strong>. Você pode
                    voltar e completar depois — deixe o status em{" "}
                    <em>Em preenchimento</em> até concluir.
                  </>,
                ]}
              />
              <Callout variant="tip" title="Não precisa preencher tudo de uma vez">
                Só <strong>assistida</strong> e <strong>data</strong> são
                obrigatórias. O acolhimento raramente cobre o formulário inteiro
                no primeiro encontro — salve o que tem e complete nos próximos.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c2">
            <AccordionTrigger>As quatro abas do formulário</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Atendimento</strong> — como a
                assistida chegou ao serviço (espontânea ou encaminhada, e por
                qual instituição), se possui medida protetiva, qual serviço
                buscou, e os documentos que não ficam no prontuário:{" "}
                <strong>RG</strong> e <strong>Cartão SUS</strong>.
              </p>
              <p>
                <strong className="text-foreground">I · Socioassistencial</strong>{" "}
                — situação do imóvel e saneamento, deficiência, saúde (problemas,
                tabagismo, drogas, álcool), escolaridade e renda, benefícios
                recebidos, a <strong>composição domiciliar</strong>, endereço
                alternativo, serviços que frequenta, a caracterização da
                violência e a identificação do autor.
              </p>
              <p>
                <strong className="text-foreground">II · Jurídico</strong> — qual
                orientação jurídica a assistida precisa, situação do Boletim de
                Ocorrência (inclusive se foi feito por nós durante o atendimento)
                e para qual órgão ela foi encaminhada.
              </p>
              <p>
                <strong className="text-foreground">III · Psicológico</strong> —
                as seis perguntas padronizadas de avaliação de risco e o{" "}
                <strong>resumo da psicóloga</strong>.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c3">
            <AccordionTrigger>Composição domiciliar</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Na aba <strong>I · Socioassistencial</strong>, o botão{" "}
                <strong>Adicionar membro</strong> cria uma linha na tabela com
                nome, parentesco, idade, escolaridade, ocupação/renda e
                benefício. Adicione uma linha por pessoa que mora com a
                assistida.
              </p>
              <p>
                As linhas são salvas junto com o instrumental — não há botão de
                salvar separado para a tabela.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c4">
            <AccordionTrigger>
              Como o nível de risco é calculado{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                A lista do CRAM mostra um selo de risco para cada atendimento. Ele
                conta quantas das <strong>seis perguntas</strong> da aba
                Psicológico foram respondidas com <strong>“Sim”</strong>:
              </p>
              <div className="grid gap-2 sm:grid-cols-4">
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-center">
                  <p className="text-xs font-semibold text-red-800">Alto</p>
                  <p className="text-xs text-red-700">4 ou mais</p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-center">
                  <p className="text-xs font-semibold text-amber-800">Médio</p>
                  <p className="text-xs text-amber-700">2 ou 3</p>
                </div>
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-center">
                  <p className="text-xs font-semibold text-yellow-800">Baixo</p>
                  <p className="text-xs text-yellow-700">1</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-foreground">
                    Sem sinais
                  </p>
                  <p className="text-xs text-muted-foreground">nenhuma</p>
                </div>
              </div>
              <Callout variant="warn" title="É um apoio, não um diagnóstico">
                O selo serve para <strong>ordenar a fila de atenção</strong> da
                equipe. Ele não substitui a avaliação técnica da psicóloga nem
                define conduta — um caso marcado como “Baixo” pode ser grave.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c5">
            <AccordionTrigger>
              Plano Individual de Atendimento (PIA)
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Abra um atendimento e vá à aba{" "}
                <strong>Plano Individual (PIA)</strong>. Ali você registra o{" "}
                <strong>histórico da demanda</strong>, as{" "}
                <strong>pactuações com a usuária</strong> (o que foi identificado,
                o que foi ofertado, o que foi feito) e as{" "}
                <strong>formas de participação</strong> — se a assistida atende às
                convocações, comparece às rodas terapêuticas e aos atendimentos
                psicológicos.
              </p>
              <p className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                A <strong>evolução do acompanhamento</strong> funciona como um
                diário: cada registro tem data, descrição e técnico responsável, e
                fica na ordem cronológica.
              </p>
              <Callout variant="tip" title="Salve o plano antes de evoluir">
                O botão de registrar evolução só é liberado depois que o plano for
                salvo pela primeira vez.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c6">
            <AccordionTrigger>Quem enxerga o módulo</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              O CRAM é um módulo como os outros: aparece apenas para os perfis
              liberados em{" "}
              <a href="#permissoes" className="font-medium text-primary underline">
                Configurações → Permissões de Menu
              </a>
              . Perfis que já tinham acesso restrito <strong>não</strong> recebem
              o CRAM automaticamente — um administrador precisa marcá-lo.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 5. Gestão de Demandas */}
      <Section
        id="demandas"
        number={5}
        title="Gestão de Demandas"
        description="Quadro Kanban para acompanhar pendências entre setores."
        icon={GitPullRequest}
        iconClass="text-orange-600"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Todas as demandas e encaminhamentos aparecem em um quadro visual.
          Arraste os cartões entre as colunas para atualizar o andamento.
        </p>
        <KanbanIllustration />
        <Callout variant="tip" title="Filtre pelo seu setor">
          Use os filtros do topo para ver apenas as demandas que dizem respeito
          à sua equipe, reduzindo o ruído e focando no que é seu.
        </Callout>
        <Callout variant="new" title="Tipos e status configuráveis + acesso por perfil">
          Os valores de <strong>Tipo de Demanda</strong> e{" "}
          <strong>Status da Etapa</strong> agora são cadastráveis em{" "}
          <strong>Configurações</strong> (submenus “Tipos de Tramitação” e
          “Status de Etapa”). Além disso, administradores podem restringir, por
          perfil, <strong>quais tipos de demanda</strong> cada equipe enxerga —
          veja{" "}
          <a href="#permissoes" className="font-medium text-primary underline">
            Controle de Acesso
          </a>
          .
        </Callout>
      </Section>

      {/* 6. Agenda Institucional */}
      <Section
        id="agenda"
        number={6}
        title="Agenda Institucional"
        description="Calendário unificado de eventos, aulas e sessões."
        icon={Calendar}
        iconClass="text-sky-600"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          A Agenda reúne em um só lugar os <strong>eventos manuais</strong>, as{" "}
          <strong>aulas da Escola da Mulher</strong> e as{" "}
          <strong>sessões da Sala Azul</strong>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" /> Calendário Visual
            </p>
            <p className="text-xs text-muted-foreground">
              Visão mensal dos compromissos, com cores por tipo de evento.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-primary" /> Lista de Gestão
            </p>
            <p className="text-xs text-muted-foreground">
              Cadastre, edite ou exclua eventos em formato de lista.
            </p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="a0">
            <AccordionTrigger>
              Data e horário do evento{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Os campos <strong>Início</strong> e <strong>Fim</strong> aceitam
                data <strong>e hora</strong>. Informe o horário real da ação — é
                ele que aparece no calendário e na listagem.
              </p>
              <p>A coluna <strong>Período</strong> resume as duas datas:</p>
              <ul className="space-y-1">
                <li>
                  Mesmo dia, com horário →{" "}
                  <code className="rounded bg-muted px-1">
                    20/03/2026 12:00 às 14:00
                  </code>
                </li>
                <li>
                  Mesmo dia, sem horário →{" "}
                  <code className="rounded bg-muted px-1">20/03/2026</code>
                </li>
                <li>
                  Vários dias →{" "}
                  <code className="rounded bg-muted px-1">
                    10/01/2026 09:00 a 15/01/2026 18:00
                  </code>
                </li>
              </ul>
              <Callout variant="tip" title="Eventos antigos sem horário">
                Quando o horário é meia-noite, o sistema o omite e entende como
                &quot;não informado&quot;. Eventos cadastrados antes desta versão
                ficaram assim — basta editá-los para informar a hora.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="a4">
            <AccordionTrigger>
              Buscar, ordenar e exportar a lista{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                A aba <strong>Gestão de Eventos (Lista)</strong> mostra os
                eventos em páginas de 20, com o total à direita.
              </p>
              <Callout variant="warn" title="Eventos que não apareciam">
                A lista trazia apenas os 100 mais recentes. Com 171 eventos
                cadastrados, 71 ficavam invisíveis — sem aviso nenhum. Agora a
                navegação cobre a base inteira.
              </Callout>
              <p>
                <strong>Buscar</strong> por título ou local, em toda a base.{" "}
                <strong>Ordenar</strong> por data (crescente ou decrescente),
                título, local ou ordem de cadastro. <strong>Filtrar</strong> por
                tipo, categoria e situação — com botão de limpar quando houver
                filtro ativo.
              </p>
              <p>
                <strong>Exportar CSV</strong> baixa todos os eventos do recorte
                atual, não apenas a página visível.
              </p>
              <Callout variant="tip" title="O link guarda a consulta">
                Busca, filtros e ordenação ficam no endereço da página — dá para
                salvar ou compartilhar o link de uma consulta específica.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="a1">
            <AccordionTrigger>
              Ver quem participou de um evento{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Steps
                items={[
                  <>
                    Na aba <strong>Lista de Eventos</strong>, localize o evento.
                  </>,
                  <>
                    Clique no botão <strong>Participantes</strong> (ícone de
                    pessoas) na linha do evento.
                  </>,
                  <>
                    O quadro mostra o total e a lista de participantes. Clique
                    no nome de uma delas para abrir sua ficha.
                  </>,
                ]}
              />
              <p className="text-sm text-muted-foreground">
                Para <strong>registrar</strong> uma participação, use a busca por
                nome ou CPF dentro do quadro, informe a data e confirme. Para
                remover, use o ícone de lixeira ao lado do nome.
              </p>
              <Callout variant="tip" title="Dois caminhos, o mesmo registro">
                A participação também pode ser lançada pela ficha da
                beneficiária, na aba <strong>Eventos</strong>. É o mesmo dado —
                registrar de um lado aparece no outro. Use o que for mais prático:
                pela pessoa quando estiver atendendo, pelo evento quando for
                lançar a lista de presença de uma ação inteira.
              </Callout>
              <Callout variant="warn" title="Não é possível repetir">
                O sistema recusa registrar a mesma beneficiária duas vezes no
                mesmo evento. Quem já está na lista não aparece nas sugestões de
                busca.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="a2">
            <AccordionTrigger>
              Registrar a equipe que atuou no evento{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Diferente das <strong>participantes</strong> (as mulheres
                atendidas), a <strong>equipe</strong> são as servidoras e
                servidores que trabalharam na ação.
              </p>
              <Steps
                items={[
                  <>
                    Na aba <strong>Lista de Eventos</strong>, localize o evento.
                  </>,
                  <>
                    Clique no botão <strong>Equipe</strong> (ícone de maleta, em
                    roxo) na linha do evento.
                  </>,
                  <>
                    Escolha a pessoa no campo{" "}
                    <strong>Servidora ou servidor</strong> e clique em{" "}
                    <strong>Adicionar</strong>.
                  </>,
                ]}
              />
              <Callout variant="tip" title="A lista vem das contas do sistema">
                Não há cadastro separado de funcionários: o campo lista, pelo
                nome, as mesmas contas usadas para entrar no SIGMA. Quem ganha
                acesso ao sistema passa a aparecer aqui automaticamente.
              </Callout>
              <p className="text-sm text-muted-foreground">
                Para tirar alguém da equipe, use o ícone de lixeira ao lado do
                nome — isso remove apenas o vínculo com aquele evento, nunca a
                conta de usuário da pessoa.
              </p>
              <Callout variant="warn" title="O histórico não se perde">
                Se a conta de uma servidora for excluída do Directus mais tarde,
                os eventos em que ela atuou continuam registrados — a linha
                aparece como &quot;Usuário removido&quot; em vez de desaparecer.
              </Callout>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="a3">
            <AccordionTrigger>
              Avisos automáticos de escala{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Quem entra na equipe <strong>é avisado pelo sistema</strong> —
                não é preciso mandar recado à parte. São quatro momentos:
              </p>
              <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Ao ser escalada</strong> — com data e local do evento.
                </li>
                <li>
                  <strong>Na véspera, às 8h</strong> — o lembrete que faz
                  diferença quando a escala é montada com semanas de
                  antecedência.
                </li>
                <li>
                  <strong>Ao ser retirada</strong> — e o lembrete da véspera é
                  cancelado junto.
                </li>
                <li>
                  <strong>Se o evento mudar de data ou local</strong> — toda a
                  equipe é reavisada.
                </li>
              </ul>
              <Callout variant="tip" title="Onde os avisos aparecem">
                No <strong>sino</strong> ao lado do seu nome, no topo da tela. O
                número em vermelho mostra quantos não foram lidos; clicar leva
                ao evento e marca como lido. Os mesmos avisos vão por{" "}
                <strong>e-mail institucional</strong>.
              </Callout>
              <Callout variant="warn" title="Por que o aviso de alteração importa">
                Sem ele, quem recebeu o aviso antes da mudança iria no dia ou no
                lugar errado — confiando no sistema. Uma notificação que vira
                mentira é pior que nenhuma.
              </Callout>
              <p className="text-sm text-muted-foreground">
                <strong>WhatsApp é opcional e exige autorização</strong> — como
                é aparelho pessoal, quem liga e desliga é a própria pessoa, em{" "}
                <strong>Meu Perfil → Notificações</strong>. Basta ligar a chave
                e informar o celular com DDD. O sino e o e-mail seguem
                funcionando independentemente disso.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 7. Escola da Mulher */}
      <Section
        id="escola"
        number={7}
        title="Escola da Mulher"
        description="Cursos profissionalizantes, turmas, matrículas e certificados."
        icon={GraduationCap}
        iconClass="text-emerald-600"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="e1">
            <AccordionTrigger>Painel da Escola</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Exibe estatísticas rápidas — turmas ativas, total de alunas e
              cursos disponíveis — com atalhos para as principais áreas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="e2">
            <AccordionTrigger>Cursos, Turmas e Matrículas</AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Cadastre <strong>cursos</strong>, abra <strong>turmas</strong> e
                faça a <strong>matrícula</strong> das beneficiárias. A frequência
                de cada aula é registrada por turma.
              </p>
              <Callout variant="tip" title="Certificado automático">
                Alunas com mais de <strong>75% de presença</strong> têm o
                certificado emitido automaticamente pelo sistema.
              </Callout>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 8. Sala Azul */}
      <Section
        id="sala-azul"
        number={8}
        title="Sala Azul"
        description="Acompanhamento de autores de violência e ciclos reflexivos."
        icon={ShieldAlert}
        iconClass="text-indigo-600"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="s1">
            <AccordionTrigger>Infratores</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Cadastre os autores de violência encaminhados pelo judiciário, com
              seus dados e <strong>nível de periculosidade</strong>. O painel da
              Sala Azul resume a situação dos casos.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="s2">
            <AccordionTrigger>Ciclos Reflexivos e presença</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Vincule os infratores a <strong>Ciclos Reflexivos</strong>. O
              sistema controla a <strong>presença obrigatória</strong> em cada
              sessão e permite emitir <strong>certificados e relatórios</strong>{" "}
              de participação ao final do ciclo.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 9. Marketing */}
      <Section
        id="marketing"
        number={9}
        title="Marketing e Comunicação"
        description="Campanhas de conscientização e disparos por WhatsApp."
        icon={Megaphone}
        iconClass="text-pink-600"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Megaphone className="h-4 w-4 text-primary" /> Mídias Sociais
            </p>
            <p className="text-xs text-muted-foreground">
              Gerencie campanhas (ex.: Agosto Lilás, Outubro Rosa) e acompanhe
              alcance e engajamento para relatórios de impacto.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Smartphone className="h-4 w-4 text-primary" /> Campanhas WhatsApp
            </p>
            <p className="text-xs text-muted-foreground">
              Organize disparos e comunicação direta com o público pelo WhatsApp.
            </p>
          </div>
        </div>
      </Section>

      {/* 10. Observatório */}
      <Section
        id="observatorio"
        number={10}
        title="Observatório"
        description="Painéis analíticos consolidados (acesso restrito)."
        icon={LayoutDashboard}
        iconClass="text-cyan-600"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          O Observatório reúne dashboards analíticos para leitura estratégica dos
          dados da secretaria (períodos, séries históricas e indicadores
          consolidados).
        </p>
        <Callout variant="warn" title="Acesso restrito">
          Este módulo é destinado a perfis de gestão. Caso não apareça no seu
          menu, é porque seu perfil não possui permissão de acesso a ele.
        </Callout>
      </Section>

      {/* 11. App Amar */}
      <Section
        id="app-amar"
        number={11}
        title="App Amar"
        description="Gestão de conteúdo e relacionamento do aplicativo e do site."
        icon={Smartphone}
        iconClass="text-rose-600"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Painel de conteúdo que alimenta o aplicativo/site voltado ao público.
          Cada área é um cadastro independente:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Categorias", "Temas e classificações de conteúdo."],
            ["Serviços", "Serviços disponíveis no aplicativo."],
            ["Campanhas", "Postagens e campanhas de divulgação."],
            ["Sonhos", "Sonhos, metas e arrecadações."],
            ["Cursos", "Cursos vinculados às categorias."],
            ["Contatos", "Mensagens enviadas pelo site público."],
            ["Projetos", "Projetos e conteúdos institucionais."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm font-semibold text-foreground">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <Callout variant="tip" title="Meu Site">
          O item <strong>Meu Site</strong> (no grupo Sistema) gerencia o conteúdo
          institucional do site público. As mensagens recebidas pelo formulário
          do site chegam em <strong>App Amar → Contatos</strong>.
        </Callout>
      </Section>

      {/* 12. Relatórios */}
      <Section
        id="relatorios"
        number={12}
        title="Relatórios"
        description="Indicadores gerais e relatórios oficiais do SUAS."
        icon={FileText}
        iconClass="text-green-600"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="r1">
            <AccordionTrigger>Indicadores Gerais</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Consolida números de atendimentos, perfis e tipos de violência
              para leitura gerencial.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="r2">
            <AccordionTrigger>RMA (SUAS)</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                O sistema gera o <strong>Registro Mensal de Atendimentos</strong>{" "}
                automaticamente.
              </p>
              <Steps
                items={[
                  <>
                    Acesse <strong>Relatórios → RMA (SUAS)</strong>.
                  </>,
                  <>Selecione o mês e o ano desejados.</>,
                  <>
                    Clique em <strong>Imprimir</strong> — o layout já sai
                    formatado para assinatura.
                  </>,
                ]}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="r3">
            <AccordionTrigger>
              Exportar CSV{" "}
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                Novo
              </Badge>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Tanto o <strong>RMA</strong> quanto os{" "}
              <strong>Indicadores</strong> têm o botão{" "}
              <strong>Exportar CSV</strong>: baixa os mesmos números em planilha
              (abre no Excel com os acentos corretos), com nome padronizado —
              ex.: <code>RMA-2026-08.csv</code>. Elimina a re-digitação ao
              consolidar dados ou enviar à rede SUAS.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      {/* 13. Configurações */}
      <Section
        id="configuracoes"
        number={13}
        title="Configurações"
        description="Tabelas auxiliares, campanhas, site e segurança."
        icon={Settings}
        iconClass="text-slate-600"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aqui você padroniza as opções que aparecem nos formulários de todo o
          sistema. O que for cadastrado nesta área vira opção automática nos
          demais módulos.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Setores, Locais e Bairros",
            "Dados demográficos (raça/cor, estado civil…)",
            "Origens, Prioridades e Tipos de Violência",
            "Encaminhamentos e Benefícios",
            "Tipos de Evento e Campanhas",
            "Níveis de Periculosidade e Status Legal",
            "Tipos de Tramitação e Status de Etapa",
            "Acesso a Demandas (por perfil)",
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              {t}
            </div>
          ))}
        </div>
        <Callout variant="tip" title="Reflexo imediato">
          Cadastrou um novo bairro ou tipo de violência? Ele aparece na hora nas
          listas de seleção dos formulários — sem precisar reiniciar nada.
        </Callout>
      </Section>

      {/* 14. Controle de Acesso */}
      <Section
        id="permissoes"
        number={14}
        title="Controle de Acesso (Perfis)"
        description="Como organizar perfis e definir o que cada equipe acessa."
        icon={Lock}
        iconClass="text-violet-600"
      >
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
          <Sparkles className="mr-1 h-3 w-3" /> Apenas administradores
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O acesso é organizado por <strong>perfil</strong> (o “grupo” do
          usuário). Cada usuário pertence a um perfil, e o que ele enxerga
          depende de duas camadas configuráveis pelo administrador:{" "}
          <strong>Permissões de Menu</strong> (quais módulos) e{" "}
          <strong>Acesso a Demandas</strong> (quais tipos de demanda).
        </p>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Como as camadas funcionam</p>
          <p>
            <strong>1. Perfil (Directus):</strong> define a identidade do grupo
            e o acesso aos dados.
          </p>
          <p>
            <strong>2. Permissões de Menu (app):</strong> filtram os módulos do
            menu lateral.
          </p>
          <p>
            <strong>3. Acesso a Demandas (app):</strong> filtra os tipos de
            demanda nas tramitações e no quadro Kanban.
          </p>
        </div>

        {/* Tutorial: configurar perfis e usuários */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            Passo a passo: ativar um perfil para uma equipe
          </h3>
          <Steps
            items={[
              <>
                <strong>Perfis disponíveis.</strong> O sistema já vem com os
                perfis <strong>Administrator</strong>, <strong>Jurídico</strong>,{" "}
                <strong>Gabinete</strong>, <strong>Atendimento</strong> e{" "}
                <strong>Psicossocial</strong>. Para criar um novo perfil, use o
                painel administrativo do Directus (Configurações → Funções) ou
                solicite à equipe de TI.
              </>,
              <>
                <strong>Garanta o acesso aos dados.</strong> Todo perfil
                não-administrador precisa ter a política{" "}
                <strong>“App Padrão”</strong> vinculada — é ela que permite
                visualizar e registrar dados no sistema. Os perfis que já vêm de
                fábrica já estão configurados; um perfil novo precisa receber
                essa política, senão o usuário entra mas não vê nada.
              </>,
              <>
                <strong>Atribua o usuário ao perfil.</strong> No Directus, em
                <strong> Usuários</strong>, abra a pessoa, selecione o{" "}
                <strong>Perfil/Função</strong> desejado e salve. A senha de
                acesso é a mesma do sistema.
              </>,
              <>
                <strong>Defina os menus.</strong> Em{" "}
                <strong>Configurações → Acesso &amp; Segurança → Permissões de
                Menu</strong>, escolha o perfil e marque os módulos liberados (ou{" "}
                <strong>Acesso total</strong>). Salve.
              </>,
              <>
                <strong>Defina os tipos de demanda.</strong> Em{" "}
                <strong>Configurações → Acesso &amp; Segurança → Acesso a
                Demandas</strong>, escolha o perfil e marque os tipos que a
                equipe pode tratar (ex.: Jurídico → “Jurídica”). Salve.
              </>,
            ]}
          />
        </div>

        <Callout variant="warn" title="Importante ao criar um perfil novo">
          Um perfil sem a política <strong>“App Padrão”</strong> deixa o usuário
          sem acesso aos dados (telas vazias). Sempre vincule essa política aos
          perfis não-administradores antes de atribuir usuários a eles.
        </Callout>

        {/* Permissões de menu — detalhe */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Lock className="h-4 w-4 text-primary" />
            Permissões de Menu
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Callout variant="tip" title="Dashboard é fixo">
              O Dashboard nunca pode ser desativado — é a página inicial de todos.
            </Callout>
            <Callout variant="warn" title="Administradores">
              Perfis administradores têm acesso irrestrito e não podem ser
              limitados.
            </Callout>
            <Callout variant="new" title="Bloqueio por URL">
              Quem acessa um endereço fora do seu perfil vê a página{" "}
              <strong>&quot;Acesso não permitido&quot;</strong>, com o nome do
              módulo bloqueado. O bloqueio também vale no servidor — as
              operações do módulo são negadas, não apenas o menu escondido.
            </Callout>
          </div>
        </div>

        {/* Acesso a demandas — detalhe */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <ListFilter className="h-4 w-4 text-primary" />
            Acesso a Demandas
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Restringe, por perfil, quais <strong>tipos de demanda</strong> a
            equipe vê e pode registrar. Ex.: o perfil <strong>Jurídico</strong>{" "}
            só enxerga demandas do tipo “Jurídica”. Sem nenhuma restrição
            cadastrada (ou com “Acesso a todos os tipos” ligado), o perfil vê
            todos os tipos.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Exemplos de selos de status que você verá pelo sistema:
          </p>
          <BadgeShowcase />
        </div>
      </Section>

      {/* 15. Meu Perfil */}
      <Section
        id="perfil"
        number={15}
        title="Meu Perfil"
        description="Seus dados, seu histórico de ações e troca de senha."
        icon={UserCog}
        iconClass="text-fuchsia-600"
      >
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
          <Sparkles className="mr-1 h-3 w-3" /> Novidade
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Clique no seu <strong>nome</strong>, no canto superior direito, e
          escolha <strong>Meu Perfil</strong> para abrir sua página pessoal.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCog className="h-4 w-4 text-primary" /> Dados
            </p>
            <p className="text-xs text-muted-foreground">
              Nome, e-mail, perfil de acesso e último acesso.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4 text-primary" /> Atividade
            </p>
            <p className="text-xs text-muted-foreground">
              Histórico das suas operações no sistema (criações, edições,
              exclusões), igual à Auditoria, porém só as suas.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" /> Segurança
            </p>
            <p className="text-xs text-muted-foreground">
              Altere sua senha informando a senha atual e a nova.
            </p>
          </div>
        </div>
        <Callout variant="tip" title="Troca de senha">
          A senha é a mesma usada para entrar no sistema. Por segurança, é
          preciso digitar a <strong>senha atual</strong> para confirmar a
          alteração, e a nova senha deve ter ao menos 8 caracteres.
        </Callout>
      </Section>

      {/* Rodapé */}
      <div className="space-y-1 border-t pt-8 pb-4 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2 font-medium text-foreground">
          <HeartHandshake className="h-4 w-4 text-primary" />
          SERMULHER — Gestão Integrada © {new Date().getFullYear()}
        </p>
        <p>Desenvolvido para facilitar e humanizar o atendimento.</p>
      </div>
    </div>
  );
}
