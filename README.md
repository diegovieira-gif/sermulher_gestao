# 🌸 SerMulher - Sistema de Gestão Integrada

O **SerMulher** é um sistema de gestão integrada desenvolvido para a **Secretaria Municipal do Respeito às Políticas para as Mulheres (SMPM)** de Aracaju/SE. A plataforma centraliza o acolhimento, prontuário eletrônico, qualificação profissional, acompanhamento de grupos reflexivos e a gestão institucional, garantindo eficiência, segurança de dados e relatórios consolidados em um único lugar.

---

## 🚀 Módulos do Sistema

O sistema é dividido em módulos especializados para atender as frentes de atuação da Secretaria:

### 1. 📊 Painel de Controle (Dashboard)
* **Indicadores em Tempo Real:** Total de atendimentos do mês corrente, mulheres sob acompanhamento ativo, agenda dos próximos 7 dias e triagens/pendências pendentes de ação.
* **Métricas Consolidadas:** Gráficos e painéis rápidos de controle para tomada de decisão ágil da coordenação.

### 2. 👩‍💼 Gestão de Mulheres (Prontuário Eletrônico)
* **Acolhimento e Histórico:** Prontuário digital individual de mulheres em situação de vulnerabilidade ou violência.
* **Segurança e Sigilo:** Controle de acesso rígido com opções de sigilo técnico (psicossocial e jurídico).
* **Evitação de Duplicidade:** Busca inteligente por CPF e dados básicos para prevenir múltiplos registros da mesma beneficiária.

### 3. 🎓 Escola (Cursos e Oficinas)
* **Fomento à Autonomia Financeira:** Gestão de cursos profissionalizantes e oficinas oferecidos pela Secretaria.
* **Gestão de Turmas:** Abertura, planejamento de professores, controle de turnos e acompanhamento automático de cronogramas.
* **Matrículas e Presença:** Vinculação automática com o cadastro do módulo de Mulheres, controle de frequência e emissão direta de **Certificados de Conclusão**.

### 4. 🩵 Sala Azul (Grupos Reflexivos)
* **Acompanhamento de Autores de Violência:** Registro e monitoramento de participantes de grupos reflexivos para homens (conforme diretrizes da Lei Maria da Penha).
* **Gestão de Sessões:** Cadastro de ciclos temáticos (ex: Masculinidade, Violência Patrimonial) e controle rigoroso de frequência para fornecimento de relatórios ao Poder Judiciário.
* **Classificação de Risco:** Monitoramento do status legal e níveis de risco.

### 5. 📅 Agenda Institucional (Eventos)
* **Calendário Integrado:** Visualização unificada que exibe em código de cores as turmas em andamento, sessões agendadas da Sala Azul e palestras institucionais.
* **Gestão de Eventos:** Cadastro rápido de reuniões, ações comunitárias e campanhas.

### 6. 📢 Marketing e Comunicação
* **Campanhas de Conscientização:** Monitoramento de engajamento, metas e divulgação de ações vinculadas a eventos da Secretaria.

### 7. ⚙️ Configurações (Tabelas Auxiliares)
* **Padronização de Dados:** Cadastro de bairros de Aracaju, origens de encaminhamento, tipos de violência, tipos de evento e parâmetros auxiliares que alimentam dinamicamente os formulários de todo o sistema.

---

## 🛠️ Stack Tecnológica & Arquitetura

O SerMulher utiliza ferramentas modernas para fornecer desempenho e facilidade de manutenção:

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) e componentes acessíveis com [Radix UI](https://www.radix-ui.com/).
* **Backend:** Server Actions nativas do Next.js, eliminando intermediários complexos para chamadas seguras.
* **Banco de Dados & CMS:** [Directus](https://directus.io/) atuando como Headless CMS e gerenciador de persistência sobre banco de dados **PostgreSQL**.
* **Comunicação Directus:** Wrapper customizado (`src/lib/directus.ts`) que implementa:
  * Fetch com desabilitação de cache agressivo do Next.js.
  * Captura inteligente de tokens httpOnly baseados em cookies de sessão.
  * Interceptador `safeDirectusCall` para gerenciamento centralizado de erros de autorização (401) e redirecionamento automático para a tela de login.
* **Testes:** [Playwright](https://playwright.dev/) para testes de ponta a ponta (E2E) e validação de fluxos.

---

## ⚙️ Configuração Local

### Pré-requisitos

* **Node.js** v18 ou superior.
* Gerenciador de pacotes **npm** (incluso com o Node).

### Variáveis de Ambiente (`.env.local`)

Crie ou atualize o arquivo `.env.local` na raiz do projeto configurando a API do Directus:

```env
# URL base pública da API do Directus (usada em chamadas client-side)
NEXT_PUBLIC_DIRECTUS_URL="http://192.168.0.118"

# URL base interna da API do Directus (usada em chamadas no servidor)
DIRECTUS_API_URL="http://192.168.0.118"

# Token de acesso estático para operações administrativas no Directus
DIRECTUS_TOKEN="seu_token_estatico_aqui"
```

> [!IMPORTANT]
> A integração antiga com webhooks n8n para captação de formulários externos foi removida. O sistema funciona de forma 100% interna e direta sobre a API do Directus.

---

## 🚀 Execução do Projeto

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Rodar o servidor de desenvolvimento local
npm run dev

# 3. Gerar a build otimizada de produção
npm run build

# 4. Iniciar a build gerada em produção
npm run start
```

Após iniciar o servidor de desenvolvimento, acesse [http://localhost:3000](http://localhost:3000) (ou a porta exibida no terminal). O sistema redirecionará automaticamente para o portal de login.

---

## 🧪 Testes E2E (Playwright)

O projeto possui cobertura de testes automatizados com o Playwright:

```bash
# Executar todos os testes E2E
npm run test

# Executar os testes em modo interativo (UI do Playwright)
npm run test:e2e:ui
```

---

## 📄 Estrutura de Pastas Principal

```text
├── .github/          # Workflows e agentes de automação
├── public/           # Ativos públicos (imagens, fontes, etc)
├── tests/            # Testes de integração e E2E (Playwright)
└── src/
    ├── app/          # Rotas e Páginas (App Router)
    │   ├── (admin)   # Rotas autenticadas de gestão e administração
    │   ├── (app)     # Rotas gerais da aplicação
    │   ├── api/      # Endpoints HTTP (login, proxies)
    │   └── login/    # Página de acesso autenticado
    ├── components/   # Componentes de UI reutilizáveis (Shadcn/custom)
    ├── hooks/        # Custom React Hooks
    ├── lib/          # Clientes de integração (Directus, helpers)
    └── types/        # Definições de tipo TypeScript
```

---

## 🤝 Suporte & Desenvolvimento

Plataforma desenvolvida para a **Secretaria Municipal do Respeito às Políticas para as Mulheres** (Aracaju/SE). Em caso de inconsistências ou necessidade de novos recursos, contate o administrador do sistema ou o responsável técnico.
