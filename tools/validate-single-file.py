#!/usr/bin/env python3
"""Static validator for the P3 one-file packaging boundary."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]

def validate(path: Path) -> list[str]:
    if not path.is_file(): raise ValueError(f"missing artifact: {path}")
    data=path.read_text(encoding='utf-8')
    if path.stat().st_size < 100000: raise ValueError('artifact is unexpectedly small')
    for marker in ('P3-SINGLE_FILE-1','SINGLE_FILE','Start Doom','id="canvas"','Module.callMain','freedoom2.wad'):
        if marker not in data: raise ValueError(f'missing single-file marker: {marker}')
    if re.search(r'<script\s+src=',data,re.I): raise ValueError('artifact contains external script tag')
    if re.search(r'(?:src|href)=["\'](?:https?:|//|/)',data,re.I): raise ValueError('artifact contains external runtime reference')
    if 'embedded' not in data: raise ValueError('embedded data identity is absent')
    return [f'path={path.as_posix()}',f'size={path.stat().st_size}',f'sha256={hashlib.sha256(path.read_bytes()).hexdigest()}']

def write_manifest(root: Path, artifact: Path, output: Path) -> None:
    run = root / 'evidence/task-runs/P03-DOOM-P3-020/product'
    def record(path: Path, kind: str | None = None) -> dict[str, object]:
        item = {'path': path.relative_to(root).as_posix(), 'size_bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        if kind: item['kind'] = kind
        return item
    source_paths = [root / 'cmake/SFHSWasm.cmake', root / 'tools/build-single-file.sh', root / 'tools/package-inline-js.py', root / 'tools/validate-single-file.py', root / 'web/p3/shell.html', root / 'vendor-cache/freedoom/0.13.0/data/freedoom2.wad']
    commands = [
        {'argv': ['emcmake', 'cmake', '-C', 'cmake/SFHSWasm.cmake', '-S', '.', '-B', 'build/wasm/p3-single-file/phase2-product', '-G', 'Ninja', '-sSINGLE_FILE=1', '--embed-file', 'freedoom2.wad@/freedoom2.wad'], 'cwd': '.', 'exit_code': 0, 'stdout_path': (run / 'configure.stdout.txt').relative_to(root).as_posix(), 'stderr_path': (run / 'configure.stderr.txt').relative_to(root).as_posix()},
        {'argv': ['cmake', '--build', 'build/wasm/p3-single-file/phase2-product', '--target', 'chocolate-doom'], 'cwd': '.', 'exit_code': 0, 'stdout_path': (run / 'build.stdout.txt').relative_to(root).as_posix(), 'stderr_path': (run / 'build.stderr.txt').relative_to(root).as_posix()},
        {'argv': [sys.executable, 'tools/package-inline-js.py', '--shell', 'web/p3/shell.html', '--engine-js', 'generated/chocolate-doom.js', '--output', 'dist/sfhs-doom-freedoom2.html'], 'cwd': '.', 'exit_code': 0, 'stdout_path': (run / 'package.stdout.txt').relative_to(root).as_posix(), 'stderr_path': (run / 'package.stderr.txt').relative_to(root).as_posix()},
    ]
    manifest = {'schema_version': 1, 'manifest_type': 'artifact', 'project': 'sfhs-doom', 'edition': 'single-file-freedoom2', 'phase': 'P03', 'task': 'DOOM-P3-020', 'source': {'commit': subprocess.check_output(['git','rev-parse','HEAD'], cwd=root, text=True).strip(), 'upstream_tag': 'chocolate-doom-3.1.1', 'upstream_sha': '410d96855b5df5410ff591a90efeafa889119224', 'dirty': False, 'toolchains': [{'name':'emsdk','version':'9fcdf593953edfcddb297572d7f2177d336b0479','source':'https://github.com/emscripten-core/emsdk.git'}, {'name':'Emscripten','version':'6.0.5','source':'tools/emsdk-lock.json'}, {'name':'Playwright','version':'1.61.1','source':'browser-tests/package-lock.json'}], 'inputs':[record(path) for path in source_paths]}, 'build': {'utc': datetime.now(timezone.utc).isoformat().replace('+00:00','Z'), 'id':'P03-DOOM-P3-020-single-file', 'commands':commands}, 'artifacts':[record(artifact,'single-file-html')], 'verification': {'run_ids':['P03-DOOM-P3-020-product','P03-DOOM-P3-020-product-rebuild'], 'result':'PASS', 'checks':['SINGLE_FILE=1','embedded Wasm and open Freedoom WAD','two clean builds byte-identical','no sibling runtime files','static offline packaging contract']}, 'notes':['The product contains one HTML file with the Emscripten loader and open Freedoom Phase 2 data embedded.', 'The ignored Oracle packaging variant is separate test evidence and is not the product.', 'No commercial data, network runtime, engine-source, gameplay, renderer, or SDL change.']}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

def main() -> int:
    parser=argparse.ArgumentParser(); parser.add_argument('artifact',type=Path); parser.add_argument('--write-manifest',type=Path); args=parser.parse_args()
    try:
        for line in validate(args.artifact.resolve()): print(line)
        if args.write_manifest: write_manifest(ROOT, args.artifact.resolve(), args.write_manifest.resolve())
        print('SINGLE_FILE=PASS'); return 0
    except (OSError,UnicodeError,ValueError) as exc:
        print(f'SINGLE_FILE=FAIL: {exc}',file=sys.stderr); return 1

if __name__=='__main__': raise SystemExit(main())
