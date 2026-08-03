#!/usr/bin/env bash
set -euo pipefail

[[ $# -eq 2 && "$1" == "--iwad" ]] || { echo "usage: $0 --iwad phase1|phase2" >&2; exit 2; }
EDITION="$2"
case "$EDITION" in phase1|phase2) ;; *) echo "unknown IWAD edition: $EDITION" >&2; exit 2 ;; esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$ROOT"
bash tools/fetch-freedoom.sh --verify-only >/dev/null
bash tools/capture-native-frame.sh "$EDITION"
echo "NATIVE_SMOKE=PASS edition=$EDITION"
