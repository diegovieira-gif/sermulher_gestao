# Vídeo-aulas — roteiros e produção

Os roteiros das aulas de [`../trilha-videos.md`](../trilha-videos.md). Cada aula é
um JSON de cenas que serve a dois propósitos ao mesmo tempo: **texto da
narração** e **instrução de captura de tela**. Um arquivo só — não há dois
textos para manter em sincronia.

## Pipeline

Decidido em 10/2026, a partir do que o `curso_inteligente` e as novelinhas
(`criativos-sci`) já aprenderam fazendo:

```
roteiro.json  (cenas: narração + ação na tela + foco do zoom)
     │
     ├─ 0. conferir-roteiros.mjs   regras, âncoras no código, duração
     ├─ 1. revisão                 equipe da Secretaria lê antes de gastar
     ├─ 2. aulas/narrar.mjs        voz ElevenLabs, um mp3 por cena + guardas
     ├─ 3. aulas/capturar.mjs      uma imagem por cena + caixa do foco
     └─ 4. aulas/montar.mjs        zoom no foco, cartões, legendas → .mp4
```

**Captura + zoom, e não gravação contínua.** A tela de cada cena é capturada
como imagem, e o vídeo da cena é um zoom suave sobre o elemento citado. Corrigir
uma frase refaz só aquela cena — a tela não precisa "acompanhar" o áudio, e o
zoom aponta exatamente o campo de que a fala trata. O ponto do zoom sai do
**próprio elemento na página** (a caixa do seletor de `foco`), e não de
coordenadas marcadas à mão.

**Voz: ElevenLabs, voz Bia** (feminina, brasileira, narrativa — ver
[`config.json`](config.json)). A ElevenLabs não aceita instrução de locução em
texto: o tom vem de três ajustes numéricos. Em compensação, não há risco de a
voz "ler a instrução em voz alta", como aconteceu no `curso_inteligente`.

**A narração definitiva é a última coisa a ser gerada.** Só com o roteiro
estável e revisado. Antes disso, ensaie com `--estimar`: a narração vira
silêncio com a duração estimada e o vídeo inteiro é montado **sem gastar
crédito** — dá para conferir telas, zoom, cartões e ritmo.

**Não confie no "ok" do TTS.** Cada mp3 passa por guardas medidas no arquivo:
tamanho mínimo, duração muito acima da esperada (leitura em dobro), muito
abaixo (fala cortada) e silêncio longo no meio. Reprovado, tenta mais uma vez e
então falha apontando a cena. E cada mp3 guarda a marca do texto e da voz que o
geraram: só a cena cuja fala mudou é narrada de novo.

## Produzir uma aula

Pré-requisitos: ffmpeg, o Chromium do Playwright (`npx playwright install
chromium`) e a **instância de demonstração** rodando, povoada com o
[`elenco`](elenco.json). No `.env.local` (fora do Git):

```env
TEST_USER_EMAIL=demo@sigma.local      # conta da instância de demonstração
TEST_USER_PASSWORD=...
BASE_URL=http://localhost:3000        # a captura RECUSA endereço não local
```

```bash
npm run aulas:conferir                      # roteiros sem erro
npm run aulas:narrar -- 1.1 --estimar       # ensaio: silêncio, sem custo
npm run aulas:capturar -- 1.1               # telas da demonstração
npm run aulas:montar -- 1.1                 # vídeo de ensaio
# revisou e aprovou? narração de verdade e montagem final:
npm run aulas:narrar -- 1.1                 # com ELEVENLABS_API_KEY na sessão (ver abaixo)
npm run aulas:montar -- 1.1                 # --legendas-queimadas para WhatsApp
```

A chave da ElevenLabs **não** fica no `.env.local` nem no Coolify: não é
configuração do sistema, só da produção dos vídeos. Informe-a na própria
sessão do terminal, na hora de narrar (PowerShell: `$env:ELEVENLABS_API_KEY = "..."`).

Tudo sai em `docs/aulas/saida/<aula>/` (fora do Git): o `.mp4`, as
`legendas.srt` e a `conferencia.jpg` — miniaturas a cada cinco segundos, para
revisar a aula inteira sem assistir. `--todas` no lugar do id roda o curso.

## Conferir os roteiros

```bash
node scripts/conferir-roteiros.mjs          # todas as aulas
node scripts/conferir-roteiros.mjs 1.1 2.3  # só estas
```

Roda sem servidor e sem API, e reprova (código 1) quando:

- falta campo obrigatório, o id se repete ou a aula não está na trilha;
- um **texto citado num seletor não existe no código** (`src/`) nem no elenco —
  seletor que não existe é cena que não captura;
- uma rota de `navegar` não tem `page.tsx`;
- a **narração tem algarismo** (o texto vai direto à voz: escreva por extenso);
- a aula passa de seis minutos.

E avisa (sem reprovar) quando a fala ancora pela **posição** ("à direita",
"no topo"), quando uma sigla não está em [`pronuncia.json`](pronuncia.json) e
quando a duração foge do alvo.

## Formato do roteiro

```json
{
  "id": "1.1",
  "modulo": "1 — Beneficiárias, o coração do sistema",
  "titulo": "Cadastrar uma beneficiária",
  "publico": "Todas as profissionais que atendem",
  "pre_requisitos": ["0.2"],
  "objetivo": "O que a participante saberá fazer ao final.",
  "tarefa_final": "O que ela executa no sistema depois de assistir.",
  "duracao_alvo_seg": 180,
  "elenco": ["joana"],
  "sessao": "deslogada",
  "pendencias": ["O que precisa ser resolvido antes de capturar."],
  "cenas": [
    {
      "id": "c01",
      "tipo": "cartao",
      "cartao": { "titulo": "…", "subtitulo": "…", "linhas": ["…"] },
      "narracao": "Texto falado."
    },
    {
      "id": "c02",
      "narracao": "Texto falado enquanto a tela aparece.",
      "acao": [{ "tipo": "navegar", "url": "/mulheres/beneficiarias" }],
      "foco": { "seletor": "role=button[name=\"Nova Beneficiária\"]", "zoom": 2.0 }
    }
  ]
}
```

| Campo | Significado |
|---|---|
| `tipo` | `tela` (padrão: captura da página) ou `cartao` (tela de texto gerada em HTML — abertura, conceito, "sua vez") |
| `acao` | Uma ação ou uma lista, executadas **antes** da captura da cena |
| `foco` | Elemento que o zoom enquadra; `null` mostra a tela inteira. `zoom` de 1 a 2,5 |
| `elenco` | Chaves de [`elenco.json`](elenco.json) usadas na aula |
| `sessao` | `"deslogada"` para começar sem login (só a aula 0.2) |
| `pendencias` | Problemas do **sistema** que impedem a captura fiel. Aula com pendência não vai para a narração definitiva |

### Ações

| Tipo | Campos | Uso |
|---|---|---|
| `navegar` | `url` | Abre uma rota (relativa à instância de demonstração) |
| `clicar` | `seletor` | Clica no elemento |
| `digitar` | `seletor`, `texto` | Preenche o campo. Em campos de data, `{proxima_semana}` é trocado pela data |
| `selecionar` | `seletor`, `opcao` | Abre uma lista e escolhe a opção pelo texto |
| `marcar` | `seletor` | Marca uma caixa de seleção |
| `rolar` | `seletor` | Traz o elemento para a tela |
| `tecla` | `tecla` | Pressiona uma tecla (`Escape`, `Enter`) |
| `nenhuma` | — | Só narração; a tela da cena anterior continua |

### Seletores

Sempre pelo que a pessoa **vê**, nunca por classe CSS ou posição:

| Forma | Exemplo |
|---|---|
| Papel e nome | `role=button[name="Nova Beneficiária"]`, `role=tab[name="Eventos"]` |
| Rótulo do campo | `rotulo=Email institucional` |
| Texto visível | `text=Alerta de Risco` |
| Placeholder, title, aria-label | `[placeholder="Buscar por título ou local..."]`, `[title="Equipe"]` |
| Gancho de teste | `[data-testid="menu-usuario"]` — só quando o elemento não tem nome estável |

A senha da conta de demonstração nunca aparece no roteiro: use `{senha_demo}`,
trocado na hora da captura pelo valor do `.env.local`.

## Arquivos de apoio

- [`elenco.json`](elenco.json) — os personagens fictícios de todas as aulas, com
  CPFs artificiais e telefones de prefixo não atribuído. A instância de
  demonstração é povoada com eles.
- [`pronuncia.json`](pronuncia.json) — como a voz fala cada sigla.
- [`config.json`](config.json) — voz, resolução, viewport e tema da captura;
  uma configuração só para o curso inteiro.

## Captura: só na instância de demonstração

**Dados reais não podem ser gravados.** O sistema guarda informação de mulheres
em situação de violência. Um vídeo com o nome verdadeiro de uma delas é um
vazamento permanente e irreversível. A captura roda contra uma instância local,
povoada com o elenco, com a conta `demo@`. A produção, além disso, fica atrás de
um WAF que bloqueia navegador automatizado.

## Pendências registradas nos roteiros

| Aula | Pendência |
|---|---|
| 7.2 | Configuração de Integração (credenciais) fica fora do vídeo |
| 7.3 | Campos de UUID do App Amar ficam fora do vídeo |
| 8.3 | As séries já aparecem no site (só em períodos com consolidado); falta, se a coordenação quiser, uma cena sobre lançar série |
