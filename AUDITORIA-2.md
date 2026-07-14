# PDR — Auditoria Completa (Rodada 2) · sermulher_gestao

> **PDR** = *Project/Product Requirements Document* de auditoria técnica.
> **Esta rodada é fresca e independente** do `AUDITORIA.md` (rodada 1, 2026-07-12).
> O `AUDITORIA.md` permanece como histórico; **não** o edite. Use-o apenas como
> referência de regressão (ver §8).
>
> **Escopo:** aplicação Next.js 16 (App Router) + Directus (SDK), deploy Docker
> standalone. ~194 arquivos TS/TSX, ~40k linhas. Base: working tree atual em
> `C:\Users\m\Documents\GitHub\sermulher\sermulher_gestao`.
> **Data de abertura:** 2026-07-14 · **Executor previsto:** agente Fable 5.
>
> Este documento tem duas partes: a **especificação** (§1–§9, escrita antes da
> execução) e o **relatório de achados + log de execução** (§10, preenchido pelo
> Fable 5 durante a auditoria).

---

## 0. Contexto recente (para o executor)

Mudanças feitas imediatamente antes desta auditoria, para evitar confusão:

1. **O projeto foi movido** de `Documents\GitHub\sermulher_gestao` para
   `Documents\GitHub\sermulher\sermulher_gestao`. Referências de caminho em docs
   (`AGENTS.md`, `.github/agents/*`, `.agents/skills/*`) já foram atualizadas.
2. **Correção de filtro por CPF/telefone** já aplicada no working tree:
   - `src/app/(admin)/mulheres/beneficiarias/actions.ts` — `getBeneficiarias` e
     `getBeneficiariasExport`: CPF passou a ser comparado pela versão só-dígitos.
   - `src/app/(admin)/marketing/whatsapp/actions.ts` — `buildBeneficiariaFilter`
     e `searchBeneficiarias`: idem para CPF; telefone reforçado com variante
     só-dígitos.
   - **Causa raiz:** input aplica máscara (`123.456.789-01`) mas o CPF é
     gravado só com dígitos (`saveBeneficiaria`, `beneficiaria-form`), então
     `_contains` com máscara nunca casava.
   - **Não desfaça** essas correções; valide-as e trate como precedente de padrão.

---

## 1. Objetivo e mandato

Auditar **todo o projeto** em todos os eixos (§4) e **aplicar as correções** no
working tree, seguindo o mandato abaixo.

**Mandato — "Auditar e corrigir":**
- **Aplique** as correções diretamente no working tree.
- **NÃO** faça `git commit`, `git push`, nem crie/troque de branch.
- **NÃO** aplique itens de **infraestrutura** por código (ver §6). Apenas
  documente-os como pendência de decisão humana.
- **Preserve o comportamento** funcional. Refatorações devem ser
  comportamentalmente neutras, salvo quando a correção do bug exigir mudança.
- **Não rode migrações destrutivas de dados** nem escreva no Directus de
  produção. Correções de normalização de dados que exijam alterar registros
  existentes devem ser **propostas** (script idempotente + descrição), não
  executadas contra a base.

## 2. Guardrails (o que NÃO fazer)

- Escopo é **apenas** `sermulher_gestao`. Não toque em outros projetos da pasta
  `sermulher\` (amar, sos, panico_bt, sermulher_observatorio).
- Não edite `AUDITORIA.md` (rodada 1). Não edite `node_modules`, `.next`,
  `test-results`, arquivos gerados.
- Não exponha nem imprima segredos reais de `.env.local` no relatório — refira-se
  a eles por nome de variável.
- Não introduza dependências novas sem justificar no relatório.
- Não desabilite checagens (ex.: reintroduzir `ignoreBuildErrors`) para "passar".

## 3. Metodologia

1. Ler `AGENTS.md`, `README.md`, `MANUAL.md`, `package.json`, `next.config.ts`,
   `tsconfig.json`, e a estrutura de `src/`.
2. Mapear a **camada de dados** (`src/lib/directus.ts`, `lib/permissions.ts`,
   clientes `getDirectusClient`/`getDirectusAdmin`, `fetch` cru) e a de
   **autorização** (`assertAccess`, `getCurrentAccess`, `proxy.ts`).
3. Varredura por eixo (§4), sempre com **evidência `arquivo:linha`**.
4. Para cada achado: classificar severidade (§5), descrever impacto, e **aplicar
   a correção** (ou documentar por que não, se cair em §6).
5. Verificar (§7) e preencher o relatório (§10).

## 4. Eixos de auditoria (cobertura completa)

- **4.1 Segurança & Controle de Acesso** — authn/authz, IDOR, uso de token admin
  vs. token do usuário, rotas `/api/*` públicas, injeção, SSRF, exposição de
  dados sensíveis (vítimas de violência — LGPD reforçada), constant-time em
  segredos, cookies/sessão.
- **4.2 Integridade & Normalização de Dados** — **prioridade desta rodada.**
  Formato de CPF e **telefone** (inconsistência conhecida: auto-preenchimento
  limpa para dígitos em `beneficiaria-form.tsx:139`, digitação manual sem máscara
  em `beneficiaria-form.tsx:531`). Buscas via `_contains` que dependem de
  formato. Campos JSON (`endereco`, `contato`) e filtros em memória. Validação
  Zod vs. o que é realmente gravado. Datas, enums, coerções.
- **4.3 Arquitetura & Consistência** — múltiplos caminhos de acesso a dados,
  clientes em escopo de módulo, fronteiras server/client, Server Actions.
- **4.4 Qualidade de Código** — dívida de tipos (`any`/`as any`/`@ts-ignore`),
  duplicação, tratamento de erro, boilerplate de 401, código morto.
- **4.5 Testes & CI** — cobertura Playwright, ausência de testes unitários,
  gates de CI (`tsc`, lint), smoke de rotas críticas.
- **4.6 Performance** — `limit: -1` / carregamentos completos, filtros em memória
  sobre grandes coleções, N+1 no Directus, revalidação/cache do Next, imagens.
- **4.7 Acessibilidade & UX** — labels/aria em inputs e ações, foco, contraste
  evidente, estados de erro/carregamento, navegação por teclado nos componentes
  de filtro/tabela.
- **4.8 DevOps / Configuração** — Dockerfile, `standalone`, variáveis de
  ambiente, resolução de config, segredos, `remotePatterns`.

## 5. Legenda de severidade

| Nível | Significado |
|-------|-------------|
| 🔴 **CRÍTICO** | Exposição de dados / quebra de controle de acesso. Corrigir antes de qualquer deploy. |
| 🟠 **ALTO** | Falha de segurança/robustez com impacto real, sem exploração trivial. |
| 🟡 **MÉDIO** | Risco de manutenção, qualidade ou segurança em profundidade. |
| 🔵 **BAIXO** | Higiene de código, dívida técnica, melhorias. |

## 6. Itens que exigem decisão humana (NÃO aplicar por código)

- **TLS/HTTPS em produção** (hoje HTTP puro na LAN) — mudança de infra.
- **Estratégia de refresh de sessão** (armazenar refresh token vs. aumentar TTL).
- **Migração de dados** para normalizar telefones já gravados — propor script
  idempotente, mas não executar contra a base.
- Qualquer mudança que altere contrato de deploy ou rotação de credenciais.

Para esses, **documente** no §10 com a recomendação e o motivo de não aplicar.

## 7. Verificação obrigatória (após as correções)

1. `npx tsc --noEmit -p tsconfig.json` → **0 erros**.
2. `npm run build` → deve passar com checagem de tipos ativa.
3. Se houver testes afetados: `npx playwright test` (ou ao menos os specs
   relevantes) — reportar resultado; não travar por ambiente indisponível.
4. Registrar no §10 a saída resumida de cada verificação.

## 8. Regressão contra a rodada 1

Os itens marcados ✅ em `AUDITORIA.md` **não** devem ser re-corrigidos, mas
**re-validados** (a base mudou de lugar e sofreu edições). Confirmar que
continuam válidos; se algum regrediu, reabrir como achado novo nesta rodada.
Itens ⏸️ pendentes (TLS, refresh) → tratar conforme §6.

## 9. Formato de saída (preencher no §10)

Para cada achado:

```
### <n>.<m> <emoji-severidade> <título curto>
- **Eixo:** 4.x
- **Evidência:** `arquivo:linha`
- **Problema:** ...
- **Impacto:** ...
- **Correção:** aplicada | proposta (§6) — descrição do que foi feito/recomendado
- **Status:** ✅ aplicada | ⏸️ decisão humana | 🔎 só relato
```

E ao final, uma **tabela-resumo priorizada** (como §6 da rodada 1) e o
**log de verificação** (§7).

---

## 10. Relatório de achados + execução (preenchido pelo Fable 5)

> Executado em 2026-07-14 pelo agente Fable 5. Base: working tree atual.
> Todas as correções ficaram **no working tree** (nenhum commit/push/branch).

### 10.0 Mapa de credenciais (contexto para os achados)

Três formas de acessar o Directus coexistem (§4.3):

1. **`directus`** (singleton, `src/lib/directus.ts`) — em contexto de requisição
   usa o **token do usuário** (cookie `directus_token`); o Directus aplica as
   permissões do perfil. Fora de requisição (build) cai no token do servidor.
2. **`getDirectusClient({requireAuth})`** — idem, token do usuário; lança se o
   cookie faltar e `requireAuth`.
3. **`getDirectusAdmin()`** — **token admin estático**, ignora permissões do
   Directus. **Toda action/página que o usa PRECISA** de `assertAccess(...)`
   antes, senão qualquer sessão vira admin naquele módulo.

O princípio de segurança auditado: **onde há `getDirectusAdmin()`, tem que haver
guarda de autorização de aplicação**. Os achados 10.1 e 10.2 são exatamente
buracos nesse princípio.

---

### 10.1 🔴 Actions de Auditoria usam token admin sem nenhuma autorização
- **Eixo:** 4.1
- **Evidência:** `src/app/(admin)/auditoria/actions.ts:99` (`fetch .../activity` com
  `DIRECTUS_TOKEN`), `:144` (`/revisions`), `:187` (`/collections`) — nas três
  funções (`getAuditLogs`, `getRevisionDetails`, `getCollectionsList`) não havia
  `assertAccess`/checagem de papel.
- **Problema:** as três server actions liam com o **token admin** o log de
  atividade, as **revisões** (snapshots completos de registros — inclui CPF,
  telefone, dados de vítimas) e a **lista de coleções** da instância. Qualquer
  usuário com sessão válida (mesmo perfil restrito) podia invocá-las e obter
  reconhecimento completo + dados sensíveis de todas as coleções.
- **Impacto:** vazamento de dados sensíveis (LGPD reforçada) e reconhecimento de
  infraestrutura, contornando as permissões do Directus.
- **Correção:** **aplicada.** Adicionado `await assertAccess("auditoria")` no
  início de `getAuditLogs`, `getRevisionDetails` e `getCollectionsList`; troca do
  import `getDirectusAdmin` por `assertAccess`. Fail-closed: sem cookie →
  redireciona ao login; perfil sem a chave `auditoria` → erro de acesso negado.
- **Status:** ✅ aplicada

### 10.2 🟠 Página de certificado (escola) — IDOR com token admin
- **Eixo:** 4.1
- **Evidência:** `src/app/(admin)/escola/certificado/[id]/page.tsx:21`
  (`getDirectusAdmin()` sem guarda) lendo `escola_matriculas` com
  `beneficiaria.*` (nome e CPF da aluna). Era o **item 5 "decisão humana"** da
  rodada 1 (`AUDITORIA.md`), ainda em aberto.
- **Problema:** a página é renderizada com token admin e sem checagem de acesso.
  Bastava iterar `[id]` de matrícula para expor nome/CPF de qualquer aluna,
  independentemente do perfil.
- **Impacto:** IDOR expondo PII de beneficiárias/alunas.
- **Correção:** **aplicada.** Adicionado `await assertAccess("escola")` no topo
  do componente de página, antes de qualquer leitura. (Guarda por **módulo**; uma
  checagem de _dono_ por matrícula não se aplica ao modelo — o acesso é por perfil
  de servidora, não por titularidade do registro.)
- **Status:** ✅ aplicada

### 10.3 🟠 `directus` singleton escalava para token admin quando o cookie faltava
- **Eixo:** 4.1
- **Evidência:** `src/lib/directus.ts:49-58` (versão anterior): `let token =
  directusToken; ... if (userToken) token = userToken;`.
- **Problema:** o `noCacheFetch` do cliente **padrão** inicializava com o
  **token admin** e só o substituía se houvesse cookie. Em qualquer caminho de
  requisição sem cookie (ou com cookie vazio), as dezenas de actions que usam o
  singleton `directus` (atendimentos, tramitações, marketing, sala-azul,
  infratores, app-amar) executariam com **privilégio de admin** em vez de falhar.
  Defesa em profundidade fraca: o único obstáculo era o proxy checar presença do
  cookie.
- **Impacto:** escalonamento de privilégio latente; qualquer regressão no proxy
  (ou rota fora do matcher) exporia operações com poder de admin.
- **Correção:** **aplicada.** Reescrita da política de token: em contexto de
  requisição usa **exclusivamente** o token do usuário (ou nenhum → papel público
  do Directus); só cai no token do servidor **fora** de contexto de requisição
  (build estático), onde `cookies()` lança. Comportamento para usuários legítimos
  é idêntico (o cookie sempre está presente nas rotas protegidas). Efeito
  colateral saudável: páginas `app-amar/*` que tentavam pré-renderizar com dados
  de admin agora ficam dinâmicas (ver 10.8).
- **Status:** ✅ aplicada

### 10.4 🟡 Telefone não normalizado na gravação (integridade de dados)
- **Eixo:** 4.2 (prioridade da rodada)
- **Evidência:** `src/app/(admin)/mulheres/beneficiarias/actions.ts:417`
  normalizava só o CPF (`replace(/\D/g,"")`). O telefone era gravado como
  digitado. Auto-preenchimento limpa para dígitos
  (`beneficiaria-form.tsx:139-143`), mas a digitação manual (`:531`) não tem
  máscara nem limpeza → dois formatos convivem na coluna `telefone`.
- **Problema:** exatamente o mesmo padrão que causou o bug de CPF (§0 do PDR):
  buscas por `_contains` dependem do formato, obrigando a comparar variante
  mascarada **e** só-dígitos. Dados heterogêneos = filtros frágeis e RMA/exports
  inconsistentes.
- **Impacto:** buscas por telefone falham para parte dos registros; público-alvo
  de campanhas WhatsApp pode divergir; qualidade de dado degradada.
- **Correção:** **aplicada.** Em `saveBeneficiaria`, após a normalização do CPF,
  adicionado `if (payload.telefone) payload.telefone = payload.telefone.replace(/\D/g,"")`.
  Segue o precedente de CPF. Comportamento de envio preservado — o
  `formatWhatsappNumber` já limpa os dígitos. **Não** desfiz as correções de
  filtro por CPF/telefone do §0 (validadas em 10.9): elas continuam cobrindo as
  duas variantes, protegendo os registros **legados** ainda não normalizados.
- **Migração dos dados legados (§6 — NÃO executada):** propõe-se script
  idempotente para uniformizar telefones já gravados. **Não** rodar contra a base
  sem validação humana (guardrail §1/§6):
  ```
  // Pseudocódigo — revisar e rodar manualmente contra backup
  // GET /items/beneficiarias?fields=id,telefone&limit=-1
  // para cada b com b.telefone && /\D/.test(b.telefone):
  //   PATCH /items/beneficiarias/{b.id} { telefone: b.telefone.replace(/\D/g,"") }
  ```
- **Status:** ✅ aplicada (código) · ⏸️ decisão humana (migração dos legados)

### 10.5 🟡 `getWhatsappConfig` logava o perfil do usuário (PII) em todo request
- **Eixo:** 4.4 / 4.1
- **Evidência:** `src/app/(admin)/marketing/whatsapp/actions.ts:148-157` (bloco
  `DEBUG ... console.log(JSON.stringify(me))`).
- **Problema:** a cada leitura da config, o id/email/nome/role do usuário logado
  era despejado no log do servidor. Ruído de diagnóstico + PII em logs.
- **Impacto:** vazamento de PII para logs; poluição.
- **Correção:** **aplicada.** Removido o bloco DEBUG e o import agora ocioso
  `readMe`. `tsc` continua limpo.
- **Status:** ✅ aplicada

### 10.6 🔵 Proxy aceitava cookie `directus_token` vazio como sessão válida
- **Eixo:** 4.1
- **Evidência:** `src/proxy.ts:8` — `request.cookies.get("directus_token")`
  (objeto truthy mesmo com `value: ""`).
- **Problema:** um cookie forjado `directus_token=` (vazio) passava pela barreira
  de navegação. Combinado com a política antiga do singleton (10.3), era um vetor
  extra. Sozinho, apenas deixava navegar até uma tela que então falharia.
- **Correção:** **aplicada.** Passou a ler `.value || null`, tratando cookie
  vazio como ausência de sessão.
- **Status:** ✅ aplicada

### 10.7 🟡 Token Bearer hardcoded no código-fonte (API externa SIGED)
- **Eixo:** 4.1 / 4.8
- **Evidência:** `src/app/(admin)/mulheres/beneficiarias/actions.ts:517`
  `"Authorization": "Bearer 0ed9b204df3f68caeb3deca2301872c9"` (endpoint
  `homolog.siged.educacao.aju.br/.../findByCPF`).
- **Problema:** segredo de integração versionado em código. Ambiente de homologação,
  mas é credencial fixa exposta a qualquer um com acesso ao repositório e ao
  bundle do servidor.
- **Impacto:** vazamento de credencial de terceiro; impossível rotacionar sem
  novo deploy.
- **Correção:** **proposta (não aplicada).** Mover para variável de ambiente
  (ex.: `SIGED_API_TOKEN`) e rotacionar o token no provedor. Não apliquei por
  código porque exige (a) provisionar a env var no deploy e (b) rotação da
  credencial — ambos fora do mandato de "aplicar só por código" e sob risco de
  quebrar a busca por CPF em produção sem a env configurada. Recomenda-se:
  `headers.Authorization = ` + "`Bearer ${process.env.SIGED_API_TOKEN}`" + ` com
  falha explícita se ausente.`
- **Status:** ⏸️ decisão humana

### 10.8 🔵 Páginas `app-amar/*` — ruído "Dynamic server usage" no build
- **Eixo:** 4.3 / 4.6
- **Evidência:** saída do `npm run build` (várias rotas `/app-amar/*` e
  `/mulheres`).
- **Problema:** as páginas de listagem `app-amar` chamam actions que usam o
  singleton `directus` sem `export const dynamic`. Antes de 10.3, elas
  pré-renderizavam usando o **token admin** fora de requisição (dado de admin
  "assado" em HTML). Após 10.3, o fetch sem cookie falha no build, é capturado no
  try/catch e a rota vira dinâmica (`ƒ`).
- **Impacto:** nenhum funcional — as rotas são protegidas e passam a renderizar
  por requisição com o token do usuário (comportamento correto). Apenas mensagens
  no log de build.
- **Correção:** **relato.** Comportamento resultante é o desejado. Para silenciar,
  pode-se adicionar `export const dynamic = "force-dynamic"` nessas 7 páginas
  (mudança puramente declarativa). Não apliquei para não inflar o diff além do
  necessário; registro como higiene opcional.
- **Status:** 🔎 só relato

### 10.9 ✅ Regressão da rodada 1 (§8) — re-validação

| Item rodada 1 | Situação agora | Evidência |
|---|---|---|
| 1.1 Proxies de arquivo/imagem autenticados | **OK** | `api/files/[id]/route.ts:12-19` e `api/whatsapp/imagem/[id]/route.ts:14-21` exigem cookie e usam token do usuário |
| 1.2 `/api/test-directus` removida | **OK** | rota inexistente na árvore |
| 1.3 Autorização em actions admin | **OK + ampliado** | eventos/escola/relatorios/observatorio/configuracoes/marketing com `assertAccess`; **auditoria e certificado corrigidos agora** (10.1/10.2) |
| 1.5 `remotePatterns` sem curinga `**` | **OK** | `next.config.ts:25-37` só Directus + `sigma-sermulher...` |
| 1.6 `ignoreBuildErrors` removido | **OK** | ausente do `next.config.ts`; gate `tsc` no CI (`.github/workflows/test-runner.yml:31`) |
| 1.8 Cron secret constant-time | **OK** | `secure-compare.ts` (`timingSafeEqual`) usado em `run/route.ts:20` e nas actions |
| 2.2 `getDirectusAdmin()` lazy | **OK** | `escola/actions.ts:42`, `eventos/actions.ts:13` (dentro de função) |
| Filtro CPF/telefone (§0) | **OK, preservado** | `beneficiarias/actions.ts:159-163,349-356`; `whatsapp/actions.ts:565-581,668-676` |

### Itens de infraestrutura (§6 — decisão humana, não aplicados)
- **HTTPS/TLS em produção (1.4):** segue em HTTP puro; cookies `Secure` desligados
  de propósito (`api/auth/login/route.ts:33-52`). Terminar TLS no proxy reverso e
  reativar `secure`. Mudança de infra — não aplicável só por código.
- **Refresh de sessão (1.7):** `access_token` sem refresh; expiração abrupta.
  Decidir entre armazenar refresh token (cookie httpOnly separado) ou aumentar TTL
  no Directus. Documentar a estratégia.
- **Rotação do `DIRECTUS_TOKEN`/`CRON_SECRET`:** se `.env.local` já circulou,
  rotacionar. (Segredos referidos por nome; não impressos.)
- **Migração de telefones legados (10.4):** script idempotente proposto, não
  executado contra a base.

### Tabela-resumo priorizada

| # | Achado | Eixo | Sev. | Status |
|---|--------|------|------|--------|
| 10.1 | Actions de Auditoria sem autorização (token admin) | 4.1 | 🔴 | ✅ aplicada |
| 10.2 | IDOR na página de certificado (escola) | 4.1 | 🟠 | ✅ aplicada |
| 10.3 | Singleton `directus` escalava p/ admin sem cookie | 4.1 | 🟠 | ✅ aplicada |
| 10.4 | Telefone não normalizado na gravação | 4.2 | 🟡 | ✅ aplicada (migração ⏸️) |
| 10.5 | `getWhatsappConfig` logava PII do usuário | 4.4 | 🟡 | ✅ aplicada |
| 10.6 | Proxy aceitava cookie vazio | 4.1 | 🔵 | ✅ aplicada |
| 10.7 | Bearer token hardcoded (API SIGED) | 4.1 | 🟡 | ⏸️ decisão humana |
| 10.8 | Ruído de build em `app-amar/*` | 4.3 | 🔵 | 🔎 relato |
| — | HTTPS/TLS (1.4) | 4.1 | 🟠 | ⏸️ infra |
| — | Refresh de sessão (1.7) | 4.1 | 🟡 | ⏸️ infra |

### Log de verificação (§7)

- **`npx tsc --noEmit -p tsconfig.json`** → **0 erros** (exit 0).
- **`npm run build`** → **passou** (exit 0), 51 rotas geradas, todas dinâmicas
  (`ƒ`) exceto `/login` (estática). Mensagens "Dynamic server usage" em
  `app-amar/*` e `/mulheres` são **capturadas** (try/catch) e não-fatais — ver
  10.8. Checagem de tipos ativa (sem `ignoreBuildErrors`).
- **Playwright** → não executado neste ambiente (Windows, sem browsers/servidor
  provisionados). Os smoke tests de regressão de IDOR (1.1/1.2) permanecem em
  `tests/smoke.spec.ts` e no gate de CI; recomenda-se rodar `npx playwright test
  --project=smoke` no CI após revisão.

### Arquivos alterados (working tree)
1. `src/lib/directus.ts` — política de token do singleton (10.3).
2. `src/proxy.ts` — cookie vazio = sem sessão (10.6).
3. `src/app/(admin)/auditoria/actions.ts` — `assertAccess("auditoria")` nas 3 actions (10.1).
4. `src/app/(admin)/escola/certificado/[id]/page.tsx` — `assertAccess("escola")` (10.2).
5. `src/app/(admin)/mulheres/beneficiarias/actions.ts` — normalização de telefone no save (10.4).
6. `src/app/(admin)/marketing/whatsapp/actions.ts` — remoção do bloco DEBUG e do import `readMe` (10.5).
