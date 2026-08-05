#!/usr/bin/env bash
#
# Backup do banco PostgreSQL do Directus (SIGMA / SerMulher).
#
# Roda NO HOST onde o Docker está — não a partir do repositório de
# desenvolvimento. Descobre o contêiner do Postgres e lê as credenciais do
# ambiente dele, então não há senha escrita neste arquivo.
#
# Por que isto existe: a exportação CSV das beneficiárias cobre UMA coleção
# entre mais de sessenta. Atendimentos, CRAM, tramitações, participações e os
# vínculos entre tudo isso só voltam com um dump do banco.
#
# Uso:
#   ./backup-directus-db.sh                  # backup em ./backups
#   BACKUP_DIR=/var/backups/sigma ./backup-directus-db.sh
#   RETENCAO_DIAS=30 ./backup-directus-db.sh
#   ./backup-directus-db.sh --verificar      # só checa o ambiente, não gera
#
# Cron diário às 2h (crontab -e):
#   0 2 * * * BACKUP_DIR=/var/backups/sigma /caminho/backup-directus-db.sh >> /var/log/sigma-backup.log 2>&1

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"
# Um dump saudável desta base passa de 1 MB. Abaixo disso, algo deu errado e o
# arquivo não deve ser tratado como backup válido.
TAMANHO_MINIMO_BYTES="${TAMANHO_MINIMO_BYTES:-100000}"

SOMENTE_VERIFICAR=0
[[ "${1:-}" == "--verificar" ]] && SOMENTE_VERIFICAR=1

log()  { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
erro() { printf '[%s] ERRO: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }

trap 'erro "falhou na linha $LINENO"' ERR

# --- 1. Localiza o contêiner do Postgres -------------------------------------
#
# Busca pela imagem em vez do nome: nomes variam entre instalações, a imagem
# não. Se houver mais de um, exige escolha explícita em vez de adivinhar.
descobrir_container() {
  if [[ -n "${PG_CONTAINER:-}" ]]; then
    echo "$PG_CONTAINER"
    return
  fi

  local encontrados
  encontrados=$(docker ps --format '{{.Names}} {{.Image}}' \
    | grep -Ei '(^|[[:space:]/])(postgres|postgis|pgvector)' \
    | awk '{print $1}' || true)

  local total
  total=$(printf '%s' "$encontrados" | grep -c . || true)

  if [[ "$total" -eq 0 ]]; then
    erro "nenhum contêiner PostgreSQL em execução."
    erro "Defina PG_CONTAINER=<nome> se a imagem tiver outro nome."
    exit 1
  fi

  if [[ "$total" -gt 1 ]]; then
    erro "mais de um contêiner PostgreSQL encontrado:"
    printf '%s\n' "$encontrados" >&2
    erro "Escolha um: PG_CONTAINER=<nome> $0"
    exit 1
  fi

  printf '%s' "$encontrados"
}

# --- 2. Credenciais, lidas do próprio contêiner ------------------------------
ler_env_container() {
  local container="$1" chave="$2"
  docker exec "$container" printenv "$chave" 2>/dev/null || true
}

CONTAINER="$(descobrir_container)"
log "contêiner PostgreSQL: $CONTAINER"

PG_USER="${PG_USER:-$(ler_env_container "$CONTAINER" POSTGRES_USER)}"
PG_DB="${PG_DB:-$(ler_env_container "$CONTAINER" POSTGRES_DB)}"

# A imagem oficial usa "postgres" quando as variáveis não são definidas.
PG_USER="${PG_USER:-postgres}"
PG_DB="${PG_DB:-$PG_USER}"

log "banco: $PG_DB (usuário $PG_USER)"

# --- 3. Verificação do ambiente ----------------------------------------------
if ! docker exec "$CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
  erro "o banco não respondeu a pg_isready. Backup abortado."
  exit 1
fi
log "banco respondendo"

if [[ "$SOMENTE_VERIFICAR" -eq 1 ]]; then
  log "verificação concluída — nada foi gerado (--verificar)."
  exit 0
fi

# --- 4. Dump ------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"
# O dump contém dados de mulheres em situação de violência: o diretório não pode
# ser legível por outros usuários da máquina.
chmod 700 "$BACKUP_DIR"

CARIMBO="$(date '+%Y-%m-%d_%H%M%S')"
ARQUIVO="$BACKUP_DIR/sigma_${PG_DB}_${CARIMBO}.dump"
PARCIAL="$ARQUIVO.parcial"

log "gerando dump…"

# Formato custom (-Fc): já comprimido, permite restauração seletiva de tabelas
# e é o que `pg_restore` espera. Escreve em .parcial e só renomeia no fim —
# assim um backup interrompido nunca é confundido com um completo.
if ! docker exec "$CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc --no-owner \
  > "$PARCIAL" 2>/tmp/sigma-pgdump-erro.txt; then
  erro "pg_dump falhou:"
  cat /tmp/sigma-pgdump-erro.txt >&2
  rm -f "$PARCIAL"
  exit 1
fi

# --- 5. Validação antes de aceitar o arquivo ---------------------------------
TAMANHO=$(stat -c%s "$PARCIAL" 2>/dev/null || stat -f%z "$PARCIAL")

if [[ "$TAMANHO" -lt "$TAMANHO_MINIMO_BYTES" ]]; then
  erro "dump com apenas ${TAMANHO} bytes — abaixo do mínimo esperado."
  erro "Um backup truncado é pior que nenhum: dá falsa segurança. Descartado."
  rm -f "$PARCIAL"
  exit 1
fi

# Se o pg_restore não consegue listar o conteúdo, o arquivo não serve.
if ! docker exec -i "$CONTAINER" pg_restore --list < "$PARCIAL" >/dev/null 2>&1; then
  erro "o dump não passou na leitura por pg_restore. Descartado."
  rm -f "$PARCIAL"
  exit 1
fi

TABELAS=$(docker exec -i "$CONTAINER" pg_restore --list < "$PARCIAL" 2>/dev/null \
  | grep -c 'TABLE DATA' || true)

mv "$PARCIAL" "$ARQUIVO"
chmod 600 "$ARQUIVO"

log "backup válido: $ARQUIVO ($(numfmt --to=iec "$TAMANHO" 2>/dev/null || echo "${TAMANHO}B"), ${TABELAS} tabelas)"

# --- 6. Rotação ----------------------------------------------------------------
REMOVIDOS=$(find "$BACKUP_DIR" -maxdepth 1 -name 'sigma_*.dump' -type f \
  -mtime +"$RETENCAO_DIAS" -print -delete | wc -l)
log "rotação: ${REMOVIDOS} backup(s) com mais de ${RETENCAO_DIAS} dias removido(s)"

TOTAL=$(find "$BACKUP_DIR" -maxdepth 1 -name 'sigma_*.dump' -type f | wc -l)
log "backups mantidos: ${TOTAL}"

# Restos de execuções interrompidas não devem se acumular.
find "$BACKUP_DIR" -maxdepth 1 -name '*.parcial' -mmin +120 -delete 2>/dev/null || true

log "concluído."
