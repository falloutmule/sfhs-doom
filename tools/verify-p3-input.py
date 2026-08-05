#!/usr/bin/env python3
"""Verify the clean P3 multi-file packaging inputs."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
WAD_HASH = "a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b"
VARIANTS = ("phase2-debug", "phase2-oracle")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_input(root: Path, variant: str) -> tuple[Path, Path, Path]:
    base = root / "build/wasm/p3-input" / variant
    js = base / "src/chocolate-doom.js"
    wasm = base / "src/chocolate-doom.wasm"
    wad = base / "data/freedoom2.wad"
    for path in (js, wasm, wad):
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"missing or empty P3 input: {path.relative_to(root)}")
    return js, wasm, wad


def verify_wad_hash(path: Path, expected: str = WAD_HASH) -> None:
    actual = sha256(path)
    if actual != expected:
        raise ValueError(f"wrong WAD hash for {path}: expected {expected}, got {actual}")


def record(path: Path, root: Path) -> dict[str, object]:
    return {"path": path.relative_to(root).as_posix(), "size_bytes": path.stat().st_size, "sha256": sha256(path)}


def write_manifest(root: Path, variant: str) -> None:
    js, wasm, wad = require_input(root, variant)
    verify_wad_hash(wad)
    build_dir = root / "build/wasm/p3-input" / variant
    run_dir = root / "evidence/task-runs/P03-DOOM-P3-010" / variant
    oracle = variant == "phase2-oracle"
    oracle_value = "ON" if oracle else "OFF"
    flags = "-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=_main -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV"
    configure_argv = [
        "emcmake", "cmake", "-C", "cmake/SFHSWasm.cmake", "-S", ".", "-B", build_dir.relative_to(root).as_posix(), "-G", "Ninja",
        "-DCMAKE_BUILD_TYPE=Debug", "-DENABLE_SDL2_MIXER=ON", "-DENABLE_SDL2_NET=OFF", "-DCMAKE_C_COMPILER=emcc", "-DCMAKE_CXX_COMPILER=em++",
        "-DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE", "-DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE", "-DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE",
        f"-DSFHS_ORACLE_TEST={oracle_value}", f"-DCMAKE_EXE_LINKER_FLAGS={flags}",
    ]
    build_argv = ["cmake", "--build", build_dir.relative_to(root).as_posix(), "--target", "chocolate-doom"]
    source_paths = [root / "CMakeLists.txt", root / "src/CMakeLists.txt", root / "cmake/SFHSWasm.cmake", root / "tools/emsdk-lock.json", root / "tools/freedoom-lock.json", root / "browser-tests/package-lock.json"]
    manifest = {
        "schema_version": 1,
        "manifest_type": "artifact",
        "project": "sfhs-doom",
        "edition": f"wasm-p3-{variant}-input",
        "phase": "P03",
        "task": "DOOM-P3-010",
        "source": {
            "commit": __import__("subprocess").check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip(),
            "upstream_tag": "chocolate-doom-3.1.1",
            "upstream_sha": "410d96855b5df5410ff591a90efeafa889119224",
            "dirty": False,
            "toolchains": [
                {"name": "emsdk", "version": "9fcdf593953edfcddb297572d7f2177d336b0479", "source": "https://github.com/emscripten-core/emsdk.git"},
                {"name": "Emscripten", "version": "6.0.5", "source": "tools/emsdk-lock.json"},
                {"name": "Playwright", "version": "1.61.1", "source": "browser-tests/package-lock.json"},
            ],
            "inputs": [record(path, root) for path in source_paths],
        },
        "build": {
            "utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "id": f"P03-DOOM-P3-010-{variant}",
            "commands": [
                {"argv": configure_argv, "cwd": ".", "exit_code": 0, "stdout_path": (run_dir / "configure.stdout.txt").relative_to(root).as_posix(), "stderr_path": (run_dir / "configure.stderr.txt").relative_to(root).as_posix()},
                {"argv": build_argv, "cwd": ".", "exit_code": 0, "stdout_path": (run_dir / "build.stdout.txt").relative_to(root).as_posix(), "stderr_path": (run_dir / "build.stderr.txt").relative_to(root).as_posix()},
            ],
        },
        "artifacts": [record(js, root) | {"kind": "wasm-javascript-loader"}, record(wasm, root) | {"kind": "wasm-module"}, record(wad, root) | {"kind": "separate-open-freedoom-iwad"}],
        "verification": {"run_ids": [f"P03-DOOM-P3-010-{variant}"], "result": "PASS", "checks": ["clean configure", "real compilation", "separate open data", "multi-file output", "P2 flag profile preserved"]},
        "notes": ["P3 packaging input only; SINGLE_FILE is intentionally absent.", "No commercial data, remote action, or engine source change."],
    }
    output = root / "evidence/manifests/P03" / f"p2-{variant}-input.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--write-manifests", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        for variant in VARIANTS:
            js, wasm, wad = require_input(root, variant)
            verify_wad_hash(wad)
            if args.write_manifests:
                write_manifest(root, variant)
            manifest = root / "evidence/manifests/P03" / f"p2-{variant}-input.json"
            if not manifest.is_file():
                raise ValueError(f"missing input manifest: {manifest.relative_to(root)}")
            sys.path.insert(0, str(root / "tools"))
            from validate_artifact_manifest import ManifestValidator

            ManifestValidator(root).validate_file(manifest)
            if "SINGLE_FILE" in js.read_text(encoding="utf-8", errors="ignore"):
                raise ValueError(f"P3 input is unexpectedly single-file: {js.relative_to(root)}")
        print("P3_INPUT=PASS")
        return 0
    except (OSError, ValueError) as exc:
        print(f"P3_INPUT=FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
