#!/usr/bin/env python3
"""Validate the focused, limitation-aware P3 single-file gate."""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
P2_HEAD = '48b61cccea64ab2a4d29e3f293cbce142aee4de9'
P1_HEAD = '0c8e1288a23e7306fa5760c1aadbf54de8d0b85c'
UPSTREAM_URL = 'https://github.com/chocolate-doom/chocolate-doom.git'
SUBJECTS = [
    'DOOM-P3-000 install lean single-file packaging phase',
    'DOOM-P3-010 clean-rebuild single-file packaging inputs',
    'DOOM-P3-020 build strict offline single-file candidate',
    'DOOM-P3-030 prove single-file offline gameplay',
    'DOOM-P3-040 assemble lean single-file phase gate',
]

def git(root: Path, *args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=root, text=True, stderr=subprocess.STDOUT).strip()

def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding='utf-8'))

def browser_issues(path: Path, *, chromium: bool = False) -> list[str]:
    data = read_json(path)
    if not isinstance(data, dict): return [f'{path.name}: evidence is not an object']
    issues: list[str] = []
    if data.get('externalRequests') or data.get('failedRequests'): issues.append(f'{path.name}: external request recorded')
    if data.get('pageErrors'): issues.append(f'{path.name}: page error recorded')
    post = data.get('post', {})
    state = post.get('state', {}) if isinstance(post, dict) else {}
    if state.get('mainStarted') is not True or state.get('mainInvocations') != 1: issues.append(f'{path.name}: main did not start exactly once')
    if not isinstance(state.get('heartbeat'), int) or state.get('heartbeat', 0) <= 0: issues.append(f'{path.name}: heartbeat did not advance')
    if chromium:
        if state.get('audioContextState') != 'running': issues.append(f'{path.name}: Chromium audio is not running')
        if state.get('nonzeroPcmCallbacks', 0) <= 0: issues.append(f'{path.name}: Chromium non-zero engine PCM is absent')
    else:
        if state.get('audioCallbacks', 0) <= 0: issues.append(f'{path.name}: Firefox audio callbacks are absent')
    return issues

def oracle_issues(root: Path) -> list[str]:
    issues: list[str] = []
    control = read_json(root / 'evidence/task-runs/P03-DOOM-P3-030/chromium-oracle-control.json')
    movement = read_json(root / 'evidence/task-runs/P03-DOOM-P3-030/chromium-oracle-movement.json')
    a = control.get('checkpoint', {}) if isinstance(control, dict) else {}
    b = movement.get('checkpoint', {}) if isinstance(movement, dict) else {}
    for key in ('episode', 'map', 'skill', 'tic'):
        if a.get(key) != b.get(key): issues.append(f'Oracle checkpoint mismatch: {key}')
    if (a.get('x'), a.get('y')) == (b.get('x'), b.get('y')): issues.append('Oracle movement did not change raw position fields')
    for label, data in (('control', control), ('movement', movement)):
        if data.get('externalRequests') or data.get('pageErrors'): issues.append(f'Oracle {label}: runtime error/request evidence')
    return issues

def archive_issues(path: Path) -> list[str]:
    if not path.is_file(): return ['review bundle is missing']
    issues: list[str] = []
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)): issues.append('review bundle contains duplicate paths')
        for name in names:
            normalized = name.replace('\\', '/')
            parts = Path(normalized).parts
            if normalized.startswith('/') or any(part == '..' for part in parts): issues.append(f'unsafe archive path: {name}')
            if normalized.lower().endswith(('.wad', '.wasm', '.data')): issues.append(f'forbidden runtime/data file in bundle: {name}')
        if 'dist/sfhs-doom-freedoom2.html' not in names: issues.append('review bundle omits final product')
    return issues

class Gate:
    def __init__(self, root: Path): self.root = root; self.issues: list[str] = []
    def run(self) -> list[str]:
        try:
            branch = git(self.root, 'branch', '--show-current')
            if branch != 'phase/p03-single-file': self.issues.append(f'wrong branch: {branch}')
            if subprocess.run(['git', 'merge-base', '--is-ancestor', P2_HEAD, 'HEAD'], cwd=self.root).returncode != 0: self.issues.append('P2 HEAD is not an ancestor')
            if subprocess.run(['git', 'merge-base', '--is-ancestor', P1_HEAD, 'HEAD'], cwd=self.root).returncode != 0: self.issues.append('P1 HEAD is not an ancestor')
            remotes = git(self.root, 'remote', '-v').splitlines()
            if sorted(remotes) != sorted([f'upstream\t{UPSTREAM_URL} (fetch)', f'upstream\t{UPSTREAM_URL} (push)']) or any(line.startswith('origin\t') for line in remotes): self.issues.append('remote set is not official upstream only')
            task_state = read_json(self.root / '.agent/task-state.json')
            task_entries = {item.get('id'): item for item in task_state.get('tasks', []) if isinstance(item, dict)}
            expected_subjects = SUBJECTS[:4] if task_entries.get('DOOM-P3-040', {}).get('status') == 'running' else SUBJECTS
            commits = git(self.root, 'log', '--format=%s', f'{P2_HEAD}..HEAD').splitlines()
            if commits != expected_subjects[::-1]: self.issues.append(f'P3 commit subjects are not exactly the required candidate commits: {commits}')
        except (OSError, subprocess.CalledProcessError) as exc: self.issues.append(f'git identity failure: {exc}')

        try:
            state = read_json(self.root / '.agent/task-state.json')
            entries = {item.get('id'): item for item in state.get('tasks', []) if isinstance(item, dict)}
            if entries.get('DOOM-P3-040', {}).get('status') not in {'running', 'done'}: self.issues.append('P3-040 is not active or done')
            if entries.get('DOOM-P3-090', {}).get('status') != 'pending': self.issues.append('P3-090 is not pending')
            if entries.get('DOOM-P3-030', {}).get('status') != 'done': self.issues.append('P3-030 is not done')
        except (OSError, ValueError, KeyError) as exc: self.issues.append(f'task state failure: {exc}')

        try:
            sys.path.insert(0, str(self.root / 'tools'))
            from validate_artifact_manifest import ManifestValidator
            ManifestValidator(self.root).validate_file(self.root / 'evidence/manifests/P03/sfhs-doom-freedoom2.json')
        except Exception as exc: self.issues.append(f'P3 artifact manifest failed: {exc}')
        try:
            spec = importlib.util.spec_from_file_location('validate_single_file', self.root / 'tools/validate-single-file.py')
            if not spec or not spec.loader: raise RuntimeError('cannot load single-file validator')
            module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
            module.validate(self.root / 'dist/sfhs-doom-freedoom2.html')
        except Exception as exc: self.issues.append(f'single-file validation failed: {exc}')
        self.issues += browser_issues(self.root / 'evidence/task-runs/P03-DOOM-P3-030/chromium-product.json', chromium=True)
        self.issues += browser_issues(self.root / 'evidence/task-runs/P03-DOOM-P3-030/firefox-product.json')
        self.issues += oracle_issues(self.root)
        p2 = self.root / 'docs/phases/P02/PHASE_RESULT.md'
        if 'SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS' not in p2.read_text(encoding='utf-8'): self.issues.append('accepted P2 focused gate carry-forward is missing')
        self.issues += archive_issues(self.root / 'evidence/reports/P03/SFHS-DOOM-P3-REVIEW.zip')
        status = git(self.root, 'status', '--short')
        if status:
            task_state = read_json(self.root / '.agent/task-state.json')
            task_entries = {item.get('id'): item for item in task_state.get('tasks', []) if isinstance(item, dict)}
            if task_entries.get('DOOM-P3-040', {}).get('status') != 'running':
                self.issues.append('worktree is dirty after final gate')
            else:
                allowed = ('.agent/task-state.json', 'docs/', 'evidence/manifests/P03/', 'evidence/phase-gates/P03/', 'evidence/reports/P03/', 'evidence/logs/P03/P3-040/', 'evidence/task-runs/P03-DOOM-P3-040/', 'tests/test_p3_gate.py', 'tools/verify-p3-gate.py', 'tools/create-p3-review-bundle.py', 'dist/sfhs-doom-freedoom2.html')
                for line in status.splitlines():
                    path = line[2:].strip() if len(line) > 2 else line.strip()
                    if not path.startswith(allowed): self.issues.append(f'unrelated candidate change: {path}')
        return self.issues

def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument('--root', type=Path, default=ROOT); args = parser.parse_args()
    issues = Gate(args.root.resolve()).run()
    if issues:
        for issue in issues: print(f'P3_GATE_FAIL: {issue}')
        print('SFHS_DOOM_P3_SINGLE_FILE_GATE=FAIL'); return 1
    print('P2_ACCEPTED_GATE=PASS_WITH_RECORDED_LIMITATIONS')
    print('SFHS_DOOM_P3_SINGLE_FILE_GATE=PASS_WITH_RECORDED_LIMITATIONS'); return 0

if __name__ == '__main__': raise SystemExit(main())
