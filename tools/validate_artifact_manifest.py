#!/usr/bin/env python3
"""Validate a repository-relative SFHS Doom artifact manifest.

The validator is intentionally small and standard-library-only.  It reads
declarative command metadata from the manifest but never executes it.
"""

from __future__ import annotations

import argparse
import datetime as _datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
COMMIT_RE = re.compile(r"[0-9a-f]{40}\Z")
TASK_RE = re.compile(r"DOOM-P\d+-\d{3}\Z")


class ManifestValidationError(Exception):
    """Raised when a manifest fails the evidence contract."""


def _require_object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ManifestValidationError(f"{label} must be an object")
    return value


def _strict_keys(value: dict[str, Any], allowed: set[str], label: str) -> None:
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise ManifestValidationError(f"{label} has unknown fields: {', '.join(unknown)}")


def _required(value: dict[str, Any], key: str, label: str) -> Any:
    if key not in value:
        raise ManifestValidationError(f"{label} is missing required field: {key}")
    return value[key]


def _nonempty_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ManifestValidationError(f"{label} must be a non-empty string")
    return value


def _nonnegative_integer(value: Any, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ManifestValidationError(f"{label} must be a non-negative integer")
    return value


def _sha256(value: Any, label: str) -> str:
    value = _nonempty_string(value, label)
    if not SHA256_RE.fullmatch(value):
        raise ManifestValidationError(f"{label} must be a lowercase 64-character SHA-256")
    return value


def _commit(value: Any, label: str) -> str:
    value = _nonempty_string(value, label)
    if not COMMIT_RE.fullmatch(value):
        raise ManifestValidationError(f"{label} must be a lowercase 40-character commit SHA")
    return value


def _repo_path(root: Path, value: Any, label: str, require_file: bool = False, allow_dot: bool = False) -> Path:
    value = _nonempty_string(value, label)
    normalized = value.replace("\\", "/")
    pure = PurePosixPath(normalized)
    if pure.is_absolute() or re.match(r"^[A-Za-z]:", normalized):
        raise ManifestValidationError(f"{label} must be repository-relative: {value}")
    if any(part == ".." for part in pure.parts):
        raise ManifestValidationError(f"{label} may not escape the repository: {value}")
    if not pure.parts and allow_dot:
        return root.resolve()
    if not pure.parts:
        raise ManifestValidationError(f"{label} may not be empty")
    candidate = root.joinpath(*pure.parts).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as exc:
        raise ManifestValidationError(f"{label} resolves outside the repository: {value}") from exc
    if require_file and not candidate.is_file():
        raise ManifestValidationError(f"{label} file is missing: {value}")
    return candidate


def _iso_utc(value: Any, label: str) -> str:
    value = _nonempty_string(value, label)
    try:
        parsed = _datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ManifestValidationError(f"{label} must be an ISO-8601 timestamp") from exc
    if parsed.tzinfo is None:
        raise ManifestValidationError(f"{label} must include a timezone")
    return value


def _hash_file(path: Path) -> tuple[int, str]:
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            size += len(chunk)
            digest.update(chunk)
    return size, digest.hexdigest()


def _string_list(value: Any, label: str, *, allow_empty: bool = False) -> list[str]:
    if not isinstance(value, list):
        raise ManifestValidationError(f"{label} must be an array")
    result = []
    for index, item in enumerate(value):
        result.append(_nonempty_string(item, f"{label}[{index}]"))
    if not allow_empty and not result:
        raise ManifestValidationError(f"{label} must not be empty")
    return result


class ManifestValidator:
    """Validate manifests against the P00 evidence contract."""

    def __init__(self, repo_root: Path = ROOT):
        self.root = repo_root.resolve()

    def validate_file(self, manifest_path: Path) -> None:
        try:
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise ManifestValidationError(f"manifest file is missing: {manifest_path}") from exc
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise ManifestValidationError(f"cannot read manifest {manifest_path}: {exc}") from exc
        self.validate_data(data)

    def validate_data(self, data: Any) -> None:
        manifest = _require_object(data, "manifest")
        _strict_keys(
            manifest,
            {"schema_version", "manifest_type", "project", "edition", "phase", "task", "source", "build", "artifacts", "verification", "notes"},
            "manifest",
        )
        if manifest.get("schema_version") != 1:
            raise ManifestValidationError("schema_version must be integer 1")
        if manifest.get("manifest_type") != "artifact":
            raise ManifestValidationError("manifest_type must be 'artifact'")
        if manifest.get("project") != "sfhs-doom":
            raise ManifestValidationError("project must be 'sfhs-doom'")
        _nonempty_string(_required(manifest, "edition", "manifest"), "edition")
        if manifest.get("phase") != "P00":
            raise ManifestValidationError("phase must be 'P00' for this fixture contract")
        task = _required(manifest, "task", "manifest")
        if not isinstance(task, str) or not TASK_RE.fullmatch(task):
            raise ManifestValidationError("task must be a DOOM-Px-yyy identifier")

        source = _require_object(_required(manifest, "source", "manifest"), "source")
        _strict_keys(source, {"commit", "upstream_tag", "upstream_sha", "dirty", "toolchains", "inputs"}, "source")
        _commit(_required(source, "commit", "source"), "source.commit")
        _nonempty_string(_required(source, "upstream_tag", "source"), "source.upstream_tag")
        _commit(_required(source, "upstream_sha", "source"), "source.upstream_sha")
        if not isinstance(_required(source, "dirty", "source"), bool):
            raise ManifestValidationError("source.dirty must be boolean")

        toolchains = _required(source, "toolchains", "source")
        if not isinstance(toolchains, list) or not toolchains:
            raise ManifestValidationError("source.toolchains must be a non-empty array")
        for index, item in enumerate(toolchains):
            toolchain = _require_object(item, f"source.toolchains[{index}]")
            _strict_keys(toolchain, {"name", "version", "source"}, f"source.toolchains[{index}]")
            _nonempty_string(_required(toolchain, "name", f"source.toolchains[{index}]"), f"source.toolchains[{index}].name")
            _nonempty_string(_required(toolchain, "version", f"source.toolchains[{index}]"), f"source.toolchains[{index}].version")
            _nonempty_string(_required(toolchain, "source", f"source.toolchains[{index}"), f"source.toolchains[{index}].source")

        tracked_paths: dict[str, str] = {}
        inputs = _required(source, "inputs", "source")
        if not isinstance(inputs, list):
            raise ManifestValidationError("source.inputs must be an array")
        for index, item in enumerate(inputs):
            input_data = _require_object(item, f"source.inputs[{index}]")
            _strict_keys(input_data, {"path", "size_bytes", "sha256"}, f"source.inputs[{index}]")
            relative = _nonempty_string(_required(input_data, "path", f"source.inputs[{index}]"), f"source.inputs[{index}].path")
            path = _repo_path(self.root, relative, f"source.inputs[{index}].path", require_file=True)
            key = path.as_posix().lower()
            if key in tracked_paths:
                raise ManifestValidationError(f"duplicate evidence path: {relative}")
            tracked_paths[key] = relative
            expected_size = _nonnegative_integer(_required(input_data, "size_bytes", f"source.inputs[{index}]"), f"source.inputs[{index}].size_bytes")
            expected_hash = _sha256(_required(input_data, "sha256", f"source.inputs[{index}]"), f"source.inputs[{index}].sha256")
            actual_size, actual_hash = _hash_file(path)
            if expected_size != actual_size:
                raise ManifestValidationError(f"source.inputs[{index}].size_bytes does not match disk: {relative}")
            if expected_hash != actual_hash:
                raise ManifestValidationError(f"source.inputs[{index}].sha256 does not match disk: {relative}")

        build = _require_object(_required(manifest, "build", "manifest"), "build")
        _strict_keys(build, {"utc", "id", "commands"}, "build")
        _iso_utc(_required(build, "utc", "build"), "build.utc")
        build_id = _nonempty_string(_required(build, "id", "build"), "build.id")
        _string_list([build_id], "build.id")
        commands = _required(build, "commands", "build")
        if not isinstance(commands, list) or not commands:
            raise ManifestValidationError("build.commands must be a non-empty array")
        for index, item in enumerate(commands):
            command = _require_object(item, f"build.commands[{index}]")
            _strict_keys(command, {"argv", "cwd", "exit_code", "stdout_path", "stderr_path"}, f"build.commands[{index}]")
            argv = _string_list(_required(command, "argv", f"build.commands[{index}]"), f"build.commands[{index}].argv")
            del argv  # Command metadata is recorded, never executed.
            _repo_path(self.root, _required(command, "cwd", f"build.commands[{index}]"), f"build.commands[{index}].cwd", allow_dot=True)
            exit_code = _required(command, "exit_code", f"build.commands[{index}]")
            if isinstance(exit_code, bool) or not isinstance(exit_code, int):
                raise ManifestValidationError(f"build.commands[{index}].exit_code must be an integer")
            for stream in ("stdout_path", "stderr_path"):
                relative = _nonempty_string(_required(command, stream, f"build.commands[{index}]"), f"build.commands[{index}].{stream}")
                path = _repo_path(self.root, relative, f"build.commands[{index}].{stream}", require_file=True)
                key = path.as_posix().lower()
                if key in tracked_paths:
                    raise ManifestValidationError(f"duplicate evidence path: {relative}")
                tracked_paths[key] = relative

        artifacts = _required(manifest, "artifacts", "manifest")
        if not isinstance(artifacts, list) or not artifacts:
            raise ManifestValidationError("artifacts must be a non-empty array")
        for index, item in enumerate(artifacts):
            artifact = _require_object(item, f"artifacts[{index}]")
            _strict_keys(artifact, {"path", "size_bytes", "sha256", "kind"}, f"artifacts[{index}]")
            relative = _nonempty_string(_required(artifact, "path", f"artifacts[{index}]"), f"artifacts[{index}].path")
            path = _repo_path(self.root, relative, f"artifacts[{index}].path", require_file=True)
            key = path.as_posix().lower()
            if key in tracked_paths:
                raise ManifestValidationError(f"duplicate evidence path: {relative}")
            tracked_paths[key] = relative
            expected_size = _nonnegative_integer(_required(artifact, "size_bytes", f"artifacts[{index}]"), f"artifacts[{index}].size_bytes")
            expected_hash = _sha256(_required(artifact, "sha256", f"artifacts[{index}]"), f"artifacts[{index}].sha256")
            _nonempty_string(_required(artifact, "kind", f"artifacts[{index}]"), f"artifacts[{index}].kind")
            actual_size, actual_hash = _hash_file(path)
            if expected_size != actual_size:
                raise ManifestValidationError(f"artifacts[{index}].size_bytes does not match disk: {relative}")
            if expected_hash != actual_hash:
                raise ManifestValidationError(f"artifacts[{index}].sha256 does not match disk: {relative}")

        verification = _require_object(_required(manifest, "verification", "manifest"), "verification")
        _strict_keys(verification, {"run_ids", "result", "checks"}, "verification")
        run_ids = _string_list(_required(verification, "run_ids", "verification"), "verification.run_ids")
        if len(run_ids) != len(set(run_ids)):
            raise ManifestValidationError("verification.run_ids must be unique")
        if verification.get("result") not in {"PASS", "FAIL", "BLOCKED"}:
            raise ManifestValidationError("verification.result must be PASS, FAIL, or BLOCKED")
        _string_list(_required(verification, "checks", "verification"), "verification.checks")

        notes = _required(manifest, "notes", "manifest")
        _string_list(notes, "notes", allow_empty=True)


def validate_manifest(manifest_path: Path, repo_root: Path = ROOT) -> None:
    ManifestValidator(repo_root).validate_file(manifest_path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate an SFHS Doom artifact manifest")
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args(argv)
    try:
        validate_manifest(args.manifest)
    except (ManifestValidationError, OSError, UnicodeError) as exc:
        print(f"MANIFEST INVALID: {exc}", file=sys.stderr)
        return 1
    print(f"MANIFEST PASS: {args.manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
