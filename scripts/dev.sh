#!/usr/bin/env bash

# This launcher owns only the process groups it starts below.
set -uo pipefail

readonly MIN_BASH_MAJOR=4
readonly MIN_BASH_MINOR=3
readonly BACKEND_PORT=8080
readonly FRONTEND_PORT=5173
readonly HEALTH_URL="http://localhost:${BACKEND_PORT}/actuator/health"
readonly HEALTH_TIMEOUT_SECONDS=90
readonly SHUTDOWN_GRACE_TENTHS=50

backend_pid=""
frontend_pid=""
cleanup_started=0

usage() {
  printf 'Usage: %s\n' "${0##*/}" >&2
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 2
}

if ((BASH_VERSINFO[0] < MIN_BASH_MAJOR || (BASH_VERSINFO[0] == MIN_BASH_MAJOR && BASH_VERSINFO[1] < MIN_BASH_MINOR))); then
  fail "Bash ${MIN_BASH_MAJOR}.${MIN_BASH_MINOR}+ is required for child-process supervision."
fi

if (($# != 0)); then
  usage
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repository_root="$(cd -- "$script_dir/.." && pwd -P)"
backend_dir="$repository_root/backend"
web_dir="$repository_root/web"

[[ -x "$backend_dir/mvnw" ]] || fail "backend/mvnw is missing or is not executable."
[[ -f "$web_dir/package.json" ]] || fail "web/package.json is missing."
[[ -f "$web_dir/.nvmrc" ]] || fail "web/.nvmrc is missing."
[[ -x "$web_dir/node_modules/.bin/vite" ]] || fail "Frontend dependencies are not installed. Run: cd web && npm ci --ignore-scripts"

package_json="$(<"$web_dir/package.json")"
node_engine_pattern='"node"[[:space:]]*:[[:space:]]*">=([0-9]+)\.([0-9]+)\.([0-9]+)[[:space:]]+<([0-9]+)"'
package_manager_pattern='"packageManager"[[:space:]]*:[[:space:]]*"npm@([^"]+)"'
if [[ $package_json =~ $node_engine_pattern ]]; then
  readonly node_min_major="${BASH_REMATCH[1]}"
  readonly node_min_minor="${BASH_REMATCH[2]}"
  readonly node_min_patch="${BASH_REMATCH[3]}"
  readonly node_max_major="${BASH_REMATCH[4]}"
else
  fail "Unable to read the supported Node.js range from web/package.json."
fi

if [[ $package_json =~ $package_manager_pattern ]]; then
  readonly expected_npm_version="${BASH_REMATCH[1]}"
else
  fail "Unable to read the intended npm version from web/package.json."
fi

java_command=()
javac_command=()

java_major() {
  local output
  # JDK 8 and earlier reject --version and still use the legacy 1.x numbering.
  output="$("$@" --version 2>&1)" || output="$("$@" -version 2>&1)" || return 1

  if [[ $output =~ (version\ \"|javac )1\.([0-9]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[2]}"
    return 0
  fi

  if [[ $output =~ ([0-9]+)(\.[0-9]+){0,2} ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi

  return 1
}

if [[ -n ${JAVA_HOME:-} ]]; then
  [[ -x "$JAVA_HOME/bin/java" && -x "$JAVA_HOME/bin/javac" ]] || fail "JAVA_HOME is set but does not contain executable java and javac commands: $JAVA_HOME"
  java_command=("$JAVA_HOME/bin/java")
  javac_command=("$JAVA_HOME/bin/javac")

  java_home_major="$(java_major "${java_command[@]}")" || fail "Unable to determine the Java version selected by JAVA_HOME: $JAVA_HOME"
  [[ $java_home_major == 25 ]] || fail "JAVA_HOME selects Java $java_home_major, but Java 25 is required. Point JAVA_HOME at a compatible Java 25 JDK."

  # JAVA_HOME is authoritative. An unrelated java earlier on PATH (for example a
  # legacy Oracle java8path shim) must not fail the launcher, so report the order
  # and put the selected JDK first for every child process.
  if command -v java >/dev/null 2>&1; then
    path_java_major="$(java_major java)" || path_java_major=""
    if [[ -n $path_java_major && $path_java_major != "$java_home_major" ]]; then
      printf 'Note: PATH resolves Java %s first; the launcher and its child processes use JAVA_HOME Java %s.\n' "$path_java_major" "$java_home_major" >&2
    fi
  fi

  java_home_bin="$JAVA_HOME/bin"
  if command -v cygpath >/dev/null 2>&1; then
    java_home_bin="$(cygpath -u "$JAVA_HOME")"
  fi
  java_home_bin="${java_home_bin%/}"
  java_home_bin="${java_home_bin%\\}"
  export PATH="$java_home_bin/bin:$PATH"
else
  command -v java >/dev/null 2>&1 || fail "Java 25 JDK is required. Install or select a compatible JDK."
  command -v javac >/dev/null 2>&1 || fail "A Java 25 JDK is required; javac is not available on PATH."
  java_command=(java)
  javac_command=(javac)
fi

[[ $(java_major "${java_command[@]}") == 25 ]] || fail "Java 25 is required. Select a compatible JDK."
[[ $(java_major "${javac_command[@]}") == 25 ]] || fail "A Java 25 JDK is required. Select a compatible javac."

node_is_compatible() {
  local node_version major minor patch

  command -v node >/dev/null 2>&1 || return 1
  node_version="$(node -p 'process.versions.node' 2>/dev/null)" || return 1
  IFS=. read -r major minor patch <<<"$node_version"
  [[ $major =~ ^[0-9]+$ && $minor =~ ^[0-9]+$ && $patch =~ ^[0-9]+$ ]] || return 1

  ((major >= node_min_major && major < node_max_major)) || return 1
  ((major > node_min_major || minor > node_min_minor || (minor == node_min_minor && patch >= node_min_patch)))
}

npm_is_compatible() {
  command -v npm >/dev/null 2>&1 && [[ $(npm --version 2>/dev/null) == "$expected_npm_version" ]]
}

load_nvm_if_available() {
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"

  [[ -s "$nvm_dir/nvm.sh" ]] || return 1

  # NVM is normally initialized only by interactive-shell startup files.
  set +u
  # shellcheck source=/dev/null
  . "$nvm_dir/nvm.sh"
  set -u
  nvm use --silent "$(<"$web_dir/.nvmrc")" >/dev/null
}

if ! node_is_compatible || ! npm_is_compatible; then
  if ! load_nvm_if_available || ! node_is_compatible || ! npm_is_compatible; then
    fail "Node.js ${node_min_major}.${node_min_minor}.${node_min_patch}+ below ${node_max_major} and npm ${expected_npm_version} are required. Select the version in web/.nvmrc with NVM, or make compatible node and npm available on PATH."
  fi
fi

# Bash's /dev/tcp probes both loopback families, so an IPv6-only listener such as
# Vite's default is detected as well. This check never signals the owning process.
port_in_use() {
  local port="$1" host

  for host in 127.0.0.1 ::1; do
    (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null && return 0
  done

  return 1
}

require_free_port() {
  local name="$1" port="$2"

  port_in_use "$port" || return 0
  fail "The required ${name} port ${port} is already in use, so the launcher will not start. Another Samska development instance or another service owns it; stop that process or free the port, then retry. The launcher never stops other processes. Inspect the owner with 'netstat -ano | grep :${port}' on Windows or 'lsof -i :${port}' on macOS/Linux."
}

require_free_port backend "$BACKEND_PORT"
require_free_port frontend "$FRONTEND_PORT"

group_is_owned() {
  kill -0 -- "-$1" 2>/dev/null
}

verify_group_or_fail() {
  local pid="$1" name="$2"

  group_is_owned "$pid" && return 0
  if ! kill -0 "$pid" 2>/dev/null; then
    printf 'Error: The %s process exited during startup.\n' "$name" >&2
    exit 1
  fi
  fail "Unable to establish an owned ${name} process group; refusing unsafe cleanup."
}

group_is_running() {
  kill -0 -- "-$1" 2>/dev/null
}

stop_group() {
  local pid="$1" signal="$2"
  [[ -n $pid ]] && group_is_running "$pid" && kill -"$signal" -- "-$pid" 2>/dev/null || true
}

cleanup() {
  local exit_status=$?
  local attempt

  if ((cleanup_started)); then
    return "$exit_status"
  fi
  cleanup_started=1
  trap - EXIT INT TERM

  if [[ -n $backend_pid || -n $frontend_pid ]]; then
    printf '\nStopping Samska local development...\n'
  fi

  stop_group "$backend_pid" TERM
  stop_group "$frontend_pid" TERM

  for ((attempt = 0; attempt < SHUTDOWN_GRACE_TENTHS; attempt++)); do
    if ! group_is_running "$backend_pid" && ! group_is_running "$frontend_pid"; then
      break
    fi
    sleep 0.1
  done

  stop_group "$backend_pid" KILL
  stop_group "$frontend_pid" KILL

  [[ -z $backend_pid ]] || wait "$backend_pid" 2>/dev/null || true
  [[ -z $frontend_pid ]] || wait "$frontend_pid" 2>/dev/null || true
  return "$exit_status"
}

trap 'exit 130' INT
trap 'exit 143' TERM
trap cleanup EXIT

# Job control gives each background job an owned process group for group-wide cleanup.
set -m

printf '%s\n\n' 'Starting Samska local development...'
printf '%s\n' 'Backend command:' '  ./mvnw spring-boot:run' '' 'Frontend command:' '  npm run dev' '' 'Backend:' '  http://localhost:8080' '' 'Backend health:' "  $HEALTH_URL" '' 'Frontend:' '  see Vite startup output for the actual URL' '' 'PostgreSQL:' '  not started; optional infrastructure' '' 'Press Ctrl+C to stop.' ''

(
  cd -- "$backend_dir"
  exec ./mvnw spring-boot:run
) &
backend_pid=$!
verify_group_or_fail "$backend_pid" backend

(
  cd -- "$web_dir"
  exec npm run dev
) &
frontend_pid=$!
verify_group_or_fail "$frontend_pid" frontend

if command -v curl >/dev/null 2>&1; then
  health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  while ((SECONDS < health_deadline)); do
    if ! group_is_running "$backend_pid" || ! group_is_running "$frontend_pid"; then
      printf 'Error: A development process exited before backend health became available.\n' >&2
      exit 1
    fi

    if health_response="$(curl --fail --silent --show-error --connect-timeout 2 "$HEALTH_URL" 2>/dev/null)" && [[ $health_response == *'"status":"UP"'* ]]; then
      if group_is_running "$backend_pid"; then
        printf 'Backend health check passed.\n'
        break
      fi

      fail "The backend health endpoint responded, but this launcher's backend is no longer running. Another process may own port ${BACKEND_PORT}; refusing to report health for a backend this launcher did not start."
    fi

    sleep 1
  done

  ((SECONDS < health_deadline)) || fail "Backend health did not become available within ${HEALTH_TIMEOUT_SECONDS} seconds."
else
  printf 'curl is unavailable; automatic backend health verification was skipped. Check %s manually.\n' "$HEALTH_URL"
fi

wait -n "$backend_pid" "$frontend_pid"
child_status=$?
if ((child_status == 0)); then
  printf 'Error: A development process exited unexpectedly.\n' >&2
  exit 1
fi

exit "$child_status"
