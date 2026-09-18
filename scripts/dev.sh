#!/usr/bin/env bash

# This launcher owns only the process groups it starts below.
set -uo pipefail

readonly MIN_BASH_MAJOR=4
readonly MIN_BASH_MINOR=3
readonly HEALTH_URL="http://localhost:8080/actuator/health"
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
  output="$("$@" --version 2>&1)" || return 1

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

  if command -v java >/dev/null 2>&1; then
    path_java_major="$(java_major java)" || fail "Unable to determine the Java version from PATH."
    java_home_major="$(java_major "${java_command[@]}")" || fail "Unable to determine the Java version selected by JAVA_HOME."
    [[ $path_java_major == "$java_home_major" ]] || fail "JAVA_HOME selects Java $java_home_major while PATH selects Java $path_java_major. Set JAVA_HOME to the active Java 25 JDK or unset JAVA_HOME."
  fi
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

command -v ps >/dev/null 2>&1 || fail "ps is required to verify launcher process ownership."

group_is_owned() {
  local pid="$1" pgid
  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d '[:space:]')"
  [[ $pgid == "$pid" ]]
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
    if health_response="$(curl --fail --silent --show-error --connect-timeout 2 "$HEALTH_URL" 2>/dev/null)" && [[ $health_response == *'"status":"UP"'* ]]; then
      printf 'Backend health check passed.\n'
      break
    fi

    if ! group_is_running "$backend_pid" || ! group_is_running "$frontend_pid"; then
      printf 'Error: A development process exited before backend health became available.\n' >&2
      exit 1
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
