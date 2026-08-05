#!/usr/bin/env bash
#
# Restauração de um backup gerado por backup-directus-db.sh.
#
# Existe porque backup que nunca foi restaurado não é backup — é esperança.
# Rode a restauração ao menos uma vez, num banco de teste, antes de precisar
# dela de verdade.
#
# Uso:
#   ./restore-directus-db.sh backups/sigma_directus_2026-07-30_020000.dump
#   PG_CONTAINER=meu-pg ./restore-directus-db.sh <arquivo>
#
# Por padrão restaura para um banco NOVO (sufixo _restore), sem tocar no banco
# em produção. Para sobrescrever o banco real é preciso --sobrescrever, que
# pede confirmação digitada.

set -Eeuo pipefail

ARQUIVO="${1:-}"
SOBRESCREVER=0
[[ "${2:-}" == "--sobrescrever" ]] && SOBRESCREVER=1

log()  { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
erro() { printf 'ERRO: %s\n' "$*" >&2; }

if [[ -z "$ARQUIVO" || ! -f "$ARQUIVO" ]]; then
  erro "informe o arquivo de backup."
  echo "uso: $0 <arquivo.dump> [--sobrescrever]" >&2
  exit 1
fi

# --- Contêiner e credenciais (mesma lógica do backup) ------------------------
descobrir_container() {
  [[ -n "${PG_CONTAINER:-}" ]] && { echo "$PG_CONTAINER"; return; }
  local achados total
  achados=$(docker ps --format '{{.Names}} {{.Image}}' \
    | grep -Ei '(^|[[:space:]/])(postgres|postgis|pgvector)' | awk '{print $1}' || true)
  total=$(printf '%s' "$achados" | grep -c . || true)
  [[ "$total" -eq 1 ]] || { erro "defina PG_CONTAINER=<nome> (encontrados: $total)"; exit 1; }
  printf '%s' "$achados"
}

CONTAINER="$(descobrir_container)"
PG_USER="${PG_USER:-$(docker exec "$CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo postgres)}"
PG_DB="${PG_DB:-$(docker exec "$CONTAINER" printenv POSTGRES_DB 2>/dev/null || echo "$PG_USER")}"

log "contêiner: $CONTAINER | banco de origem: $PG_DB"

# --- Valida o arquivo ANTES de qualquer escrita ------------------------------
if ! docker exec -i "$CONTAINER" pg_restore --list < "$ARQUIVO" >/dev/null 2>&1; then
  erro "arquivo ilegível por pg_restore. Restauração abortada."
  exit 1
fi
TABELAS=$(docker exec -i "$CONTAINER" pg_restore --list < "$ARQUIVO" | grep -c 'TABLE DATA' || true)
log "arquivo válido: ${TABELAS} tabelas com dados"

# --- Destino ------------------------------------------------------------------
if [[ "$SOBRESCREVER" -eq 1 ]]; then
  DESTINO="$PG_DB"
  echo
  echo "  ATENÇÃO: isto vai SOBRESCREVER o banco '$DESTINO' em $CONTAINER."
  echo "  Todos os dados atuais serão substituídos pelos do backup."
  echo "  O Directus deve estar PARADO durante a operação."
  echo
  read -r -p "  Digite o nome do banco para confirmar: " confirmacao
  [[ "$confirmacao" == "$DESTINO" ]] || { erro "confirmação não confere. Abortado."; exit 1; }
else
  DESTINO="${PG_DB}_restore"
  log "restaurando para banco separado: $DESTINO (use --sobrescrever para o banco real)"
  docker exec "$CONTAINER" psql -U "$PG_USER" -c "DROP DATABASE IF EXISTS \"$DESTINO\";" >/dev/null
  docker exec "$CONTAINER" psql -U "$PG_USER" -c "CREATE DATABASE \"$DESTINO\";" >/dev/null
fi

log "restaurando…"
docker exec -i "$CONTAINER" pg_restore -U "$PG_USER" -d "$DESTINO" \
  --no-owner --clean --if-exists < "$ARQUIVO" 2>&1 | tail -20 || true

# --- Conferência --------------------------------------------------------------
CONTAGEM=$(docker exec "$CONTAINER" psql -U "$PG_USER" -d "$DESTINO" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo 0)
log "tabelas no destino: $CONTAGEM"

BENEF=$(docker exec "$CONTAINER" psql -U "$PG_USER" -d "$DESTINO" -tAc \
  "SELECT count(*) FROM beneficiarias;" 2>/dev/null || echo "n/d")
log "beneficiárias restauradas: $BENEF"

log "concluído. Confira os números acima antes de considerar a restauração boa."
