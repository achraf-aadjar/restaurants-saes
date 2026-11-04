#!/usr/bin/env bash
# Sauvegarde de la base de production (docker-compose.prod.yml) dans
# sauvegardes/saes-AAAA-MM-JJ-HHMM.sql.gz, en gardant les 14 plus recentes.
# A planifier chaque nuit, par exemple avec cron :
#   0 2 * * * cd /chemin/restaurants-saes && scripts/sauvegarder-base.sh
# Restauration : gunzip -c FICHIER | docker compose -f docker-compose.prod.yml exec -T db psql -U "$SAES_DB_USER" -d saes
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

mkdir -p sauvegardes
fichier="sauvegardes/saes-$(date +%Y-%m-%d-%H%M).sql.gz"
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$SAES_DB_USER" -d saes --clean --if-exists | gzip > "$fichier"
echo "Sauvegarde : $fichier"

ls -1t sauvegardes/saes-*.sql.gz | tail -n +15 | xargs -r rm --
