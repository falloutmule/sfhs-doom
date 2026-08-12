#!/usr/bin/env python3
"""Validate SFHS Doom Forge single-file capsule contracts."""

from __future__ import annotations

import argparse
import base64
import gzip
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys


class CapsuleParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.documents = 0
        self.capture: str | None = None
        self.parts: list[str] = []
        self.manifest_text: str | None = None
        self.chunks: list[tuple[str, int, str]] = []
        self.inline_handlers: list[str] = []

    def handle_decl(self, decl: str) -> None:
        if decl.lower() == "doctype html":
            self.documents += 1

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, _ in attrs:
            if name.lower().startswith("on"):
                self.inline_handlers.append(name)
        if tag != "script":
            return
        values = dict(attrs)
        if values.get("id") == "sfhs-capsule-manifest" and values.get("type") == "application/json":
            if self.manifest_text is not None or self.capture is not None:
                raise ValueError("duplicate manifest")
            self.capture = "manifest"
            self.parts = []
        elif values.get("type") == "application/octet-stream" and "data-sfhs-payload-id" in values:
            index = values.get("data-sfhs-chunk-index")
            if index is None or not index.isdigit():
                raise ValueError("invalid chunk index")
            self.capture = f"chunk:{values['data-sfhs-payload-id']}:{index}"
            self.parts = []

    def handle_data(self, data: str) -> None:
        if self.capture is not None:
            self.parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != "script" or self.capture is None:
            return
        text = "".join(self.parts)
        if self.capture == "manifest":
            self.manifest_text = text
        else:
            _, payload_id, index = self.capture.split(":", 2)
            self.chunks.append((payload_id, int(index), text))
        self.capture = None
        self.parts = []


TOP_KEYS = {"schema", "capsule", "payloads", "bases", "recipes", "credits", "verification"}
PAYLOAD_KEYS = {"id", "role", "filename", "mediaType", "decoded", "compression", "encoding", "encoded", "chunkSize", "chunkCount", "permission", "license", "storage"}


def validate(path: Path, mode: str | None = None, capsule_version: int | None = None) -> dict[str, object]:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    parser = CapsuleParser()
    parser.feed(text)
    if parser.documents != 1:
        raise ValueError(f"expected one HTML document, got {parser.documents}")
    if parser.manifest_text is None:
        raise ValueError("manifest missing")
    manifest = json.loads(parser.manifest_text)
    if set(manifest) != TOP_KEYS or manifest["schema"] != "sfhs.doom-capsule@1":
        raise ValueError("manifest schema/topology mismatch")
    if len(manifest["payloads"]) != 1 or len(manifest["bases"]) != 1 or len(manifest["recipes"]) != 1:
        raise ValueError("Forge runtime requires one payload/base/recipe")
    capsule = manifest["capsule"]
    if set(capsule) != {"id", "name", "version", "buildProfile", "mode"}:
        raise ValueError("capsule topology mismatch")
    actual_version = capsule["version"]
    if actual_version not in (1, 2):
        raise ValueError("unsupported capsule version")
    if capsule_version is not None and actual_version != capsule_version:
        raise ValueError(f"expected capsule version {capsule_version}, got {actual_version}")
    if capsule != {
        "id": f"sfhs-doom-forge-v{actual_version}",
        "name": f"SFHS Doom Forge V{actual_version}",
        "version": actual_version,
        "buildProfile": f"P7-FORGE-V{actual_version}",
        "mode": capsule["mode"],
    }:
        raise ValueError("capsule identity mismatch")
    payload = manifest["payloads"][0]
    if set(payload) != PAYLOAD_KEYS:
        raise ValueError("payload topology mismatch")
    actual_mode = manifest["capsule"]["mode"]
    if mode is not None and actual_mode != mode:
        raise ValueError(f"expected {mode} mode, got {actual_mode}")
    if payload["decoded"] != {"bytes": 28_787_748, "sha256": "a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b"}:
        raise ValueError("Freedoom decoded identity mismatch")
    if "function findWasmBinary()" not in text or "return binaryDecode(" not in text:
        raise ValueError("engine is not a SINGLE_FILE Wasm package")
    if re.search(r"<(?:script|link|img|audio|video|source)\b[^>]+(?:src|href)\s*=\s*[\"']https?://", text, re.I):
        raise ValueError("unexpected external runtime asset")
    if parser.inline_handlers:
        raise ValueError("inline event handler found")
    if re.search(r"\beval\s*\(", text):
        raise ValueError("eval found")
    if actual_version == 2:
        for token in (
            'id="sfhs-forge-analyzer-worker-source"',
            'id="forge-inspect-file"',
            'id="inspection-card"',
            "sfhs.doom-inspection@1",
            "new Worker(url)",
            "local-only-not-uploaded",
        ):
            if token not in text:
                raise ValueError(f"Forge V2 analyzer token missing: {token}")
        if text.count('id="sfhs-forge-analyzer-worker-source"') != 1:
            raise ValueError("Forge V2 analyzer worker source count mismatch")
    elif "sfhs.doom-inspection@1" in text or 'id="forge-inspect-file"' in text:
        raise ValueError("Forge V1 unexpectedly contains P7-B analyzer")
    if actual_mode == "full":
        expected = payload["chunkCount"]
        if len(parser.chunks) != expected:
            raise ValueError("chunk count mismatch")
        encoded_parts: list[bytes] = []
        for expected_index, (payload_id, index, value) in enumerate(parser.chunks):
            if payload_id != payload["id"] or index != expected_index:
                raise ValueError("chunk order/identity mismatch")
            encoded_parts.append(base64.b64decode("".join(value.split()), validate=True))
        encoded = b"".join(encoded_parts)
        if len(encoded) != payload["encoded"]["bytes"] or sha256(encoded).hexdigest() != payload["encoded"]["sha256"]:
            raise ValueError("encoded payload identity mismatch")
        decoded = gzip.decompress(encoded)
        if len(decoded) != payload["decoded"]["bytes"] or sha256(decoded).hexdigest() != payload["decoded"]["sha256"]:
            raise ValueError("decoded payload identity mismatch")
    elif actual_mode == "thin":
        if parser.chunks or payload["chunkCount"] != 0 or payload["storage"]["kind"] != "external-file":
            raise ValueError("thin capsule carries embedded chunks")
    else:
        raise ValueError("unsupported capsule mode")
    return {"path": str(path), "version": actual_version, "mode": actual_mode, "bytes": len(raw), "sha256": sha256(raw).hexdigest(), "chunks": len(parser.chunks)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--mode", choices=("full", "thin"))
    parser.add_argument("--capsule-version", type=int, choices=(1, 2))
    args = parser.parse_args()
    try:
        result = validate(args.artifact, args.mode, args.capsule_version)
    except (OSError, UnicodeError, ValueError, KeyError, TypeError, gzip.BadGzipFile) as error:
        print(f"P7_FORGE_VALIDATE=FAIL {error}", file=sys.stderr)
        return 1
    print("P7_FORGE_VALIDATE=PASS " + json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
