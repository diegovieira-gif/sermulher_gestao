#!/usr/bin/env bash
#
# Restauração de um backup gerado por backup-directus-db.sh (SQLite + uploads).
#
# Existe porque backup que nunca foi restaurado não é backup — é esperança.
# Rode ao menos uma vez em modo de conferência, ANTES de precisar dele de
# verdade. O modo padrão não toca em nada em produção.
#
# Uso:
#   # 1. Conferência (padrão): valida o arquivo e mostra o que há dentro.
#   ./restore-directus-db.sh backups/sigma_db_2026-08-16_020000.db
#
#   # 2. Restauração real: PARA o Directus, substitui o banco e sobe de novo.
#   ./restore-directus-db.sh backups/sigma_db_2026-08-16_020000.db --sobrescrever
#
#   # Uploads (opcional, junto com --sobrescrever):
#   UPLOADS=backups/sigma_uploads_2026-08-16_020000.tgz \
#     ./restore-directus-db.sh backups/sigma_db_...db --sobrescrever
#
# Diferente do PostgreSQL, não dá para "restaurar num banco ao lado" sem
# reconfigurar o Directus: o arquivo é apontado por DB_FILENAME. Por isso a
# conferência aqui é feita sobre o próprio arquivo de backup, sem subir nada.

set -Eeuo pipefail

ARQUIVO="${1:-}"
SOBRESCREVER=0
[[ "${2:-}" == "--sobrescrever" ]] && SOBRESCREVER=1

SQLITE_IMAGE="${SQLITE_IMAGE:-keinos/sqlite3:latest}"

# Como no backup: a imagem roda como uid=100(sqlite) e os arquivos de backup
# são 600 de root, porque contêm prontuários. Sem `--user 0:0` o contêiner nem
# consegue LER o arquivo que vai restaurar.
DOCKER_SQLITE=(docker run --rm --user 0:0)

log()  { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
erro() { printf 'ERRO: %s\n' "$*" >&2; }

trap 'erro "falhou na linha $LINENO"' ERR

if [[ -z "$ARQUIVO" || ! -f "$ARQUIVO" ]]; then
  erro "informe o arquivo de backup do banco."
  echo "uso: $0 <sigma_db_*.db> [--sobrescrever]" >&2
  exit 1
fi

# --- sqlite3: no host ou em contêiner efêmero ---------------------------------
DIR_ARQ="$(cd "$(dirname "$ARQUIVO")" && pwd)"
NOME_ARQ="$(basename "$ARQUIVO")"

sq() {
  local sql="$1"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DIR_ARQ/$NOME_ARQ" "$sql"
  else
    "${DOCKER_SQLITE[@]}" -v "$DIR_ARQ:/b" "$SQLITE_IMAGE" sqlite3 "/b/$NOME_ARQ" "$sql"
  fi
}

# --- Valida o arquivo ANTES de qualquer escrita -------------------------------
log "validando $NOME_ARQ…"

CHECK="$(sq 'PRAGMA integrity_check;' 2>/dev/null || echo 'ilegível')"
if [[ "$CHECK" != "ok" ]]; then
  erro "o arquivo não passou no integrity_check ($CHECK). Restauração abortada."
  exit 1
fi

TABELAS="$(sq "SELECT count(*) FROM sqlite_master WHERE type='table';")"
BENEF="$(sq 'SELECT count(*) FROM beneficiarias;' 2>/dev/null || echo 'n/d')"
ATEND="$(sq 'SELECT count(*) FROM atendimentos;' 2>/dev/null || echo 'n/d')"
EQUIPE="$(sq 'SELECT count(*) FROM equipe_evento;' 2>/dev/null || echo 'n/d')"

log "arquivo íntegro"
log "  tabelas ........ $TABELAS"
log "  beneficiárias .. $BENEF"
log "  atendimentos ... $ATEND"
log "  equipe_evento .. $EQUIPE"

if [[ "$SOBRESCREVER" -eq 0 ]]; then
  echo
  log "CONFERÊNCIA apenas — nada foi alterado."
  log "Os números acima devem bater com o esperado para a data do backup."
  log "Para restaurar de verdade: $0 $ARQUIVO --sobrescrever"
  exit 0
fi

# --- Contêiner ----------------------------------------------------------------
descobrir_container() {
  [[ -n "${DIRECTUS_CONTAINER:-}" ]] && { printf '%s' "$DIRECTUS_CONTAINER"; return; }
  local achados total
  achados=$(docker ps --format '{{.Names}} {{.Image}}' \
    | grep -Ei 'directus/directus' | awk '{print $1}' || true)
  total=$(printf '%s' "$achados" | grep -c . || true)
  if [[ "$total" -ne 1 ]]; then
    erro "encontrados $total contêineres do Directus — defina DIRECTUS_CONTAINER=<nome>."
    printf '%s\n' "$achados" >&2
    exit 1
  fi
  printf '%s' "$achados"
}

CONTAINER="$(descobrir_container)"
DB_FILENAME="$(docker exec "$CONTAINER" printenv DB_FILENAME 2>/dev/null || true)"
DB_FILENAME="${DB_FILENAME:-/directus/database/data.db}"

echo
echo "  ATENÇÃO: isto vai SUBSTITUIR o banco do Directus em execução."
echo "    contêiner ....... $CONTAINER"
echo "    banco de destino  $DB_FILENAME"
echo "    origem .......... $NOME_ARQ ($BENEF beneficiárias)"
echo
echo "  Todos os dados registrados APÓS a data deste backup serão perdidos."
echo "  O Directus será parado durante a operação e religado ao final."
echo
read -r -p "  Digite RESTAURAR para confirmar: " confirmacao
[[ "$confirmacao" == "RESTAURAR" ]] || { erro "confirmação não confere. Abortado."; exit 1; }

# --- Salvaguarda: o estado atual antes de ser substituído ---------------------
#
# Se a restauração for a escolha errada (backup velho demais, arquivo trocado),
# ainda existe caminho de volta. Sem isto, restaurar é irreversível.
CARIMBO="$(date '+%Y-%m-%d_%H%M%S')"
SALVAGUARDA="$DIR_ARQ/pre-restauracao_${CARIMBO}.db"
log "guardando o estado atual em $(basename "$SALVAGUARDA")…"
if docker exec "$CONTAINER" sh -c "command -v sqlite3" >/dev/null 2>&1; then
  docker exec "$CONTAINER" sqlite3 "$DB_FILENAME" "VACUUM INTO '/tmp/pre_restauracao.db';"
  docker cp "$CONTAINER:/tmp/pre_restauracao.db" "$SALVAGUARDA"
  docker exec "$CONTAINER" rm -f /tmp/pre_restauracao.db
  chmod 600 "$SALVAGUARDA"
  log "salvaguarda criada"
else
  erro "não foi possível criar a salvaguarda (sqlite3 ausente no contêiner)."
  read -r -p "  Continuar mesmo assim, SEM caminho de volta? (digite SIM): " r
  [[ "$r" == "SIM" ]] || { erro "abortado."; exit 1; }
fi

# --- Restauração ---------------------------------------------------------------
log "parando o Directus…"
docker stop "$CONTAINER" >/dev/null

log "substituindo o banco…"
# Os arquivos -wal e -shm precisam sair junto: se sobrarem, o SQLite tenta
# aplicá-los sobre o banco novo e o resultado é imprevisível.
docker cp "$ARQUIVO" "$CONTAINER:$DB_FILENAME"
"${DOCKER_SQLITE[@]}" --volumes-from "$CONTAINER" "$SQLITE_IMAGE" \
  sh -c "rm -f ${DB_FILENAME}-wal ${DB_FILENAME}-shm" 2>/dev/null || true

if [[ -n "${UPLOADS:-}" ]]; then
  if [[ -f "$UPLOADS" ]]; then
    log "restaurando os arquivos enviados…"
    "${DOCKER_SQLITE[@]}" --volumes-from "$CONTAINER" \
      -v "$(cd "$(dirname "$UPLOADS")" && pwd):/bk" \
      "$SQLITE_IMAGE" sh -c "tar xzf /bk/$(basename "$UPLOADS") -C /directus" \
      || erro "falha ao restaurar uploads — o banco foi restaurado mesmo assim."
  else
    erro "arquivo de uploads não encontrado: $UPLOADS (banco restaurado sem anexos)"
  fi
else
  log "AVISO: nenhum arquivo de uploads informado — os anexos NÃO foram restaurados."
  log "       Use UPLOADS=<sigma_uploads_*.tgz> para incluí-los."
fi

log "religando o Directus…"
docker start "$CONTAINER" >/dev/null

# --- Conferência pós-restauração ------------------------------------------------
log "aguardando o Directus responder…"
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" sh -c 'command -v wget >/dev/null && wget -qO- http://localhost:8055/server/health' >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log "concluído."
log "Salvaguarda do estado anterior: $SALVAGUARDA"
log "Confira o sistema pela interface antes de considerar a restauração boa."
