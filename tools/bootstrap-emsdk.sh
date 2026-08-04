#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="$ROOT/tools/emsdk-lock.json"
EMSDK_DIR="$ROOT/toolchains/emsdk"
BROWSER_CACHE="$ROOT/vendor-cache/playwright"
LOG_DIR="$ROOT/evidence/task-runs/P02-DOOM-P2-010"
mkdir -p "$LOG_DIR" "$BROWSER_CACHE"

eval "$(python3 - "$LOCK" <<'PY'
import json, shlex, sys
lock = json.load(open(sys.argv[1], encoding='utf-8'))
for key, value in (
    ('EMSDK_REPOSITORY', lock['repository']),
    ('EMSDK_COMMIT', lock['repository_commit']),
    ('SDK_VERSION', lock['sdk_version']),
    ('EMSCRIPTEN_COMMIT', lock['emscripten_release_commit']),
):
    print(f'{key}={shlex.quote(value)}')
PY
)"

if [[ "$EMSDK_REPOSITORY" != "https://github.com/emscripten-core/emsdk.git" || "$EMSDK_COMMIT" != "9fcdf593953edfcddb297572d7f2177d336b0479" || "$SDK_VERSION" != "6.0.5" ]]; then
  echo 'emsdk lock is not the accepted P2 pin' >&2
  exit 1
fi

if [[ ! -d "$EMSDK_DIR/.git" ]]; then
  git clone "$EMSDK_REPOSITORY" "$EMSDK_DIR"
  git -C "$EMSDK_DIR" checkout --detach "$EMSDK_COMMIT"
else
  [[ "$(git -C "$EMSDK_DIR" remote get-url origin)" == "$EMSDK_REPOSITORY" ]] || { echo 'unexpected emsdk origin' >&2; exit 1; }
  [[ -z "$(git -C "$EMSDK_DIR" status --porcelain)" ]] || { echo 'emsdk checkout is dirty' >&2; exit 1; }
  [[ "$(git -C "$EMSDK_DIR" rev-parse HEAD)" == "$EMSDK_COMMIT" ]] || { echo 'emsdk checkout is not pinned' >&2; exit 1; }
fi

pushd "$EMSDK_DIR" >/dev/null
./emsdk install "$SDK_VERSION"
./emsdk activate "$SDK_VERSION"
source ./emsdk_env.sh
popd >/dev/null

[[ "${EMSDK:-}" == "$EMSDK_DIR"* ]] || { echo 'emsdk environment did not resolve locally' >&2; exit 1; }
emcc --version | tee "$LOG_DIR/emcc-version.txt"
emcc -v 2>"$LOG_DIR/emcc-verbose.txt" || true
printf '%s\n' 'SDL_PORTS_REQUESTED=sdl2 sdl2_mixer' | tee "$LOG_DIR/ports.txt"
embuilder build sdl2 sdl2_mixer 2>&1 | tee "$LOG_DIR/embuilder.txt"

export PLAYWRIGHT_BROWSERS_PATH="$BROWSER_CACHE"
if [[ -f "$ROOT/browser-tests/package-lock.json" ]]; then
  (cd "$ROOT/browser-tests" && npm ci 2>&1 | tee "$LOG_DIR/npm-ci.txt")
else
  (cd "$ROOT/browser-tests" && npm install --package-lock-only 2>&1 | tee "$LOG_DIR/npm-lock.txt")
  (cd "$ROOT/browser-tests" && npm ci 2>&1 | tee "$LOG_DIR/npm-ci.txt")
fi
npx --prefix "$ROOT/browser-tests" playwright install chromium firefox 2>&1 | tee "$LOG_DIR/playwright-install.txt"
printf '%s\n' 'PLAYWRIGHT_LINUX_DEPS=installed_by_authorized_wsl_root_bootstrap' | tee "$LOG_DIR/playwright-deps.txt"
npx --prefix "$ROOT/browser-tests" playwright --version | tee "$LOG_DIR/playwright-version.txt"
npx --prefix "$ROOT/browser-tests" playwright install --list | tee "$LOG_DIR/playwright-list.txt"

echo "EMSDK_REPOSITORY=$EMSDK_REPOSITORY"
echo "EMSDK_COMMIT=$(git -C "$EMSDK_DIR" rev-parse HEAD)"
echo "SDK_VERSION=$SDK_VERSION"
echo "EMSCRIPTEN_COMMIT=$EMSCRIPTEN_COMMIT"
echo "PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH"
echo 'GLOBAL_ACTIVATION=NONE'
