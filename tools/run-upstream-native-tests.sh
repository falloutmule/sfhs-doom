#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"

classify_ctest() {
    local output_file="$1" exit_code="$2"
    if [[ "$exit_code" -ne 0 ]]; then
        echo FAIL
    elif grep -Eq 'No tests were found|Total Tests: 0' "$output_file"; then
        echo NOT_PRESENT
    else
        echo PASS
    fi
}

if [[ "${1:-}" == "--classify-ctest-output" ]]; then
    [[ $# -eq 3 ]] || { echo "usage: $0 --classify-ctest-output FILE EXIT_CODE" >&2; exit 2; }
    classify_ctest "$2" "$3"
    exit 0
fi
[[ $# -eq 0 ]] || { echo "unknown argument: $1" >&2; exit 2; }

cd "$ROOT"
[[ "$(git rev-parse --show-toplevel)" == "$ROOT" ]] || { echo "wrong repository" >&2; exit 1; }

LOG_ROOT="evidence/logs/P01/P1-030"
RUN_ROOT="evidence/task-runs/P01-DOOM-P1-030"
mkdir -p "$LOG_ROOT" "$RUN_ROOT"
SUMMARY="$LOG_ROOT/upstream-native-test-results.tsv"
printf 'check\tclassification\texit_code\tevidence\n' >"$SUMMARY"

run_ctest() {
    local config="$1"
    local output="$RUN_ROOT/ctest-${config}.stdout.txt"
    local error="$RUN_ROOT/ctest-${config}.stderr.txt"
    set +e
    ctest --test-dir "build/native/$config" --output-on-failure >"$output" 2>"$error"
    local rc=$?
    set -e
    local combined="$RUN_ROOT/ctest-${config}.combined.txt"
    { cat "$output"; cat "$error"; } >"$combined"
    local classification
    classification="$(classify_ctest "$combined" "$rc")"
    printf 'cmake-ctest-%s\t%s\t%s\t%s\n' "$config" "$classification" "$rc" "$combined" >>"$SUMMARY"
}

run_command() {
    local name="$1" classification_on_pass="$2"
    shift 2
    local output="$RUN_ROOT/${name}.stdout.txt"
    local error="$RUN_ROOT/${name}.stderr.txt"
    set +e
    "$@" >"$output" 2>"$error"
    local rc=$?
    set -e
    local classification=FAIL
    [[ "$rc" -eq 0 ]] && classification="$classification_on_pass"
    printf '%s\t%s\t%s\t%s;%s\n' "$name" "$classification" "$rc" "$output" "$error" >>"$SUMMARY"
}

run_ctest debug
run_ctest release
run_command check-extern PASS sh -c "sed 's/\r$//' check-extern.sh | sh"
run_command debug-build-smoke PASS build/native/debug/src/chocolate-doom --version
run_command release-build-smoke PASS build/native/release/src/chocolate-doom --version

if git ls-tree HEAD quickcheck | grep -q '^160000 '; then
    if [[ -f quickcheck/Makefile ]]; then
        run_command autotools-quickcheck PASS make -C quickcheck check "SOURCE_PORT=$ROOT/build/native/debug/src/chocolate-doom"
    else
        printf 'autotools-quickcheck\tBLOCKED\t-\tquickcheck gitlink %s is not initialized; remote action is forbidden\n' "$(git ls-tree HEAD quickcheck | awk '{print $3}')" >>"$SUMMARY"
    fi
else
    printf 'autotools-quickcheck\tNOT_PRESENT\t-\tno quickcheck gitlink\n' >>"$SUMMARY"
fi

printf 'cppcheck-workflow\tNOT_APPLICABLE\t-\tCI static analysis is not a native behavioral test and cppcheck is not selected by P1-010\n' >>"$SUMMARY"
printf 'cpp-linter-workflow\tNOT_APPLICABLE\t-\tCI lint is not a native behavioral test\n' >>"$SUMMARY"

if awk -F '\t' 'NR > 1 && $2 == "FAIL" {found=1} END {exit !found}' "$SUMMARY"; then
    cat "$SUMMARY"
    echo "UPSTREAM_NATIVE_TEST_BASELINE=FAIL" >&2
    exit 1
fi

cat "$SUMMARY"
echo "UPSTREAM_NATIVE_TEST_BASELINE=PASS"
