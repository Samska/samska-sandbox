#!/usr/bin/env bash
# Shared settings for the deploy scripts. Source it; do not run it.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.demo}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT/compose.demo.yaml")
if [[ -n "${COMPOSE_OVERRIDE:-}" ]]; then
  COMPOSE+=(-f "$COMPOSE_OVERRIDE")
fi

require_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE. Copy .env.demo.example to .env.demo and fill it in." >&2
    exit 1
  fi
}
