#!/usr/bin/env bash
# Checks the web image's start-up configuration without building the application: renders the real nginx
# template and entrypoint script inside the stock nginx image and exercises the access modes with curl.
# Usage: deploy/verify-web-config.sh   (needs Docker; pulls nginx-unprivileged and caddy images)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="nginxinc/nginx-unprivileged:1.29-alpine"
TMP="$(mktemp -d)"
NET="samska-verify-$$"
PORT_ON_HOST=18080
failures=0

cleanup() {
  docker rm -f samska-verify-web samska-verify-backend >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

check() { # description expected actual
  if [[ "$2" == "$3" ]]; then echo "ok   $1"; else echo "FAIL $1 (expected $2, got $3)"; failures=$((failures + 1)); fi
}

mkdir -p "$TMP/html"
echo '<h1>spa</h1>' > "$TMP/html/index.html"
docker network create "$NET" >/dev/null
# A stand-in backend named like the Compose service: any answer from it proves the proxy path works.
docker run -d --name samska-verify-backend --network "$NET" --network-alias backend "$IMAGE" >/dev/null
HASH="$(docker run --rm caddy:2-alpine caddy hash-password --plaintext 'verify-pass')"

start_web() { # extra docker args...
  docker rm -f samska-verify-web >/dev/null 2>&1 || true
  docker run -d --name samska-verify-web --network "$NET" -p "$PORT_ON_HOST:${PORT:-8080}" \
    -e NGINX_ENVSUBST_FILTER='^(PORT|API_UPSTREAM|API_RESOLVER|LISTEN_IPV6)$' "$@" \
    -v "$ROOT/web/nginx.conf.template:/etc/nginx/templates/default.conf.template:ro" \
    -v "$ROOT/web/docker-entrypoint.d/15-samska-env.envsh:/docker-entrypoint.d/15-samska-env.envsh:ro" \
    -v "$TMP/html:/usr/share/nginx/html:ro" "$IMAGE" >/dev/null
  for _ in $(seq 1 20); do
    curl -s -o /dev/null "localhost:$PORT_ON_HOST/healthz" && return 0
    sleep 0.5
  done
  return 1
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# Private is the default and refuses to start without a credential.
if start_web 2>/dev/null; then check "private mode without credential refuses to start" refused started; else check "private mode without credential refuses to start" refused refused; fi

start_web -e DEMO_ACCESS_USER=visitor -e DEMO_ACCESS_HASH="$HASH"
check "private: site without password" 401 "$(code "localhost:$PORT_ON_HOST/")"
check "private: API without password" 401 "$(code "localhost:$PORT_ON_HOST/api/x")"
check "private: wrong password" 401 "$(code -u visitor:wrong "localhost:$PORT_ON_HOST/")"
check "private: site with password" 200 "$(code -u visitor:verify-pass "localhost:$PORT_ON_HOST/")"
check "private: API proxied with password" 404 "$(code -u visitor:verify-pass "localhost:$PORT_ON_HOST/api/x")"
check "private: health check stays open" 200 "$(code "localhost:$PORT_ON_HOST/healthz")"

PORT=9090 start_web -e WEB_ACCESS=none -e PORT=9090
check "open mode on a custom PORT: site" 200 "$(code "localhost:$PORT_ON_HOST/")"
check "open mode: API proxied" 404 "$(code "localhost:$PORT_ON_HOST/api/x")"

if [[ "$failures" -ne 0 ]]; then echo "$failures check(s) failed" >&2; exit 1; fi
echo "All web configuration checks passed."
