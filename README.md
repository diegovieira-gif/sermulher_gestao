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
* **Banco de Dados & CMS:** [Directus](https://directus.io/) atuando como Headless CMS e gerenciador de persistência sobre **SQLite** (`DB_CLIENT=sqlite3`) — ver a seção de Backup, que depende disso.
* **Comunicação Directus:** Wrapper customizado (`src/lib/directus.ts`) que implementa:
  * Fetch com desabilitação de cache agressivo do Next.js.
  * Captura inteligente de tokens httpOnly baseados em cookies de sessão.
  * Interceptador `safeDirectusCall` para gerenciamento centralizado de erros de autorização (401) e redirecionamento automático para a tela de login.
* **Testes:** [Playwright](https://playwright.dev/) tanto para os testes de ponta a ponta (E2E) quanto para a suíte unitária de lógica pura.
* **Autorização:** duas camadas — as permissões do Directus e, no app, `assertAccess(<módulo>)` em toda Server Action, com política *fail-closed* (ver `src/lib/permissions.ts`).

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

## 🧪 Testes

Duas camadas, com pré-requisitos diferentes — a separação existe para que haja
sinal mesmo quando o Directus está fora de alcance (trabalho fora da rede do
servidor):

| Camada | Precisa de servidor / Directus? | Comando |
| --- | --- | --- |
| **Unitária** — permissões, limite de login, CSV, máscaras | ❌ roda offline | `npm run test:unit` |
| **Smoke** — rotas, IDOR, força bruta | servidor sim, Directus não | `npx playwright test --project=smoke` |
| **E2E autenticado** — fluxos por módulo | ambos + credenciais | `npm run test` |

```bash
npm run test:unit      # ~10s, sem rede — roda sempre
npm run test           # suíte E2E completa (exige TEST_USER_EMAIL/PASSWORD)
npm run test:e2e:ui    # modo interativo do Playwright
npm run typecheck      # tsc --noEmit
```

> Os testes unitários usam o próprio Playwright como runner
> (`playwright.unit.config.ts`), sem adicionar Vitest/Jest ao projeto.

Detalhes de cobertura, credenciais e armadilhas conhecidas em
[`tests/README.md`](tests/README.md).

---

## 📄 Estrutura de Pastas Principal

```text
├── .github/          # Workflows e agentes de automação
├── docs/             # Trilha de vídeo-aulas e planos de aula
├── public/           # Ativos públicos (imagens, fontes, etc)
├── scripts/          # Migrações do Directus, backup e diagnóstico
├── tests/            # E2E (Playwright)
│   └── unit/         # Testes de lógica pura, sem servidor
└── src/
    ├── app/          # Rotas e Páginas (App Router)
    │   ├── (admin)   # Rotas autenticadas — o grupo NÃO vira segmento de URL
    │   ├── api/      # Endpoints HTTP (login, proxies de arquivo)
    │   └── login/    # Página de acesso autenticado
    ├── components/   # Componentes de UI reutilizáveis (Shadcn/custom)
    ├── hooks/        # Custom React Hooks
    ├── lib/          # Clientes de integração (Directus, sessão, permissões)
    └── types/        # Definições de tipo TypeScript
```

---

## 🗄️ Migrações do Directus

O schema não é versionado por um ORM: cada mudança estrutural tem um script
**idempotente** em `scripts/`, aplicado via API REST do Directus. Rodar duas
vezes é seguro — o script pula o que já existe e imprime um relatório.

```bash
# Lê DIRECTUS_API_URL e DIRECTUS_TOKEN do .env.local
node scripts/add-equipe-evento.mjs
```

> [!IMPORTANT]
> Depois de criar uma **coleção nova**, rode também
> `node scripts/setup-app-padrao-policy.mjs`. É ele que concede à política
> "App Padrão" a permissão na coleção recém-criada — sem isso, perfis
> não-administradores veem a tela vazia ou recebem erro de permissão.

Ao criar campos relacionais, o script precisa registrar a relação em
`/relations`, além de criar a coluna. Sem isso o *deep-read* devolve o UUID
cru em vez do objeto — foi o que quebrou a coluna "Registrado por" e exigiu o
`fix-user-created-vinculos.mjs`.

---

## 🚢 Deploy

> [!IMPORTANT]
> `git push` **não** atualiza o ambiente de produção. O repositório não tem
> automação de deploy — o único workflow (`test-runner.yml`) roda apenas
> typecheck e smoke tests. Sem o passo abaixo, o código fica no GitHub e o
> servidor continua servindo a versão anterior.

A publicação é feita pelo **Coolify**, manualmente ou via API:

```bash
# Variáveis em .env.local (fora do Git):
#   COOLIFY_API_URL, COOLIFY_TOKEN, COOLIFY_APP_UUID
curl -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "$COOLIFY_API_URL/api/v1/deploy?uuid=$COOLIFY_APP_UUID"
```

A resposta traz um `deployment_uuid` para acompanhar o andamento:

```bash
curl -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "$COOLIFY_API_URL/api/v1/deployments/<deployment_uuid>"
```

O status passa por `queued` → `in_progress` → `finished`. Um deploy completo
leva poucos minutos.

---

## 💾 Backup

O Directus desta instalação usa **SQLite** (`DB_CLIENT=sqlite3`,
`DB_FILENAME=/directus/database/data.db`), não PostgreSQL.

O backup cobre **duas** coisas, e faltar uma inutiliza a outra:

1. **`data.db`** — todas as coleções (beneficiárias, atendimentos, CRAM,
   tramitações, equipe de evento e os vínculos entre elas).
2. **`uploads/`** — os arquivos anexados. O banco guarda apenas a *referência*
   ao arquivo; restaurar só o banco devolve um sistema cheio de anexos
   quebrados.

A exportação CSV das beneficiárias **não é backup**: cobre uma coleção entre
mais de sessenta.

Os scripts rodam **no host do Docker**, não neste repositório. Descobrem o
contêiner e os volumes sozinhos — não há senha escrita em arquivo.

```bash
# Verifica o ambiente e a integridade do banco, sem gerar nada
./scripts/backup-directus-db.sh --verificar

# Gera o backup (banco + uploads), validando antes de aceitar os arquivos
BACKUP_DIR=/var/backups/sigma ./scripts/backup-directus-db.sh

# Diário às 2h — crontab -e
0 2 * * * BACKUP_DIR=/var/backups/sigma /caminho/backup-directus-db.sh >> /var/log/sigma-backup.log 2>&1
```

> [!NOTE]
> A cópia usa `VACUUM INTO`, que produz um arquivo íntegro **com o Directus em
> uso** — um `cp data.db` simples pode capturar estado inconsistente, porque
> parte das transações vive no arquivo `-wal`.

Restauração — o modo padrão **não altera nada**, apenas confere o conteúdo do
arquivo:

```bash
# Conferência: valida integridade e mostra quantos registros há dentro
./scripts/restore-directus-db.sh /var/backups/sigma/sigma_db_*.db

# Restauração real: para o Directus, substitui o banco e religa
UPLOADS=/var/backups/sigma/sigma_uploads_2026-08-16_020000.tgz \
  ./scripts/restore-directus-db.sh /var/backups/sigma/sigma_db_2026-08-16_020000.db --sobrescrever
```

A restauração real exige confirmação digitada e **guarda o estado atual** num
arquivo `pre-restauracao_*.db` antes de substituir — para que escolher o
backup errado ainda tenha caminho de volta.

> [!WARNING]
> Backup que nunca foi restaurado não é backup, é esperança. Rode ao menos a
> conferência antes de precisar dele de verdade. Os arquivos contêm dados
> pessoais de mulheres em situação de violência: o diretório é criado com
> permissão `700`, os arquivos com `600`, e `backups/` está no `.gitignore`.

---

## 🤝 Suporte & Desenvolvimento

Plataforma desenvolvida para a **Secretaria Municipal do Respeito às Políticas para as Mulheres** (Aracaju/SE). Em caso de inconsistências ou necessidade de novos recursos, contate o administrador do sistema ou o responsável técnico.
