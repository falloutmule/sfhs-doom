#!/usr/bin/env python3
"""Create the path-safe P3 review ZIP without ignored runtime inputs."""
from __future__ import annotations
import argparse
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
P2_HEAD = '48b61cccea64ab2a4d29e3f293cbce142aee4de9'

def add_file(files: set[Path], root: Path, relative: str) -> None:
    path = root / relative
    if path.is_file(): files.add(path)
    elif path.is_dir(): files.update(item for item in path.rglob('*') if item.is_file())
    else: raise SystemExit(f'bundle input missing: {relative}')

def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument('--output', type=Path, required=True); args = parser.parse_args()
    root = ROOT; files: set[Path] = set()
    for relative in ('AGENTS.md', 'docs/PROJECT_SPEC.md', 'docs/phases/P03', 'docs/tasks/P03', 'docs/results/P03', 'docs/BUILD_IDENTITY.md', 'docs/COMPATIBILITY_MATRIX.md', 'docs/UPSTREAM_DELTA.md', 'docs/CURRENT_STATE.md', 'docs/ISSUE_LOG.md', 'docs/reports/P03_CLEAN_INPUT_BASELINE.md', 'docs/reports/P03_SINGLE_FILE_BUILD.md', 'docs/reports/P03_OFFLINE_RUNTIME.md', 'evidence/manifests/P03', 'evidence/phase-gates/P03', 'evidence/reports/P03', 'evidence/task-runs/P03-DOOM-P3-030', 'tests/test_p3_gate.py', 'tools/verify-p3-gate.py', 'tools/create-p3-review-bundle.py', 'dist/sfhs-doom-freedoom2.html'):
        add_file(files, root, relative)
    # Direct-file copies are redundant product duplicates and are excluded from the review ZIP.
    files = {path for path in files if path.relative_to(root).as_posix() not in {'evidence/reports/P03/SFHS-DOOM-P3-REVIEW.zip'} and not path.relative_to(root).as_posix().startswith('evidence/task-runs/P03-DOOM-P3-030/direct-file/')}
    for path_text in subprocess.check_output(['git', 'diff', '--name-only', f'{P2_HEAD}..HEAD'], cwd=root, text=True).splitlines():
        if path_text.startswith(('cmake/', 'tools/', 'web/', 'browser-tests/', 'tests/')):
            path = root / path_text
            if path.is_file(): files.add(path)
    metadata = {
        'commit-log.txt': subprocess.check_output(['git', 'log', '--format=fuller', f'{P2_HEAD}..HEAD'], cwd=root, text=True),
        'changed-files-and-stat.txt': subprocess.check_output(['git', 'diff', '--stat', f'{P2_HEAD}..HEAD'], cwd=root, text=True) + '\n' + subprocess.check_output(['git', 'diff', '--name-status', f'{P2_HEAD}..HEAD'], cwd=root, text=True),
        'audit.txt': '\n'.join([f'branch={subprocess.check_output(["git","branch","--show-current"],cwd=root,text=True).strip()}', f'head={subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()}', 'status=' + subprocess.check_output(['git','status','--short'],cwd=root,text=True), 'remotes=' + subprocess.check_output(['git','remote','-v'],cwd=root,text=True)])
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        names: set[str] = set()
        for path in sorted(files):
            name = path.relative_to(root).as_posix()
            if name in names or name.startswith('/') or '..' in Path(name).parts: raise SystemExit(f'unsafe duplicate bundle path: {name}')
            names.add(name); archive.write(path, name)
        for name, content in metadata.items():
            archive.writestr(name, content); names.add(name)
        archive.writestr('REVIEW_BUNDLE_CONTENTS.txt', '\n'.join(sorted(names)) + '\n')
    print(f'P3_REVIEW_BUNDLE=PASS path={args.output} files={len(names)}')
    return 0

if __name__ == '__main__': raise SystemExit(main())
