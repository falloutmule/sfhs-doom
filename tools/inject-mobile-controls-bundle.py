#!/usr/bin/env python3
"""Inject one deterministic SFHS mobile-controls IIFE into the P6 shell."""

from __future__ import annotations

import argparse
from pathlib import Path


MARKER = "<!-- SFHS_MOBILE_CONTROLS_BUNDLE -->"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--shell", required=True, type=Path)
    parser.add_argument("--bundle", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    shell = args.shell.read_text(encoding="utf-8")
    bundle = args.bundle.read_text(encoding="utf-8")
    if shell.count(MARKER) != 1:
        raise SystemExit("P6 shell must contain exactly one mobile-controls marker")
    if not bundle.strip():
        raise SystemExit("refusing to inject an empty mobile-controls bundle")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(shell.replace(MARKER, "<script>\n" + bundle + "\n</script>"), encoding="utf-8")


if __name__ == "__main__":
    main()
