#!/usr/bin/env bash
#
# Backup do Directus (SIGMA / SerMulher) — banco SQLite + arquivos enviados.
#
# Roda NO HOST onde o Docker está, não a partir do repositório de
# desenvolvimento. Descobre o contêiner e os volumes sozinho; nenhuma senha
# fica escrita neste arquivo.
#
# ATENÇÃO AO QUE É COPIADO. São DUAS coisas, e faltar uma inutiliza a outra:
#
#   1. `data.db`  — todas as coleções (beneficiárias, atendimentos, CRAM,
#      tramitações, equipe de evento e os vínculos entre elas).
#   2. `uploads/` — os arquivos anexados (fotos, documentos, imagens de
#      campanha). O banco guarda apenas a REFERÊNCIA ao arquivo; restaurar só
#      o banco devolve um sistema cheio de anexos quebrados.
#
# Por que não é `cp data.db`: com o Directus em uso o SQLite mantém parte das
# transações no arquivo -wal. Copiar só o .db pode gerar uma cópia
# inconsistente que só se revela na hora da restauração. Aqui o backup usa
# `VACUUM INTO`, que produz um arquivo íntegro com o banco em pleno uso.
#
# Uso:
#   ./backup-directus-db.sh                  # backup em ./backups
#   BACKUP_DIR=/var/backups/sigma ./backup-directus-db.sh
#   RETENCAO_DIAS=30 ./backup-directus-db.sh
#   ./backup-directus-db.sh --verificar      # checa o ambiente, não gera nada
#
#   # Com cópia externa (ver "Cópia externa" no README):
#   RCLONE_REMOTO=sigma-drive:SIGMA-Backups ./backup-directus-db.sh
#
# Cron diário às 2h (crontab -e):
#   0 2 * * * BACKUP_DIR=/var/backups/sigma /caminho/backup-directus-db.sh >> /var/log/sigma-backup.log 2>&1

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"
# Um banco saudável desta instalação passa de 1 MB. Bem abaixo disso indica
# cópia truncada — e backup truncado é pior que nenhum, porque dá falsa
# segurança.
TAMANHO_MINIMO_BYTES="${TAMANHO_MINIMO_BYTES:-100000}"
# Imagem usada só se o contêiner do Directus não tiver o cliente sqlite3.
SQLITE_IMAGE="${SQLITE_IMAGE:-keinos/sqlite3:latest}"

# O contêiner auxiliar roda como root de propósito.
#
# A imagem keinos/sqlite3 roda como uid=100(sqlite); o diretório de backup é
# 700 e os arquivos 600, ambos de root — porque guardam prontuários de mulheres
# em situação de violência. Sem isto o VACUUM INTO falha com "unable to open
# database", e a validação seguinte nem consegue LER a cópia recém-criada.
#
# A alternativa seria afrouxar a permissão do diretório, o que é exatamente o
# que não se deve fazer com esse conteúdo. O contêiner é efêmero e só enxerga
# os volumes montados aqui.
DOCKER_SQLITE=(docker run --rm --user 0:0)

SOMENTE_VERIFICAR=0
[[ "${1:-}" == "--verificar" ]] && SOMENTE_VERIFICAR=1

log()  { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
erro() { printf '[%s] ERRO: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }

trap 'erro "falhou na linha $LINENO"' ERR

# --- 1. Contêiner do Directus -------------------------------------------------
#
# Busca pela imagem, não pelo nome: o Coolify gera nomes com UUID, que mudam a
# cada recriação do serviço. Havendo mais de um Directus na máquina (há:
# sermulher, sos e bus), exige escolha explícita em vez de adivinhar — pegar o
# errado faria backup do sistema errado sem avisar.
descobrir_container() {
  if [[ -n "${DIRECTUS_CONTAINER:-}" ]]; then
    printf '%s' "$DIRECTUS_CONTAINER"
    return
  fi

  local encontrados total
  encontrados=$(docker ps --format '{{.Names}} {{.Image}}' \
    | grep -Ei 'directus/directus' \
    | awk '{print $1}' || true)
  total=$(printf '%s' "$encontrados" | grep -c . || true)

  if [[ "$total" -eq 0 ]]; then
    erro "nenhum contêiner do Directus em execução."
    erro "Defina DIRECTUS_CONTAINER=<nome> se a imagem tiver outro nome."
    exit 1
  fi

  if [[ "$total" -gt 1 ]]; then
    erro "há mais de um Directus nesta máquina:"
    printf '%s\n' "$encontrados" >&2
    erro "Escolha qual: DIRECTUS_CONTAINER=<nome> $0"
    exit 1
  fi

  printf '%s' "$encontrados"
}

CONTAINER="$(descobrir_container)"
log "contêiner do Directus: $CONTAINER"

# --- 2. Confere que o banco é mesmo SQLite ------------------------------------
#
# Guarda contra a troca silenciosa de banco: se um dia a instalação migrar para
# PostgreSQL, este script para de servir e precisa avisar em vez de gerar um
# arquivo inútil.
DB_CLIENT="$(docker exec "$CONTAINER" printenv DB_CLIENT 2>/dev/null || true)"
DB_FILENAME="$(docker exec "$CONTAINER" printenv DB_FILENAME 2>/dev/null || true)"
DB_FILENAME="${DB_FILENAME:-/directus/database/data.db}"

if [[ -n "$DB_CLIENT" && "$DB_CLIENT" != "sqlite3" ]]; then
  erro "este Directus usa DB_CLIENT=$DB_CLIENT, não sqlite3."
  erro "Este script cobre apenas SQLite — use o procedimento do banco correto."
  exit 1
fi

if ! docker exec "$CONTAINER" test -f "$DB_FILENAME"; then
  erro "arquivo do banco não encontrado em $DB_FILENAME (dentro do contêiner)."
  exit 1
fi

log "banco: $DB_FILENAME (sqlite3)"

# --- 3. Como executar o sqlite3 ------------------------------------------------
#
# A imagem oficial do Directus nem sempre traz o cliente sqlite3. Ordem de
# preferência: dentro do próprio contêiner (mais simples) → contêiner efêmero
# montando o mesmo volume.
VOLUME_DB="$(docker inspect -f \
  '{{range .Mounts}}{{if eq .Destination "/directus/database"}}{{.Name}}{{end}}{{end}}' \
  "$CONTAINER" 2>/dev/null || true)"
VOLUME_UPLOADS="$(docker inspect -f \
  '{{range .Mounts}}{{if eq .Destination "/directus/uploads"}}{{.Name}}{{end}}{{end}}' \
  "$CONTAINER" 2>/dev/null || true)"

MODO_SQLITE=""
if docker exec "$CONTAINER" sh -c 'command -v sqlite3' >/dev/null 2>&1; then
  MODO_SQLITE="interno"
elif [[ -n "$VOLUME_DB" ]]; then
  MODO_SQLITE="efemero"
else
  erro "sem cliente sqlite3 no contêiner e sem volume identificado para montar."
  erro "Instale o sqlite3 na imagem ou defina SQLITE_IMAGE e garanta o volume."
  exit 1
fi
log "estratégia de cópia: $MODO_SQLITE"
[[ -n "$VOLUME_UPLOADS" ]] && log "volume de uploads: $VOLUME_UPLOADS" \
  || log "AVISO: volume de uploads não identificado — anexos NÃO serão salvos."

# Executa uma consulta SQL no banco, pela estratégia disponível.
sqlite_exec() {
  local sql="$1"
  if [[ "$MODO_SQLITE" == "interno" ]]; then
    docker exec "$CONTAINER" sqlite3 "$DB_FILENAME" "$sql"
  else
    "${DOCKER_SQLITE[@]}" -v "$VOLUME_DB:/db" "$SQLITE_IMAGE" \
      sqlite3 "/db/$(basename "$DB_FILENAME")" "$sql"
  fi
}

# --- 4. Verificação do ambiente ------------------------------------------------
if ! INTEGRIDADE="$(sqlite_exec 'PRAGMA quick_check;' 2>/dev/null)"; then
  erro "não foi possível consultar o banco pelo sqlite3."
  [[ "$MODO_SQLITE" == "efemero" ]] && erro "Verifique se a imagem $SQLITE_IMAGE está disponível."
  exit 1
fi

if [[ "$INTEGRIDADE" != "ok" ]]; then
  erro "o banco de ORIGEM não passou no quick_check: $INTEGRIDADE"
  erro "Backup abortado — copiar um banco corrompido apenas propaga o problema."
  exit 1
fi
log "banco de origem íntegro"

if [[ "$SOMENTE_VERIFICAR" -eq 1 ]]; then
  TABELAS="$(sqlite_exec "SELECT count(*) FROM sqlite_master WHERE type='table';")"
  log "tabelas no banco: $TABELAS"
  log "verificação concluída — nada foi gerado (--verificar)."
  exit 0
fi

# --- 5. Cópia -------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"
# O conteúdo tem dados de mulheres em situação de violência: o diretório não
# pode ser legível por outros usuários da máquina.
chmod 700 "$BACKUP_DIR"

CARIMBO="$(date '+%Y-%m-%d_%H%M%S')"
ARQ_DB="$BACKUP_DIR/sigma_db_${CARIMBO}.db"
ARQ_UPLOADS="$BACKUP_DIR/sigma_uploads_${CARIMBO}.tgz"
PARCIAL="$ARQ_DB.parcial"
TMP_NO_CONTAINER="/tmp/sigma_backup_${CARIMBO}.db"

log "copiando o banco (VACUUM INTO)…"

# VACUUM INTO produz um arquivo consistente mesmo com escrita acontecendo, e
# ainda desfragmenta. O destino NÃO pode existir previamente.
if [[ "$MODO_SQLITE" == "interno" ]]; then
  docker exec "$CONTAINER" sqlite3 "$DB_FILENAME" \
    "VACUUM INTO '$TMP_NO_CONTAINER';"
  docker cp "$CONTAINER:$TMP_NO_CONTAINER" "$PARCIAL"
  docker exec "$CONTAINER" rm -f "$TMP_NO_CONTAINER"
else
  "${DOCKER_SQLITE[@]}" -v "$VOLUME_DB:/db" -v "$(cd "$BACKUP_DIR" && pwd):/saida" \
    "$SQLITE_IMAGE" sqlite3 "/db/$(basename "$DB_FILENAME")" \
    "VACUUM INTO '/saida/$(basename "$PARCIAL")';"
fi

# --- 6. Validação antes de aceitar o arquivo -----------------------------------
TAMANHO=$(stat -c%s "$PARCIAL" 2>/dev/null || stat -f%z "$PARCIAL")

if [[ "$TAMANHO" -lt "$TAMANHO_MINIMO_BYTES" ]]; then
  erro "cópia com apenas ${TAMANHO} bytes — abaixo do mínimo esperado. Descartada."
  rm -f "$PARCIAL"
  exit 1
fi

# Valida a CÓPIA, não o original: é ela que precisa servir numa emergência.
if command -v sqlite3 >/dev/null 2>&1; then
  CHECK_COPIA="$(sqlite3 "$PARCIAL" 'PRAGMA integrity_check;' 2>/dev/null || echo "falhou")"
else
  CHECK_COPIA="$("${DOCKER_SQLITE[@]}" -v "$(cd "$BACKUP_DIR" && pwd):/b" "$SQLITE_IMAGE" \
    sqlite3 "/b/$(basename "$PARCIAL")" 'PRAGMA integrity_check;' 2>/dev/null || echo "falhou")"
fi

if [[ "$CHECK_COPIA" != "ok" ]]; then
  erro "a CÓPIA não passou no integrity_check ($CHECK_COPIA). Descartada."
  rm -f "$PARCIAL"
  exit 1
fi

# Confere que as coleções de negócio estão presentes — um banco íntegro porém
# vazio passaria em todos os testes acima.
if command -v sqlite3 >/dev/null 2>&1; then
  TEM_BENEF="$(sqlite3 "$PARCIAL" \
    "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='beneficiarias';" 2>/dev/null || echo 0)"
  TABELAS="$(sqlite3 "$PARCIAL" \
    "SELECT count(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo 0)"
else
  TEM_BENEF="$("${DOCKER_SQLITE[@]}" -v "$(cd "$BACKUP_DIR" && pwd):/b" "$SQLITE_IMAGE" \
    sqlite3 "/b/$(basename "$PARCIAL")" \
    "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='beneficiarias';" 2>/dev/null || echo 0)"
  TABELAS="$("${DOCKER_SQLITE[@]}" -v "$(cd "$BACKUP_DIR" && pwd):/b" "$SQLITE_IMAGE" \
    sqlite3 "/b/$(basename "$PARCIAL")" \
    "SELECT count(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo 0)"
fi

if [[ "$TEM_BENEF" -eq 0 ]]; then
  erro "a cópia não contém a tabela 'beneficiarias' — não parece o banco do SIGMA."
  rm -f "$PARCIAL"
  exit 1
fi

mv "$PARCIAL" "$ARQ_DB"
chmod 600 "$ARQ_DB"
log "banco salvo: $ARQ_DB ($(numfmt --to=iec "$TAMANHO" 2>/dev/null || echo "${TAMANHO}B"), ${TABELAS} tabelas)"

# --- 7. Arquivos enviados -------------------------------------------------------
#
# Sem isto o backup fica pela metade: as referências existem no banco e os
# arquivos não. `tar` vem no busybox da imagem, então não exige nada extra.
if [[ -n "$VOLUME_UPLOADS" ]]; then
  log "compactando os arquivos enviados…"
  if docker exec "$CONTAINER" tar czf - -C /directus uploads > "$ARQ_UPLOADS.parcial" 2>/dev/null; then
    mv "$ARQ_UPLOADS.parcial" "$ARQ_UPLOADS"
    chmod 600 "$ARQ_UPLOADS"
    TAM_UP=$(stat -c%s "$ARQ_UPLOADS" 2>/dev/null || stat -f%z "$ARQ_UPLOADS")
    log "uploads salvos: $ARQ_UPLOADS ($(numfmt --to=iec "$TAM_UP" 2>/dev/null || echo "${TAM_UP}B"))"
  else
    rm -f "$ARQ_UPLOADS.parcial"
    erro "falha ao compactar os uploads — o backup do banco foi mantido,"
    erro "mas está INCOMPLETO: os anexos não foram salvos."
  fi
else
  erro "volume de uploads não identificado — backup do banco concluído SEM os anexos."
fi

# --- 8. Cópia externa (opcional) -------------------------------------------------
#
# O backup local mora no MESMO disco do banco: cobre exclusão acidental e
# corrupção, não cobre perda do servidor, ransomware ou incêndio. A cópia
# externa é o que separa "backup" de "cópia no mesmo lugar".
#
# Ativa-se definindo RCLONE_REMOTO (ex.: "sigma-drive:SIGMA-Backups"). Sem a
# variável, este bloco inteiro é ignorado e nada muda.
#
# Falha aqui NUNCA invalida o backup local, que a essa altura já foi gerado e
# validado — por isso todo o bloco tolera erro e apenas reporta.
if [[ -n "${RCLONE_REMOTO:-}" ]]; then
  if ! command -v rclone >/dev/null 2>&1; then
    erro "RCLONE_REMOTO definido, mas o rclone não está instalado."
    erro "O backup LOCAL está íntegro; apenas a cópia externa não foi enviada."
  else
    log "enviando cópia para ${RCLONE_REMOTO}…"

    # `copy` (e não `sync`): sync espelharia a pasta local e poderia APAGAR no
    # destino algo que sumiu daqui — inclusive por engano. O destino só recebe.
    ENVIO_OK=1
    for arquivo in "$ARQ_DB" "$ARQ_UPLOADS"; do
      [[ -f "$arquivo" ]] || continue
      if ! rclone copy "$arquivo" "$RCLONE_REMOTO" \
        --contimeout 30s --timeout 5m --retries 3 --low-level-retries 5 \
        2>/tmp/sigma-rclone-erro.txt; then
        ENVIO_OK=0
        erro "falha ao enviar $(basename "$arquivo"):"
        tail -3 /tmp/sigma-rclone-erro.txt >&2 || true
      fi
    done

    if [[ "$ENVIO_OK" -eq 1 ]]; then
      log "cópia externa concluída"

      # Rotação no destino, espelhando a retenção local. Sem isto o Drive
      # cresce para sempre.
      if REMOVIDOS_REMOTO=$(rclone delete "$RCLONE_REMOTO" \
        --min-age "${RETENCAO_DIAS}d" --include 'sigma_*' \
        --rmdirs=false -v 2>&1 | grep -c 'Deleted' || true); then
        log "rotação remota: ${REMOVIDOS_REMOTO:-0} arquivo(s) antigo(s) removido(s)"
      fi
    else
      erro "a cópia externa falhou — o backup LOCAL continua íntegro em $BACKUP_DIR."
    fi
  fi
fi

# --- 9. Rotação local -------------------------------------------------------------
REMOVIDOS=$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'sigma_db_*.db' -o -name 'sigma_uploads_*.tgz' \) \
  -type f -mtime +"$RETENCAO_DIAS" -print -delete | wc -l)
log "rotação: ${REMOVIDOS} arquivo(s) com mais de ${RETENCAO_DIAS} dias removido(s)"

TOTAL=$(find "$BACKUP_DIR" -maxdepth 1 -name 'sigma_db_*.db' -type f | wc -l)
log "backups de banco mantidos: ${TOTAL}"

find "$BACKUP_DIR" -maxdepth 1 -name '*.parcial' -mmin +120 -delete 2>/dev/null || true

log "concluído."
