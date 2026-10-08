# Vídeo-aulas — roteiros e produção

Os roteiros das aulas de [`../trilha-videos.md`](../trilha-videos.md). Cada aula é
um JSON de cenas que serve a dois propósitos ao mesmo tempo: **texto da
narração** e **instrução de captura de tela**. Um arquivo só — não há dois
textos para manter em sincronia.

## Pipeline

Decidido em 10/2026, a partir do que o `curso_inteligente` já aprendeu fazendo:

```
roteiro.json  (cenas: narração + ação na tela + foco do zoom)
     │
     ├─ 0. conferir-roteiros.mjs   regras, âncoras no código, duração      ✅ pronto
     ├─ 1. revisão                 equipe da Secretaria lê antes de gastar  ⏳ processo
     ├─ 2. narração (Gemini TTS)   pedaços com cache + guardas de qualidade ⏳ a construir
     ├─ 3. captura (Playwright)    uma imagem por cena + caixa do foco      ⏳ a construir
     ├─ 4. cena em vídeo           zoom/pan sobre o foco, cartões em HTML   ⏳ a construir
     └─ 5. montagem (ffmpeg)       cenas + narração + legendas → .mp4       ⏳ a construir
```

**Captura + zoom, e não gravação contínua.** A tela de cada cena é capturada
como imagem, e o vídeo da cena é um zoom suave sobre o elemento citado. Corrigir
uma frase refaz só aquela cena, em segundos — a tela não precisa "acompanhar" o
áudio, e o zoom aponta exatamente o campo de que a fala trata. O ponto do zoom
sai do **próprio elemento na página** (a caixa do seletor de `foco`), e não de
coordenadas marcadas à mão.

**A narração é a última coisa a ser gerada.** Só com o roteiro estável e
revisado: narrar cedo deixa o áudio para trás a cada ajuste, e gerar tudo de uma
vez deixa a voz homogênea entre as aulas.

**Não confie no "ok" do TTS.** O `curso_inteligente` publicou aula com o modelo
lendo a instrução de direção em voz alta, com trecho mudo e com frase repetida —
todas com status "ok". As guardas a construir: silêncio longo no meio,
leitura em dobro (ritmo muito abaixo do esperado), variação de altura da voz
entre pedaços, e uma **escuta** (transcrever o áudio gerado e comparar com o
texto).

> Os scripts `gerar-narracao.mjs` (TTS da OpenAI) e `gravar-aula.mjs` (gravação
> contínua) são do pipeline anterior e serão substituídos pelos passos 2 a 5.

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
| 1.1 | Rótulo "Data de Nascimento \*" marca como obrigatório um campo que não é |
| 1.1 | Confirmar se o banco impede CPF duplicado (o app não impede) |
| 6.4 | Frequência da avaliação é digitada e pode divergir da lista de presença usada no relatório ao Judiciário |
| 7.2 | Campanhas de WhatsApp não pedem autorização da beneficiária |
| 7.2 | Configuração de Integração (credenciais) fica fora do vídeo |
| 7.3 | Campos de UUID do App Amar ficam fora do vídeo |
| 8.3 | Confirmar onde os dados do Observatório são exibidos |
