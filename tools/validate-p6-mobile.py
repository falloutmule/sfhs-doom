from __future__ import annotations

import re
import sys
from pathlib import Path


def main(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    failures = []
    if text.count("<!doctype html>") != 1:
        failures.append("not exactly one HTML document")
    for token in ("P6-ANDROID-PORTRAIT-1", "minimap-canvas", "sfhs_mobile_state_snapshot", "sfhs_mobile_input_set_held"):
        if token not in text:
            failures.append(f"missing {token}")
    if re.search(r"(?:src|href)=[\"'][^\"']*chocolate-doom\.wasm", text, re.I):
        failures.append("external Wasm asset reference")
    if re.search(r"<(?:script|link|img)\b[^>]+(?:src|href)=[\"']https?://", text, re.I):
        failures.append("external HTTP asset")
    if failures:
        print("P6_ANDROID_STATIC=FAIL " + "; ".join(failures))
        return 1
    print(f"P6_ANDROID_STATIC=PASS bytes={path.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(Path(sys.argv[1])))
