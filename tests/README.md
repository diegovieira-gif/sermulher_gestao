# Testes

O projeto tem **duas camadas** de teste, com pré-requisitos bem diferentes.

| Camada | Onde | Precisa de servidor/Directus? | Comando |
| --- | --- | --- | --- |
| **Unitária** | `tests/unit/` | ❌ Não — roda offline | `npm run test:unit` |
| **Smoke (E2E)** | `tests/smoke.spec.ts` | Servidor sim, Directus **não** | `npx playwright test --project=smoke` |
| **E2E autenticado** | demais `*.spec.ts` | Sim, ambos + credenciais | `npx playwright test` |

Essa separação é deliberada: quando o Directus está fora do ar — o que acontece
sempre que se trabalha fora da rede do servidor — as duas primeiras camadas
continuam dando sinal.

---

## 1. Testes unitários (`tests/unit/`)

Lógica pura, sem navegador e sem rede. Rodam em ~10 segundos.

```bash
npm run test:unit
```

**Runner:** o próprio Playwright, via `playwright.unit.config.ts`. Ele já está
no projeto e já transpila TypeScript — um Vitest/Jest só para isto
acrescentaria dependência e configuração sem ganho.

> O script chama o Node com `--conditions=react-server`. Sem isso, o pacote
> `server-only` (importado por `lib/rate-limit`) lança *"cannot be imported from
> a Client Component"*. É a mesma condição que o Next.js usa no bundle de
> servidor.

| Arquivo | O que protege |
| --- | --- |
| `menu-registry.spec.ts` | Cálculo de permissão de perfil. Um erro aqui expõe prontuário a quem não deveria ver — vale mais que o resto somado. |
| `rate-limit.spec.ts` | Limite de tentativas de login, incluindo a regressão do IP compartilhado (a secretaria inteira sai pelo mesmo IP). |
| `csv.spec.ts` | Escape do CSV dos relatórios. Erro aqui não gera exceção: gera planilha com colunas deslocadas, percebida depois de entregue. |
| `utils.spec.ts` | Máscaras de CPF/telefone e datas em fuso local (o bug da "data de amanhã" após as 21h). |
| `eventos-schemas.spec.ts` | Período do evento e o vínculo de equipe — cujo usuário é **UUID**, ao contrário dos demais relacionamentos do projeto, que são inteiros. |
| `notificacoes.spec.ts` | Agendamento do lembrete de véspera. O erro aqui é silencioso: lembrete agendado para o passado dispara na varredura seguinte e avisa "amanhã tem evento" de algo que já passou. |

---

## 2. Smoke (`tests/smoke.spec.ts`)

Roda **sem autenticação** e sem depender do banco. É o gate de PR.

- Login responde 200 e o formulário aparece.
- Rotas protegidas redirecionam para `/login` — nunca 500.
- **Regressão IDOR:** `/api/files/<uuid>` e `/api/whatsapp/imagem/<uuid>` sem
  sessão retornam 401.
- **Força bruta:** a 6ª tentativa na mesma conta retorna 429 com `Retry-After`.
  Funciona sem Directus porque a falha de conexão também conta como tentativa.
- **Rotas de cron:** `/api/campanhas/automaticas/run` e
  `/api/notificacoes/enviar` recusam requisição sem o segredo. A segunda envia
  e-mail e WhatsApp — aberta, seria um relay para disparar mensagem em nome da
  secretaria.

---

## 3. E2E autenticado

Cobrem o fluxo real contra o Directus. Exigem credenciais (ver abaixo).

| Arquivo | Cobertura |
| --- | --- |
| `rotas.spec.ts` | Toda rota do menu renderiza autenticada; nenhum link aponta para `/admin`. |
| `beneficiarias.spec.ts` | CRUD completo (cria e apaga os próprios dados). |
| `ficha-beneficiaria.spec.ts` | Abas da ficha, linha do tempo e rascunho automático. |
| `atendimentos.spec.ts` | Listagem, filtros por URL e paginação no servidor. |
| `cram.spec.ts` | Listagem, busca, paginação e as 4 abas do Instrumental. |
| `escola.spec.ts` | Cursos e turmas, incluindo turma com pré-requisito. |
| `sala-azul.spec.ts` | Infratores e ciclos reflexivos com participante. |
| `eventos.spec.ts` | CRUD de evento e visualização no calendário. |
| `equipe-evento.spec.ts` | Diálogo da equipe do evento e o dropdown de usuários. |
| `dashboard.spec.ts` | KPIs, gráfico e links. |
| `tramitacoes.spec.ts` | Smoke do Kanban. |
| `observatorio.spec.ts` | Busca, diálogo e abas. |
| `app-amar.spec.ts` | Smoke das 7 subrotas. |

`atendimentos`, `cram` e `ficha-beneficiaria` são **somente leitura** — não
criam nem apagam registros. Os demais criam dados e os removem ao final.

### Credenciais

`auth.setup.ts` lê `TEST_USER_EMAIL` e `TEST_USER_PASSWORD` **do ambiente**, sem
valor padrão. Sem elas o setup falha com instrução — de propósito: até 2026-07
havia uma credencial real commitada como fallback neste arquivo.

```bash
export TEST_USER_EMAIL="conta-de-teste@exemplo.gov.br"
export TEST_USER_PASSWORD="..."
npx playwright test
```

Use uma **conta de teste dedicada**, nunca a credencial pessoal de uma
servidora. No CI, cadastre as duas como secrets do repositório.

---

## Comandos úteis

```bash
npm run test:unit                          # unitários (offline)
npx playwright test --project=smoke        # smoke (precisa do app no ar)
npx playwright test tests/cram.spec.ts     # um arquivo
npx playwright test --headed               # vendo o navegador
npx playwright test --debug                # passo a passo
npx playwright show-report                 # relatório da última execução
```

---

## Armadilhas conhecidas

**`(admin)` não é segmento de URL.** `src/app/(admin)/` é um *route group*: ele
agrupa arquivos sem aparecer na URL. As rotas reais são `/dashboard`,
`/escola` — **não** `/admin/dashboard`. Como o proxy manda toda rota sem sessão
para `/login`, testes apontando para `/admin/...` passavam sem testar nada.
`rotas.spec.ts` guarda contra essa regressão.

**O error boundary devolve HTTP 200.** Um erro de render no cliente (por
exemplo, `FormLabel` fora de `<FormField>`, que já derrubou `/cram/novo`) não
aparece como 500 nem falha no build. Por isso os specs verificam explicitamente
a ausência do texto *"Ops! Algo deu errado"* — só o status não basta.

**Base vazia.** Os testes de leitura usam `test.skip()` quando não há registros,
em vez de falhar. Um ambiente recém-criado não deve reportar defeito onde só
falta dado.
