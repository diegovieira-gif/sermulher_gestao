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
  { id: "demandas", label: "Gestão de Demandas", icon: GitPullRequest },
  { id: "agenda", label: "Agenda Institucional", icon: Calendar },
  { id: "escola", label: "Escola da Mulher", icon: GraduationCap },
  { id: "sala-azul", label: "Sala Azul", icon: ShieldAlert },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "observatorio", label: "Observatório", icon: LayoutDashboard },
  { id: "app-amar", label: "App Amar", icon: Smartphone },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "permissoes", label: "Permissões de Menu", icon: Lock },
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
                Versão 1.1
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
                O botão <strong>Exportar CSV</strong> baixa a lista atual (já
                filtrada) em arquivo compatível com Excel.
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
        </Accordion>
      </Section>

      {/* 4. Gestão de Demandas */}
      <Section
        id="demandas"
        number={4}
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
      </Section>

      {/* 5. Agenda Institucional */}
      <Section
        id="agenda"
        number={5}
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
      </Section>

      {/* 6. Escola da Mulher */}
      <Section
        id="escola"
        number={6}
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

      {/* 7. Sala Azul */}
      <Section
        id="sala-azul"
        number={7}
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

      {/* 8. Marketing */}
      <Section
        id="marketing"
        number={8}
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

      {/* 9. Observatório */}
      <Section
        id="observatorio"
        number={9}
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

      {/* 10. App Amar */}
      <Section
        id="app-amar"
        number={10}
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

      {/* 11. Relatórios */}
      <Section
        id="relatorios"
        number={11}
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
        </Accordion>
      </Section>

      {/* 12. Configurações */}
      <Section
        id="configuracoes"
        number={12}
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

      {/* 13. Permissões de Menu */}
      <Section
        id="permissoes"
        number={13}
        title="Permissões de Menu"
        description="Controle, por perfil, quais módulos cada usuário enxerga."
        icon={Lock}
        iconClass="text-violet-600"
      >
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
          <Sparkles className="mr-1 h-3 w-3" /> Novidade
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Administradores podem definir, diretamente pelo sistema, quais itens do
          menu lateral cada <strong>perfil de usuário</strong> pode acessar. É a
          forma de adaptar o sistema a equipes como Recepção, Busca Ativa,
          Jurídico, etc.
        </p>
        <Steps
          items={[
            <>
              Acesse <strong>Configurações → Acesso &amp; Segurança → Permissões
              de Menu</strong>.
            </>,
            <>
              Na lista à esquerda, escolha o <strong>perfil</strong> que deseja
              ajustar.
            </>,
            <>
              Marque ou desmarque os módulos, ou ative <strong>Acesso total</strong>{" "}
              para liberar tudo.
            </>,
            <>
              Clique em <strong>Salvar permissões</strong>. O menu do usuário se
              ajusta automaticamente no próximo acesso.
            </>,
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Callout variant="tip" title="Dashboard é fixo">
            O Dashboard nunca pode ser desativado — é a página inicial de todos.
          </Callout>
          <Callout variant="warn" title="Administradores">
            Perfis administradores têm acesso irrestrito e não podem ser
            limitados.
          </Callout>
          <Callout variant="new" title="Bloqueio por URL">
            Mesmo digitando o endereço direto, um usuário sem permissão é
            redirecionado para o Dashboard.
          </Callout>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">
            Exemplos de selos de status que você verá pelo sistema:
          </p>
          <BadgeShowcase />
        </div>
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
