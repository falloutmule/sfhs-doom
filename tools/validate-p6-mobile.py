from __future__ import annotations

import re
import sys
from pathlib import Path


def main(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    failures = []
    if text.count("<!doctype html>") != 1:
        failures.append("not exactly one HTML document")
    for token in (
        "P6-ANDROID-PORTRAIT-V10",
        'id="sfhs-fullscreen-root"',
        'data-sfhs-fullscreen-app-root="v10"',
        'id="canvas" width="320" height="200"',
        'id="doom-status-canvas" width="320" height="32"',
        "requestFullscreen",
        "sfhs_mobile_hud_snapshot",
        "sfhs_mobile_hud_pixels",
        "HEAPU8",
        "minimap-canvas",
        "sfhs_mobile_state_snapshot",
        "sfhs_mobile_state_lines",
        "sfhs_mobile_input_set_held",
        "sfhs_mobile_input_post_look",
    ):
        if token not in text:
            failures.append(f"missing {token}")
    for stale in ('id="info-strip"', 'id="hud-health"', 'id="hud-armor"',
                  'id="hud-ammo"', 'id="hud-weapon"', 'id="hud-keys"'):
        if stale in text:
            failures.append(f"stale HTML HUD token {stale}")
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
