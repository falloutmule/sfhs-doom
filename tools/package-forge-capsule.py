#!/usr/bin/env python3
"""Package a content-independent Doom engine and declared payload into one HTML."""

from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import io
import json
from pathlib import Path

ENGINE_MARKER = "<!-- SFHS_P3_ENGINE_JS -->"
PAYLOAD_MARKER = "<!-- SFHS_FORGE_CAPSULE_PAYLOAD -->"
ANALYZER_MARKER = "<!-- SFHS_FORGE_ANALYZER_WORKER -->"
SCHEMA = "sfhs.doom-capsule@1"
DEFAULT_CHUNK_SIZE = 196_608


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def deterministic_gzip(data: bytes) -> bytes:
    output = io.BytesIO()
    with gzip.GzipFile(filename="", mode="wb", fileobj=output, compresslevel=9, mtime=0) as stream:
        stream.write(data)
    return output.getvalue()


def manifest_for(wad: bytes, mode: str, compressed: bytes, chunk_size: int, capsule_version: int) -> dict[str, object]:
    decoded_hash = sha256(wad)
    embedded = mode == "full"
    encoded = compressed if embedded else wad
    chunk_count = (len(compressed) + chunk_size - 1) // chunk_size if embedded else 0
    payload_id = "freedoom2-0.13.0"
    return {
        "schema": SCHEMA,
        "capsule": {
            "id": f"sfhs-doom-forge-v{capsule_version}",
            "name": f"SFHS Doom Forge V{capsule_version}",
            "version": capsule_version,
            "buildProfile": f"P7-FORGE-V{capsule_version}",
            "mode": mode,
        },
        "payloads": [
            {
                "id": payload_id,
                "role": "iwad",
                "filename": "freedoom2.wad",
                "mediaType": "application/x-doom-wad",
                "decoded": {"bytes": len(wad), "sha256": decoded_hash},
                "compression": "gzip" if embedded else "none",
                "encoding": "base64" if embedded else "identity",
                "encoded": {"bytes": len(encoded), "sha256": sha256(encoded)},
                "chunkSize": chunk_size if embedded else 0,
                "chunkCount": chunk_count,
                "permission": "redistributable",
                "license": "BSD-3-Clause",
                "storage": {"kind": "embedded-chunks" if embedded else "external-file"},
            }
        ],
        "bases": [
            {
                "id": "freedoom-phase-2",
                "payloadId": payload_id,
                "family": "doom2",
                "redistributable": True,
            }
        ],
        "recipes": [
            {
                "id": "freedoom2-map01",
                "baseId": "freedoom-phase-2",
                "payloadIds": [payload_id],
                "args": [
                    "-iwad", "freedoom2.wad", "-warp", "1", "1", "-skill", "3",
                    "-window", "-width", "320", "-height", "200", "-nograbmouse",
                ],
            }
        ],
        "credits": [
            {
                "payloadId": payload_id,
                "name": "Freedoom Phase 2",
                "version": "0.13.0",
                "project": "https://freedoom.github.io/",
                "license": "BSD-3-Clause",
            }
        ],
        "verification": {
            "hashAlgorithm": "sha256",
            "decodedRequired": True,
            "encodedRequired": True,
            "launchAfterVerificationOnly": True,
        },
    }


def payload_markup(manifest: dict[str, object], compressed: bytes, mode: str, chunk_size: int) -> str:
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2, separators=(",", ": "))
    manifest_text = manifest_text.replace("</", "<\\/")
    blocks = [f'<script id="sfhs-capsule-manifest" type="application/json">\n{manifest_text}\n</script>']
    if mode == "full":
        payload_id = manifest["payloads"][0]["id"]  # type: ignore[index]
        for index, offset in enumerate(range(0, len(compressed), chunk_size)):
            encoded = base64.b64encode(compressed[offset : offset + chunk_size]).decode("ascii")
            blocks.append(
                '<script type="application/octet-stream" '
                f'data-sfhs-payload-id="{payload_id}" data-sfhs-chunk-index="{index}">'
                f'{encoded}</script>'
            )
    return "\n    ".join(blocks)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shell", type=Path, required=True)
    parser.add_argument("--engine-js", type=Path, required=True)
    parser.add_argument("--analyzer-worker", type=Path)
    parser.add_argument("--wad", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--mode", choices=("full", "thin"), required=True)
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE)
    parser.add_argument("--capsule-version", type=int, choices=(1, 2), default=1)
    args = parser.parse_args()

    if args.chunk_size < 16_384 or args.chunk_size > 1_048_576:
        raise SystemExit("FORGE_PACKAGE_FAIL: chunk size outside supported range")
    shell = args.shell.read_text(encoding="utf-8")
    if shell.count(ENGINE_MARKER) != 1 or shell.count(PAYLOAD_MARKER) != 1:
        raise SystemExit("FORGE_PACKAGE_FAIL: shell engine/payload markers must each appear exactly once")
    if args.capsule_version == 2:
        if args.analyzer_worker is None or shell.count(ANALYZER_MARKER) != 1:
            raise SystemExit("FORGE_PACKAGE_FAIL: Forge V2 requires one analyzer worker marker and source")
    elif ANALYZER_MARKER in shell:
        raise SystemExit("FORGE_PACKAGE_FAIL: Forge V1 shell cannot contain an analyzer marker")
    if "SFHS_MOBILE_CONTROLS_BUNDLE" in shell:
        raise SystemExit("FORGE_PACKAGE_FAIL: shared control bundle was not injected")

    engine = args.engine_js.read_text(encoding="utf-8").replace("</script", "<\\/script")
    wad = args.wad.read_bytes()
    compressed = deterministic_gzip(wad)
    manifest = manifest_for(wad, args.mode, compressed, args.chunk_size, args.capsule_version)
    output = shell.replace(PAYLOAD_MARKER, payload_markup(manifest, compressed, args.mode, args.chunk_size))
    if args.capsule_version == 2:
        worker = args.analyzer_worker.read_text(encoding="utf-8").replace("</script", "<\\/script")
        output = output.replace(
            ANALYZER_MARKER,
            '<script id="sfhs-forge-analyzer-worker-source" type="text/plain">\n'
            + worker
            + "\n</script>",
        )
    output = output.replace(ENGINE_MARKER, "<script>\n" + engine + "\n</script>")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8", newline="\n")
    print(
        "FORGE_PACKAGE=PASS "
        f"mode={args.mode} output={args.output} bytes={args.output.stat().st_size} "
        f"sha256={hashlib.sha256(args.output.read_bytes()).hexdigest()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
