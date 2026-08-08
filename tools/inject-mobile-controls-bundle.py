#!/usr/bin/env python3
"""Inject one deterministic SFHS mobile-controls IIFE into the P6 shell."""

from __future__ import annotations

import argparse
from pathlib import Path


MARKER = "<!-- SFHS_MOBILE_CONTROLS_BUNDLE -->"
BODY_MARKER = "</body>"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shell", required=True, type=Path)
    parser.add_argument("--bundle", required=True, type=Path)
    parser.add_argument("--append-script", type=Path,
                        help="append a local diagnostic script immediately before </body>")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    shell = args.shell.read_text(encoding="utf-8")
    bundle = args.bundle.read_text(encoding="utf-8")
    if shell.count(MARKER) != 1:
        raise SystemExit("P6 shell must contain exactly one mobile-controls marker")
    if not bundle.strip():
        raise SystemExit("refusing to inject an empty mobile-controls bundle")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    output = shell.replace(MARKER, "<script>\n" + bundle + "\n</script>")
    if args.append_script is not None:
        diagnostic = args.append_script.read_text(encoding="utf-8")
        if not diagnostic.strip():
            raise SystemExit("refusing to append an empty diagnostic script")
        if output.count(BODY_MARKER) != 1:
            raise SystemExit("P6 shell must contain exactly one body marker")
        output = output.replace(BODY_MARKER, "<script>\n" + diagnostic + "\n</script>\n" + BODY_MARKER)
    args.output.write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
