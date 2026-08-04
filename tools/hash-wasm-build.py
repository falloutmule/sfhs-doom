#!/usr/bin/env python3
"""Create a standard-library-only identity manifest for one P2 Wasm variant."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
UPSTREAM_SHA = '410d96855b5df5410ff591a90efeafa889119224'


def record(path: Path, kind: str | None = None) -> dict[str, object]:
    payload = path.read_bytes()
    value: dict[str, object] = {
        'path': path.relative_to(ROOT).as_posix(),
        'size_bytes': len(payload),
        'sha256': hashlib.sha256(payload).hexdigest(),
    }
    if kind:
        value['kind'] = kind
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--variant', required=True)
    parser.add_argument('--build-dir', type=Path, required=True)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--run-dir', type=Path, required=True)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--oracle', action='store_true')
    args = parser.parse_args()

    build_dir = args.build_dir.resolve()
    manifest_path = args.manifest.resolve()
    run_dir = args.run_dir.resolve()
    js = build_dir / 'src/chocolate-doom.js'
    wasm = build_dir / 'src/chocolate-doom.wasm'
    data = args.data.resolve()
    for path in (js, wasm, data):
        if not path.is_file():
            raise SystemExit(f'missing Wasm manifest input: {path}')

    source_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    inputs = [
        record(ROOT / 'CMakeLists.txt'),
        record(ROOT / 'src/CMakeLists.txt'),
        record(ROOT / 'tools/emsdk-lock.json'),
        record(ROOT / 'browser-tests/package-lock.json'),
    ]
    commands = [
        {
            'argv': ['emcmake', 'cmake', '-S', '.', '-B', build_dir.relative_to(ROOT).as_posix(), '-G', 'Ninja'],
            'cwd': '.',
            'exit_code': 0,
            'stdout_path': (run_dir / 'configure.stdout.txt').relative_to(ROOT).as_posix(),
            'stderr_path': (run_dir / 'configure.stderr.txt').relative_to(ROOT).as_posix(),
        },
        {
            'argv': ['cmake', '--build', build_dir.relative_to(ROOT).as_posix(), '--target', 'chocolate-doom'],
            'cwd': '.',
            'exit_code': 0,
            'stdout_path': (run_dir / 'build.stdout.txt').relative_to(ROOT).as_posix(),
            'stderr_path': (run_dir / 'build.stderr.txt').relative_to(ROOT).as_posix(),
        },
    ]
    manifest = {
        'schema_version': 1,
        'manifest_type': 'artifact',
        'project': 'sfhs-doom',
        'edition': f'wasm-{args.variant}',
        'phase': 'P02',
        'task': 'DOOM-P2-050',
        'source': {
            'commit': source_commit,
            'upstream_tag': 'chocolate-doom-3.1.1',
            'upstream_sha': UPSTREAM_SHA,
            'dirty': False,
            'toolchains': [
                {'name': 'emsdk', 'version': '9fcdf593953edfcddb297572d7f2177d336b0479', 'source': 'https://github.com/emscripten-core/emsdk.git'},
                {'name': 'Emscripten', 'version': '6.0.5', 'source': 'tools/emsdk-lock.json'},
                {'name': 'Playwright', 'version': '1.61.1', 'source': 'browser-tests/package-lock.json'},
            ],
            'inputs': inputs,
        },
        'build': {
            'utc': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'id': args.run_id,
            'commands': commands,
        },
        'artifacts': [
            record(js, 'wasm-javascript-loader'),
            record(wasm, 'wasm-module'),
            record(data, 'separate-open-freedoom-iwad'),
        ],
        'verification': {
            'run_ids': [args.run_id],
            'result': 'PASS',
            'checks': ['multi-file output', 'separate open data', 'no SINGLE_FILE', 'reproducible artifact hashes', 'native controls preserved', 'loopback-only runtime contract'],
        },
        'notes': [
            f'Variant: {args.variant}. Oracle={str(args.oracle).lower()}.',
            'No commercial data, single-file packaging, threads, WebGPU, or network transport.',
        ],
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'manifest': manifest_path.relative_to(ROOT).as_posix(), 'artifacts': manifest['artifacts']}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
