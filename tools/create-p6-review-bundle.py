from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
INCLUDE = (
    'dist/sfhs-doom-android.html', 'web/p6/shell.html',
    'src/sfhs_mobile/sfhs_mobile_input.c', 'src/sfhs_mobile/sfhs_mobile_input.h',
    'src/sfhs_mobile/sfhs_mobile_state.c', 'src/sfhs_mobile/sfhs_mobile_state.h',
    'browser-tests/tests/p6-layout.spec.mjs', 'browser-tests/tests/p6-candidate.spec.mjs',
    'tests/test_p6_mobile_contract.py', 'tools/validate-p6-mobile.py',
)

def main() -> int:
    parser=argparse.ArgumentParser(); parser.add_argument('output',type=Path); args=parser.parse_args()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(args.output,'w',ZIP_DEFLATED) as archive:
        for item in INCLUDE:
            path=ROOT/item
            if not path.is_file(): raise SystemExit(f'missing bundle input: {item}')
            archive.write(path,item)
    print(f'P6_REVIEW_BUNDLE=PASS path={args.output} sha256={hashlib.sha256(args.output.read_bytes()).hexdigest()}')
    return 0

if __name__ == '__main__': raise SystemExit(main())
