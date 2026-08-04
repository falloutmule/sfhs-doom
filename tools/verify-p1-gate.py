#!/usr/bin/env python3
"""Generate and verify the SFHS Doom P01 native-oracle gate packet."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "evidence/manifests/P01/native-oracle-phase-manifest.json"
BASE_COMMIT = "804ddb9ae855b65aeec922cd5f531c672b9b2c5f"
UPSTREAM_SHA = "410d96855b5df5410ff591a90efeafa889119224"
UPSTREAM_TAG = "chocolate-doom-3.1.1"
BUILDER_COMMITS = {
    "DOOM-P1-000": "840fac0287f89810d346b72ac5977221fab97b57",
    "DOOM-P1-010": "a70068ffc8aac5a93ffe281461f2967bc7ff71d2",
    "DOOM-P1-020": "2376b4341d67e872222f7edc56dbcef6756bff37",
    "DOOM-P1-030": "44cc36377e0db83709428cc8ec6f9c28d783fdb4",
    "DOOM-P1-040": "df474c7270ed193f3062e81f3febff2794e6d292",
    "DOOM-P1-050": "591a89eed883abc61ce32fac47b22503fea8091f",
    "DOOM-P1-060": "b06baf72a78539e5ebd130aba9cee0f159ca2f84",
    "DOOM-P1-070": "f888f68ea721e7b01fb54946a1bc723b3248b608",
    "DOOM-P1-080": "ac9d51be7ec28162920212898ffec34b7315c913",
}
EXPECTED_SUBJECTS = {
    "DOOM-P1-000": "DOOM-P1-000 install continuous native-oracle phase",
    "DOOM-P1-010": "DOOM-P1-010 pin native oracle host and toolchain",
    "DOOM-P1-020": "DOOM-P1-020 add reproducible native debug and release builds",
    "DOOM-P1-030": "DOOM-P1-030 record truthful upstream native test baseline",
    "DOOM-P1-040": "DOOM-P1-040 add pinned Freedoom acquisition and verification",
    "DOOM-P1-050": "DOOM-P1-050 prove native Freedoom gameplay boots",
    "DOOM-P1-060": "DOOM-P1-060 add deterministic open compatibility fixtures",
    "DOOM-P1-070": "DOOM-P1-070 establish native demo and timedemo baseline",
    "DOOM-P1-080": "DOOM-P1-080 add deterministic native oracle instrumentation",
    "DOOM-P1-085": "DOOM-P1-085 assemble native oracle phase gate",
}
P085_PREFIXES = (
    ".agent/task-state.json",
    "docs/BUILD_IDENTITY.md",
    "docs/COMPATIBILITY_MATRIX.md",
    "docs/CURRENT_STATE.md",
    "docs/ISSUE_LOG.md",
    "docs/phases/P01/PHASE_RESULT.md",
    "docs/reports/NATIVE_ORACLE_BASELINE.md",
    "docs/results/P01/DOOM-P1-085.md",
    "evidence/phase-gates/P01/",
    "evidence/reports/P01/",
    "evidence/manifests/P01/",
    "evidence/logs/P01/P1-085/",
    "evidence/task-runs/P01-DOOM-P1-085/",
    "tests/test_p1_gate.py",
    "tools/verify-p1-gate.py",
)


class GateError(Exception):
    pass


def run(*argv: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(argv, cwd=ROOT, text=True, capture_output=True, check=False)
    if check and result.returncode != 0:
        raise GateError(f"command failed ({' '.join(argv)}): {result.stdout}{result.stderr}")
    return result


def git(*args: str) -> str:
    return run("git", *args).stdout.strip()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact(path: Path, kind: str) -> dict:
    resolved = path.resolve()
    try:
        relative = resolved.relative_to(ROOT).as_posix()
    except ValueError as exc:
        raise GateError(f"artifact outside repository: {path}") from exc
    if not resolved.is_file():
        raise GateError(f"missing artifact: {relative}")
    return {
        "kind": kind,
        "path": relative,
        "size_bytes": resolved.stat().st_size,
        "sha256": sha256(resolved),
    }


def artifact_paths() -> list[tuple[Path, str]]:
    items: list[tuple[Path, str]] = [
        (ROOT / "build/native/debug/src/chocolate-doom", "native-debug-executable"),
        (ROOT / "build/native/release/src/chocolate-doom", "native-release-executable"),
        (ROOT / "build/native/oracle/src/chocolate-doom", "native-oracle-executable"),
        (ROOT / "build/native/oracle-off/src/chocolate-doom", "native-oracle-off-executable"),
        (ROOT / "vendor-cache/freedoom/0.13.0/freedoom-0.13.0.zip", "freedoom-release-archive"),
        (ROOT / "vendor-cache/freedoom/0.13.0/data/freedoom1.wad", "open-freedoom-phase1-iwad"),
        (ROOT / "vendor-cache/freedoom/0.13.0/data/freedoom2.wad", "open-freedoom-phase2-iwad"),
        (ROOT / "evidence/screenshots/P01/P1-050/phase1-gameplay.png", "native-gameplay-screenshot"),
        (ROOT / "evidence/screenshots/P01/P1-050/phase2-gameplay.png", "native-gameplay-screenshot"),
        (ROOT / "evidence/task-runs/P01-DOOM-P1-070/demo/matrix.json", "native-demo-matrix"),
        (ROOT / "evidence/task-runs/P01-DOOM-P1-070/timedemo/matrix.json", "native-timedemo-matrix"),
        (ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/comparison.json", "native-oracle-comparison"),
        (ROOT / "tests/fixtures/expected/manifest.json", "project-fixture-manifest"),
    ]
    for path in sorted((ROOT / "tests/fixtures").rglob("*")):
        if path.is_file() and path != ROOT / "tests/fixtures/expected/manifest.json":
            items.append((path, "project-created-fixture"))
    oracle = ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set"
    for pattern, kind in (
        ("**/build.json", "oracle-build-identity"),
        ("**/state.jsonl", "oracle-state-checkpoints"),
        ("**/frame-*.bin", "oracle-indexed-framebuffer"),
        ("**/result.json", "oracle-run-result"),
    ):
        for path in sorted(oracle.glob(pattern)):
            items.append((path, kind))
    build_manifests = sorted((ROOT / "evidence/task-runs/P01-DOOM-P1-080").glob("*/build-manifest.json"))
    if len(build_manifests) != 1:
        raise GateError(f"expected one final P1-080 build manifest, found {len(build_manifests)}")
    items.append((build_manifests[0], "native-oracle-build-manifest"))
    return items


def generate_manifest(path: Path) -> None:
    tasks = []
    for task_id, commit in BUILDER_COMMITS.items():
        result_path = ROOT / f"docs/results/P01/{task_id}.md"
        tasks.append(
            {
                "id": task_id,
                "commit": commit,
                "subject": EXPECTED_SUBJECTS[task_id],
                "result_path": result_path.relative_to(ROOT).as_posix(),
                "result_sha256": sha256(result_path),
            }
        )
    manifest = {
        "schema_version": 1,
        "phase": "P01",
        "gate": "native-oracle-builder-candidate",
        "base_commit": BASE_COMMIT,
        "builder_head": BUILDER_COMMITS["DOOM-P1-080"],
        "upstream_tag": UPSTREAM_TAG,
        "upstream_sha": UPSTREAM_SHA,
        "branch": "phase/p01-native-oracle",
        "tasks": tasks,
        "artifacts": [artifact(item, kind) for item, kind in artifact_paths()],
        "limitations": [
            "Native WSL evidence only; no WebAssembly, browser, mobile, release, or commercial-data claim.",
            "DOOM-P1-090 remains an independent read-only Sol review and is not completed by this packet.",
        ],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"P1_GATE_MANIFEST=GENERATED path={path.relative_to(ROOT)} artifacts={len(manifest['artifacts'])}")


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise GateError(f"cannot read JSON {path}: {exc}") from exc


def verify_git_and_tasks() -> tuple[str, bool]:
    if git("branch", "--show-current") != "phase/p01-native-oracle":
        raise GateError("wrong branch")
    if run("git", "merge-base", "--is-ancestor", UPSTREAM_SHA, "HEAD", check=False).returncode != 0:
        raise GateError("upstream release is not an ancestor of HEAD")
    remotes = git("remote", "-v").splitlines()
    if not remotes or any(not line.startswith("upstream\thttps://github.com/chocolate-doom/chocolate-doom.git ") for line in remotes):
        raise GateError(f"unexpected remote listing: {remotes}")
    if any(line.startswith("origin\t") for line in remotes):
        raise GateError("user origin is present")

    log_lines = git("log", "--reverse", "--format=%H%x09%s", f"{BASE_COMMIT}..HEAD").splitlines()
    parsed = [line.split("\t", 1) for line in log_lines if line]
    for task_id, commit in BUILDER_COMMITS.items():
        matches = [(sha, subject) for sha, subject in parsed if subject.startswith(task_id + " ")]
        if matches != [(commit, EXPECTED_SUBJECTS[task_id])]:
            raise GateError(f"wrong or duplicate commit for {task_id}: {matches}")
    p085 = [(sha, subject) for sha, subject in parsed if subject.startswith("DOOM-P1-085 ")]
    if len(p085) > 1 or (p085 and p085[0][1] != EXPECTED_SUBJECTS["DOOM-P1-085"]):
        raise GateError(f"wrong or duplicate P1-085 commit: {p085}")
    if any(subject.startswith("DOOM-P1-090 ") for _, subject in parsed):
        raise GateError("DOOM-P1-090 must not have a builder commit")

    state = load_json(ROOT / ".agent/task-state.json")
    by_id = {item["id"]: item for item in state["tasks"]}
    for task_id in BUILDER_COMMITS:
        if by_id[task_id]["status"] != "done":
            raise GateError(f"task not done: {task_id}")
    if by_id["DOOM-P1-090"]["status"] != "pending":
        raise GateError("DOOM-P1-090 is not pending")
    candidate = not p085
    expected_p085_status = "running" if candidate else "done"
    if by_id["DOOM-P1-085"]["status"] != expected_p085_status:
        raise GateError(f"wrong P1-085 task status for gate state: {by_id['DOOM-P1-085']['status']}")
    return (p085[0][0] if p085 else "SELF", candidate)


def verify_candidate_worktree(candidate: bool) -> None:
    lines = run("git", "status", "--porcelain=v1", "--untracked-files=all").stdout.splitlines()
    paths = []
    for line in lines:
        value = line[3:]
        if " -> " in value:
            value = value.split(" -> ", 1)[1]
        paths.append(value.replace("\\", "/"))
    if not candidate:
        if paths:
            raise GateError(f"post-commit gate requires clean worktree: {paths}")
        return
    unexpected = [
        path
        for path in paths
        if not any(path == prefix or (prefix.endswith("/") and path.startswith(prefix)) for prefix in P085_PREFIXES)
    ]
    if unexpected:
        raise GateError(f"unexpected P1-085 candidate paths: {unexpected}")


def verify_manifest(path: Path) -> None:
    manifest = load_json(path)
    required = {"schema_version", "phase", "gate", "base_commit", "builder_head", "upstream_tag", "upstream_sha", "branch", "tasks", "artifacts", "limitations"}
    if set(manifest) != required:
        raise GateError("wrong phase-manifest fields")
    if (
        manifest["schema_version"] != 1
        or manifest["phase"] != "P01"
        or manifest["base_commit"] != BASE_COMMIT
        or manifest["builder_head"] != BUILDER_COMMITS["DOOM-P1-080"]
        or manifest["upstream_tag"] != UPSTREAM_TAG
        or manifest["upstream_sha"] != UPSTREAM_SHA
        or manifest["branch"] != "phase/p01-native-oracle"
    ):
        raise GateError("phase-manifest identity mismatch")
    if [item["id"] for item in manifest["tasks"]] != list(BUILDER_COMMITS):
        raise GateError("phase-manifest task sequence mismatch")
    for item in manifest["tasks"]:
        if item["commit"] != BUILDER_COMMITS[item["id"]] or item["subject"] != EXPECTED_SUBJECTS[item["id"]]:
            raise GateError(f"phase-manifest task identity mismatch: {item['id']}")
        result = ROOT / item["result_path"]
        if not result.is_file() or sha256(result) != item["result_sha256"]:
            raise GateError(f"task result hash mismatch: {item['id']}")
        text = result.read_text(encoding="utf-8")
        if "Status:" not in text or "PASS" not in text or "Result commit" not in text or "SELF" not in text:
            raise GateError(f"task result is not a SELF PASS: {item['id']}")
    seen = set()
    kinds = set()
    for item in manifest["artifacts"]:
        if set(item) != {"kind", "path", "size_bytes", "sha256"} or item["path"] in seen:
            raise GateError("invalid or duplicate artifact entry")
        seen.add(item["path"])
        kinds.add(item["kind"])
        file_path = (ROOT / item["path"]).resolve()
        try:
            file_path.relative_to(ROOT)
        except ValueError as exc:
            raise GateError(f"artifact escapes repository: {item['path']}") from exc
        if not file_path.is_file() or file_path.stat().st_size != item["size_bytes"] or sha256(file_path) != item["sha256"]:
            raise GateError(f"artifact identity mismatch: {item['path']}")
    expected_kinds = {
        "native-debug-executable",
        "native-release-executable",
        "native-oracle-executable",
        "native-oracle-off-executable",
        "open-freedoom-phase1-iwad",
        "open-freedoom-phase2-iwad",
        "project-created-fixture",
        "native-demo-matrix",
        "native-timedemo-matrix",
        "oracle-state-checkpoints",
        "oracle-indexed-framebuffer",
        "oracle-run-result",
    }
    if not expected_kinds.issubset(kinds):
        raise GateError(f"phase manifest lacks artifact classes: {sorted(expected_kinds - kinds)}")


def verify_subordinate_evidence() -> None:
    for command in (
        (sys.executable, "tools/taskctl.py", "validate"),
        (sys.executable, "tools/validate_project_docs.py"),
        (sys.executable, "tools/verify-oracle-fixtures.py", "tests/fixtures"),
    ):
        run(*command)
    p1_manifests = sorted((ROOT / "evidence/manifests/P01").glob("*.json"))
    for manifest in p1_manifests:
        if manifest.name == DEFAULT_MANIFEST.name or manifest.name.startswith("native-"):
            continue
        run(sys.executable, "tools/validate_artifact_manifest.py", manifest.relative_to(ROOT).as_posix())
    for config in ("debug", "release"):
        historical = [path for path in p1_manifests if path.name.startswith(f"native-{config}-")]
        if len(historical) < 2:
            raise GateError(f"missing repeated historical native {config} manifests")
        identities = set()
        for path in historical:
            value = load_json(path)
            if value.get("task") != "DOOM-P1-020" or value.get("verification", {}).get("result") != "PASS":
                raise GateError(f"historical native manifest is not PASS: {path.name}")
            artifacts = value.get("artifacts")
            if not isinstance(artifacts, list) or len(artifacts) != 1:
                raise GateError(f"historical native manifest has wrong artifacts: {path.name}")
            item = artifacts[0]
            identities.add((item.get("size_bytes"), item.get("sha256")))
            for command in value.get("build", {}).get("commands", []):
                for field in ("stdout_path", "stderr_path"):
                    if not (ROOT / command[field]).is_file():
                        raise GateError(f"historical manifest log missing: {command[field]}")
        if len(identities) != 1:
            raise GateError(f"historical native {config} rebuild identities disagree: {identities}")
    oracle_manifests = sorted((ROOT / "evidence/task-runs/P01-DOOM-P1-080").glob("*/build-manifest.json"))
    if len(oracle_manifests) != 1:
        raise GateError("missing unique final Oracle build manifest")
    run(sys.executable, "tools/validate_artifact_manifest.py", oracle_manifests[0].relative_to(ROOT).as_posix())

    demo = load_json(ROOT / "evidence/task-runs/P01-DOOM-P1-070/demo/matrix.json")
    timedemo = load_json(ROOT / "evidence/task-runs/P01-DOOM-P1-070/timedemo/matrix.json")
    oracle = load_json(ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/comparison.json")
    off = load_json(ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/instrumentation-off/result.json")
    if (demo.get("status"), demo.get("result_count"), demo.get("pass_count")) != ("PASS", 14, 14):
        raise GateError("demo matrix is not 14/14 PASS")
    if (timedemo.get("status"), timedemo.get("result_count"), timedemo.get("pass_count"), timedemo.get("timedemo_end_tics_stable")) != ("PASS", 7, 7, True):
        raise GateError("timedemo matrix is not stable 7/7 PASS")
    if oracle.get("status") != "PASS" or oracle.get("baseline_repetitions") != 5:
        raise GateError("native Oracle comparison is not PASS")
    if off.get("status") != "PASS" or off.get("end_tic") != 140 or off.get("oracle_artifacts"):
        raise GateError("instrumentation-off evidence is not PASS")
    oracle_root = ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set"

    def oracle_signature(relative: str) -> tuple[list[dict], list[str]]:
        run_root = oracle_root / relative
        result = load_json(run_root / "result.json")
        if result.get("status") != "PASS" or result.get("end_tic") != 140:
            raise GateError(f"Oracle run is not PASS: {relative}")
        states_path = run_root / "state.jsonl"
        states = [json.loads(line) for line in states_path.read_text(encoding="utf-8").splitlines()]
        if result.get("state", {}).get("sha256") != sha256(states_path):
            raise GateError(f"Oracle state result hash mismatch: {relative}")
        frame_hashes = []
        for frame in result.get("frames", []):
            frame_path = run_root / f"frame-{frame['tic']:03d}.bin"
            if frame_path.stat().st_size != 320 * 200 or sha256(frame_path) != frame.get("sha256"):
                raise GateError(f"Oracle frame result hash mismatch: {relative} tic {frame.get('tic')}")
            frame_hashes.append(frame["sha256"])
        if [state.get("tic") for state in states] != [0, 1, 35, 70, 140] or len(frame_hashes) != 4:
            raise GateError(f"Oracle checkpoint sequence mismatch: {relative}")
        return states, frame_hashes

    baseline = oracle_signature("baseline/run-1")
    for relative in [*(f"baseline/run-{index}" for index in range(1, 6)), "order-ab", "order-ba"]:
        if oracle_signature(relative) != baseline:
            raise GateError(f"Oracle deterministic signature mismatch: {relative}")
    effect_states, effect_frames = oracle_signature("deh-effect")
    baseline_states, baseline_frames = baseline
    if [item.get("maxammo0") for item in baseline_states] != [200] * 5 or [item.get("maxammo0") for item in effect_states] != [199] * 5:
        raise GateError("Oracle DeHackEd max-ammo effect mismatch")
    if effect_frames == baseline_frames:
        raise GateError("Oracle DeHackEd effect lacks logical-frame difference")
    if [{k: v for k, v in item.items() if k != "maxammo0"} for item in effect_states] != [{k: v for k, v in item.items() if k != "maxammo0"} for item in baseline_states]:
        raise GateError("Oracle DeHackEd effect changed unrelated state")
    for edition in ("phase1", "phase2"):
        result = ROOT / f"evidence/task-runs/P01-DOOM-P1-050/{edition}/result.txt"
        text = result.read_text(encoding="utf-8")
        if "process_healthy_at_capture=true" not in text or "real_mixer_setup_observed=true" not in text:
            raise GateError(f"native gameplay evidence failed: {edition}")


def verify_packet_files(candidate_commit: str) -> None:
    required = (
        ROOT / "docs/phases/P01/PHASE_RESULT.md",
        ROOT / "docs/reports/NATIVE_ORACLE_BASELINE.md",
        ROOT / "docs/results/P01/DOOM-P1-085.md",
        ROOT / "evidence/phase-gates/P01/SOL_GATE_PACKET.md",
    )
    for path in required:
        if not path.is_file():
            raise GateError(f"missing gate packet file: {path.relative_to(ROOT)}")
    result = (ROOT / "docs/results/P01/DOOM-P1-085.md").read_text(encoding="utf-8")
    if "Status: PASS" not in result or "Result commit: SELF" not in result:
        raise GateError("P1-085 result is not a SELF PASS")
    packet = (ROOT / "evidence/phase-gates/P01/SOL_GATE_PACKET.md").read_text(encoding="utf-8")
    if "DOOM-P1-090" not in packet or "independent" not in packet.lower() or "Candidate commit: SELF" not in packet:
        raise GateError("Sol packet lacks candidate or independent-review boundary")


def verify(path: Path) -> None:
    candidate_commit, candidate = verify_git_and_tasks()
    verify_candidate_worktree(candidate)
    verify_manifest(path)
    verify_subordinate_evidence()
    verify_packet_files(candidate_commit)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()
    manifest = args.manifest.resolve()
    try:
        if args.generate:
            generate_manifest(manifest)
            return 0
        verify(manifest)
    except (GateError, OSError, UnicodeError, ValueError, KeyError, TypeError) as exc:
        print(f"SFHS_DOOM_P1_NATIVE_ORACLE_GATE=FAIL reason={exc}")
        return 1
    print("SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
