#!/usr/bin/env python3
"""Insert one exact Emscripten loader into the P3 HTML shell."""

from __future__ import annotations

import argparse
from pathlib import Path

MARKER = "<!-- SFHS_P3_ENGINE_JS -->"

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shell", type=Path, required=True)
    parser.add_argument("--engine-js", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    shell = args.shell.read_text(encoding="utf-8")
    if shell.count(MARKER) != 1:
        raise SystemExit("P3_PACKAGER_FAIL: shell must contain exactly one engine marker")
    engine = args.engine_js.read_text(encoding="utf-8").replace("</script", "<\\/script")
    output = shell.replace(MARKER, "<script>\n" + engine + "\n</script>")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8", newline="\n")
    print(f"P3_PACKAGE=PASS output={args.output}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
