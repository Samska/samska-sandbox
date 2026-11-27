#!/usr/bin/env bash
# Replaces the database contents with a dump made by backup.sh. This destroys the current data.
# Usage: deploy/restore.sh path/to/samska-YYYYMMDDTHHMMSSZ.sql.gz
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env_file

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: $0 path/to/dump.sql.gz" >&2
  exit 1
fi

read -r -p "This replaces ALL current data with $1. Type 'restore' to continue: " answer
if [[ "$answer" != "restore" ]]; then
  echo "Cancelled."
  exit 1
fi

"${COMPOSE[@]}" stop backend
"${COMPOSE[@]}" exec -T postgres psql -U samska_demo -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS samska WITH (FORCE)" -c "CREATE DATABASE samska OWNER samska_demo"
gunzip -c "$1" | "${COMPOSE[@]}" exec -T postgres psql -U samska_demo -d samska -v ON_ERROR_STOP=1 --quiet
"${COMPOSE[@]}" start backend
echo "Restored from $1."
