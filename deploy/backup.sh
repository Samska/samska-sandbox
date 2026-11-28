#!/usr/bin/env bash
# Writes a compressed PostgreSQL dump to a backups/ directory (ignored by Git) and keeps the newest 14.
# Usage: deploy/backup.sh [output-directory]
# Schedule it with cron, for example daily at 03:30:  30 3 * * * /path/to/repo/deploy/backup.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env_file

OUT="${1:-$ROOT/backups}"
mkdir -p "$OUT"
FILE="$OUT/samska-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

"${COMPOSE[@]}" exec -T postgres pg_dump -U samska_demo -d samska --no-owner | gzip > "$FILE"
echo "Wrote $FILE"

# Keep the newest 14 dumps.
ls -1t "$OUT"/samska-*.sql.gz | tail -n +15 | while read -r old; do rm -f -- "$old"; done
