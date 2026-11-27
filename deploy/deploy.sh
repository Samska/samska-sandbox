#!/usr/bin/env bash
# Updates a VPS to the latest commit of the current branch and restarts the demo stack.
# Usage: deploy/deploy.sh   (run from anywhere on the server, as a user that can run Docker)
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env_file

git -C "$ROOT" pull --ff-only
"${COMPOSE[@]}" up --build -d

echo "Waiting for the backend to become healthy..."
for _ in $(seq 1 60); do
  status="$("${COMPOSE[@]}" ps --format '{{.Service}} {{.Health}}' backend | awk '{print $2}')"
  if [[ "$status" == "healthy" ]]; then
    echo "Deployed. The backend is healthy."
    exit 0
  fi
  sleep 5
done

echo "The backend did not become healthy in time. Check: ${COMPOSE[*]} logs backend" >&2
exit 1
