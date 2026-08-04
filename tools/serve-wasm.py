#!/usr/bin/env python3
"""Serve the staged P2 multi-file Wasm artifacts on loopback only."""

from __future__ import annotations

import argparse
import json
import mimetypes
import signal
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
BUILD_ROOT = ROOT / "build" / "wasm" / "P2-050"
SHELL = ROOT / "web" / "p2" / "shell.html"
P2_ASSETS = ROOT / "web" / "p2"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--ready-file", type=Path, required=True)
    parser.add_argument("--log-file", type=Path, required=True)
    parser.add_argument("--shutdown-file", type=Path)
    return parser.parse_args()


class ServerState:
    def __init__(self, log_file: Path) -> None:
        self.log_file = log_file
        self.lock = threading.Lock()

    def log(self, record: dict) -> None:
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        with self.lock, self.log_file.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(record, sort_keys=True) + "\n")


def safe_file(root: Path, relative: str) -> Path | None:
    candidate = (root / relative).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def route(path: str) -> tuple[Path, str] | None:
    if path in ("/", "/phase1/", "/phase1/index.html"):
        return SHELL, "phase1"
    if path in ("/phase2/", "/phase2/index.html"):
        return SHELL, "phase2"
    if path == "/p2/pre.js":
        return safe_file(P2_ASSETS, "pre.js"), "asset"
    if path == "/p2/post.js":
        return safe_file(P2_ASSETS, "post.js"), "asset"
    if path.startswith("/engine/"):
        return safe_file(BUILD_ROOT / "phase1-debug", path.removeprefix("/engine/")), "engine"
    for phase, variant, wad in (
        ("phase1", "phase1-debug", "freedoom1.wad"),
        ("phase2", "phase2-debug", "freedoom2.wad"),
    ):
        prefix = f"/{phase}/"
        if path.startswith(prefix):
            relative = path[len(prefix):]
            return safe_file(BUILD_ROOT / variant, relative), phase
    if path.startswith("/p2-data/"):
        name = path.removeprefix("/p2-data/")
        mapping = {"freedoom1.wad": "phase1-debug", "freedoom2.wad": "phase2-debug"}
        variant = mapping.get(name)
        if variant is None:
            return None
        return safe_file(BUILD_ROOT / variant / "data", name), "data"
    return None


class Handler(BaseHTTPRequestHandler):
    server_version = "SFHS-P2-Loopback/1"

    def do_GET(self) -> None:  # noqa: N802
        request_path = unquote(urlsplit(self.path).path)
        state: ServerState = self.server.state  # type: ignore[attr-defined]
        if ".." in Path(request_path).parts:
            state.log({"path": request_path, "status": 403, "reason": "traversal"})
            self.send_error(403, "path traversal refused")
            return
        if request_path == "/health":
            body = b'{"status":"ok","loopback":true}\n'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            state.log({"path": request_path, "status": 200, "kind": "health"})
            return
        if request_path == "/favicon.ico":
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            state.log({"path": request_path, "status": 204, "kind": "optional-browser-request"})
            return
        resolved = route(request_path)
        if resolved is None or resolved[0] is None:
            state.log({"path": request_path, "status": 404, "reason": "not-found"})
            self.send_error(404, "not found")
            return
        file_path, kind = resolved
        try:
            body = file_path.read_bytes()
        except OSError:
            state.log({"path": request_path, "status": 404, "reason": "not-found"})
            self.send_error(404, "not found")
            return
        if file_path == SHELL:
            phase = kind
            body = body.replace(b"{{PHASE}}", phase.encode("ascii"))
        content_type = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".wasm": "application/wasm",
            ".wad": "application/octet-stream",
        }.get(file_path.suffix.lower(), mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        state.log({"path": request_path, "status": 200, "bytes": len(body), "kind": kind})

    def log_message(self, _format: str, *_args: object) -> None:
        return


def main() -> int:
    args = parse_args()
    if args.port < 0 or args.port > 65535:
        raise SystemExit("invalid port")
    args.ready_file.parent.mkdir(parents=True, exist_ok=True)
    args.log_file.parent.mkdir(parents=True, exist_ok=True)
    args.log_file.write_text("", encoding="utf-8")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.state = ServerState(args.log_file)  # type: ignore[attr-defined]
    host, port = server.server_address
    args.ready_file.write_text(json.dumps({"host": host, "port": port}) + "\n", encoding="utf-8")
    print(f"READY http://{host}:{port}", flush=True)

    def stop(_signum: int, _frame: object) -> None:
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    if args.shutdown_file is not None:
        def watch_shutdown() -> None:
            while True:
                if args.shutdown_file.exists():
                    stop(0, None)
                    return
                time.sleep(0.05)
        threading.Thread(target=watch_shutdown, daemon=True).start()
    try:
        server.serve_forever()
    finally:
        server.server_close()
        server.state.log({"event": "shutdown", "clean": True})  # type: ignore[attr-defined]
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
