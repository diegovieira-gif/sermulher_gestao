# Vídeo-aulas — pipeline de produção

Automatiza a gravação das aulas de [`../trilha-videos.md`](../trilha-videos.md).
Cada aula é um JSON de cenas que serve a dois propósitos ao mesmo tempo:
roteiro de narração e script de navegação. Um arquivo só — não há dois textos
para manter em sincronia.

## Como funciona

```
plano.json  (cenas: narração + ação)
     │
     ├─ 1. gerar-narracao.mjs → audio/<aula>/c01.mp3 … + tempos.json
     │                          (TTS da OpenAI, mede a duração real)
     │
     ├─ 2. gravar-aula.mjs    → video/<aula>.webm
     │                          (Playwright; cada cena dura o tempo do seu áudio)
     │
     └─ 3. ffmpeg             → <aula>.mp4 com áudio embutido
```

**O áudio é o relógio.** A narração é gerada primeiro, a duração real de cada
trecho é medida, e o Playwright ajusta o tempo de cada cena a ela. O caminho
inverso — gravar solto e depois esticar o áudio — desmonta a cada mudança de
tela.

## Executar

```bash
# 1. Ensaiar sem gastar API: estima durações pelo tamanho do texto
node scripts/gerar-narracao.mjs docs/aulas/1.1-cadastrar-beneficiaria.json --estimar

# 2. Gerar a narração de verdade
OPENAI_API_KEY=... node scripts/gerar-narracao.mjs docs/aulas/1.1-cadastrar-beneficiaria.json

# 3. Gravar (contra instância LOCAL — ver abaixo)
BASE_URL=http://localhost:3000 \
TEST_USER_EMAIL=demo@exemplo.local TEST_USER_PASSWORD=... \
node scripts/gravar-aula.mjs docs/aulas/1.1-cadastrar-beneficiaria.json

# 4. Juntar áudio e vídeo
ffmpeg -i video/1.1-*.webm -i audio/1.1/narracao.mp3 -c:v libx264 -c:a aac 1.1.mp4
```

O passo 1 permite ensaiar a aula inteira — inclusive a gravação — sem chave da
OpenAI. Use-o para ajustar o roteiro antes de gerar áudio.

## Grave contra instância local, nunca produção

Duas razões, e a segunda é a que importa de verdade:

**O WAF bloqueia navegador automatizado.** Apontar para
`sigma-sermulher.aracaju.se.gov.br` devolve *"Web Page Blocked — Attack ID"*
com HTTP 500. O `curl` passa; o Chrome do Playwright não.

**Dados reais não podem ser gravados.** O sistema guarda informação de mulheres
em situação de violência. Um vídeo institucional com o nome verdadeiro de uma
delas é um vazamento permanente e irreversível — não há como "despublicar" um
arquivo que circulou. Use um ambiente de demonstração com dados fictícios e uma
conta `demo@`, jamais a credencial de uma servidora.

## Estrutura do plano de aula

```json
{
  "id": "1.1",
  "titulo": "Cadastrar uma beneficiária",
  "objetivo": "O que a participante saberá fazer ao final.",
  "tarefa_final": "O que ela deve executar no sistema depois de assistir.",
  "duracao_alvo_seg": 300,
  "voz": { "modelo": "gpt-4o-mini-tts", "voz": "nova", "instrucao": "..." },
  "cenas": [
    { "id": "c01", "narracao": "texto falado", "acao": { "tipo": "clicar", "seletor": "..." } }
  ]
}
```

### Tipos de ação

| Tipo | Campos | Uso |
|---|---|---|
| `navegar` | `url` | Abre uma rota (relativa ao `BASE_URL`) |
| `clicar` | `seletor` | Move o mouse até o elemento e clica |
| `digitar` | `seletor`, `texto` | Digita caractere a caractere, visível |
| `destacar` | `seletor` | Circunda o elemento e escurece o resto |
| `rolar` | `seletor` | Traz o elemento para a tela |
| `esperar` | `ms` | Deixa a tela parada (para narração sobre o que já está visível) |
| `nenhuma` | — | Só narração, sem mexer na tela |

### Detalhes que a gravação resolve por baixo

**Cursor.** O Playwright não desenha o ponteiro no vídeo. Sem tratamento, o
espectador vê campos preenchendo sozinhos. Um cursor é injetado via
`addInitScript`, segue as coordenadas reais e pulsa no clique.

**Digitação.** `fill()` preencheria o campo instantaneamente; a aula usa
`pressSequentially` para que se veja o que está sendo escrito.

**Cena que estoura.** Se a ação demora mais que o áudio, o script avisa no log
com quantos segundos passou — sinal de que o texto daquela cena precisa crescer
ou a ação precisa ser dividida.

## Escrevendo uma aula nova

1. Copie um plano existente e ajuste `id`, `titulo` e `cenas`.
2. **Confira os seletores no código-fonte**, não de memória. Seletor errado é
   vídeo que não grava.
3. Rode com `--estimar` e veja se a duração cabe no alvo.
4. Grave e assista antes de gerar o áudio definitivo.

Use dados fictícios evidentes nos exemplos — nomes que ninguém confunda com
pessoas reais.
