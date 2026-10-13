# Fonte do SIGMA para o Hub de Dados Municipais

Atende à "Documentação de padronização de webservice para centralização de
dados referente a munícipes" do Comitê de Transformação Digital (Secretaria
Municipal de Governo).

## Endereços

| Método | URL | Retorno |
|---|---|---|
| GET | `https://sigma-sermulher.aracaju.se.gov.br/api/hub/cidadaos` | `{ status, qtd_pagina, qtd_usuarios }` |
| GET | `https://sigma-sermulher.aracaju.se.gov.br/api/hub/cidadaos/{pagina}` | `{ status, pagina, paginas_restantes, qtd, data[] }` (página começa em 1) |

- Autenticação: `Authorization: Bearer {HUB_DADOS_TOKEN}`. Sem token ou token
  errado → **401**. Fonte sem token configurado → **503**.
- 100 registros por página, em ordem fixa (id da ficha).
- Página fora do intervalo (ou não numérica) → `{"status":"not found","qtd":0,"data":[]}`.
- Directus lento ou fora → **503** em até ~8 s (nunca conexão pendurada).
- Usar sempre o domínio HTTPS: pelo `http://…:3002` o token trafega sem cifra.

## O que sai (minimização — LGPD)

Estar nesta lista já revela atendimento pela Secretaria da Mulher. Por isso:

| Campo do contrato | Enviado |
|---|---|
| `cpf` | Sim — 11 dígitos, sem máscara |
| `nome` | Sim (`nome_completo`) |
| `data_nascimento` | Sim, ou vazio |
| `ultima_atualizacao` | Sim — `date_updated` (ou `date_created`) no horário de Brasília |
| `nome_mae` | Sim (campo "Nome da Mãe" da ficha), ou vazio |
| `vinculos_familiares` | `[]` — o SIGMA não registra vínculos com CPF |
| `endereco`, `bairro` | **Não enviados** |

**Ficam de fora:**
- quem tem medida protetiva — na ficha (`possui_medida_protetiva`) ou em
  qualquer atendimento (`atendimentos.medida_protetiva`);
- fichas sem CPF de 11 dígitos;
- CPF repetido em duas fichas: vai uma vez (a ficha mais antiga);
- **autores da Sala Azul: nunca.**

Ampliar campos ou mudar exclusões é decisão da gestão com o encarregado de
dados, registrada por escrito — não do código. As regras estão em
`src/lib/hub-dados.ts` (testes em `tests/unit/hub-dados.spec.ts`).

## Auditoria

Cada consulta gera uma linha no log do container (Coolify → Logs), sem CPF
nem nome:

```
[hub-dados] {"em":"…","ip":"…","rota":"pagina 1","status":200,"qtd":84}
```

## Ativar

1. Gerar um token longo e aleatório (ex.: `openssl rand -hex 32`).
2. Coolify → app `sermulher_gestao` → Environment Variables:
   `HUB_DADOS_TOKEN=<token>` → Redeploy.
3. Entregar o token ao Comitê por canal seguro (nunca por e-mail/WhatsApp
   em texto aberto).

Trocar o token = mudar a variável e avisar o Comitê.
