## DOOM-P0-060 — Create the license, notice, and source-compliance inventory

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-050  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/licenses/**`; `docs/results/P00/DOOM-P0-060.md`; `.agent/task-state.json`  
**Parallel:** No  
**Remote authorization:** read-only retrieval of official license/source metadata is allowed; no remote repository write

### Goal

Map license, notice, source, attribution, and trademark obligations for every planned distributed component without pretending to provide legal advice or pinning versions owned by later phases.

### Constraints

- Inspect actual license files or official project sources; do not rely on memory alone.
- Distinguish verified license text, inferred duty, proposed policy, and untested dependency.
- Do not import code/binaries or commercial data.
- Do not select an incompatible license for project code.
- Current preference is a GPL-compatible policy matching selected upstream unless legal review decides otherwise.
- Freedoom/Emscripten versions remain owned by P01/P02.

### Work

1. Start through `taskctl`.
2. Inspect selected Chocolate Doom license and representative source headers.
3. Inspect official license sources for Chocolate Doom, Freedoom, Emscripten output/toolchain components, actual SDL dependencies visible now, new SFHS bridge/launcher/build/test/docs, future test fixtures, and trademark/non-affiliation wording.
4. Create:
   - `docs/licenses/THIRD_PARTY_INVENTORY.md`
   - `docs/licenses/NOTICE_PLAN.md`
   - `docs/licenses/SOURCE_COMPLIANCE_CHECKLIST.md`
   - `docs/licenses/TRADEMARK_AND_NONAFFILIATION.md`
5. Every inventory row includes component, role, official source, inspected evidence, exact license identifier/title, modified/bundled status, notice/source duty, version-pinning phase, release location, confidence.
6. Do not mark verified without exact inspection.
7. Record legal interpretation questions as questions, not permissive assumptions.
8. Write result, finish with `SELF`, commit:

```text
DOOM-P0-060 map license and source compliance obligations
```

9. Run `verify-head`.

### Exact verification

```bash
python - <<'PY'
from pathlib import Path
files = [
 'docs/licenses/THIRD_PARTY_INVENTORY.md',
 'docs/licenses/NOTICE_PLAN.md',
 'docs/licenses/SOURCE_COMPLIANCE_CHECKLIST.md',
 'docs/licenses/TRADEMARK_AND_NONAFFILIATION.md',
]
for f in files:
    p = Path(f)
    assert p.is_file() and p.stat().st_size > 200, f
text = '\n'.join(Path(f).read_text(encoding='utf-8') for f in files).lower()
for item in ('chocolate doom','freedoom','emscripten','sdl','corresponding source','non-affiliation','verified','untested','commercial iwad'):
    assert item in text, item
print('LICENSE_INVENTORY_STRUCTURE PASS')
PY

python tools/taskctl.py validate
python tools/taskctl.py verify-head DOOM-P0-060
git status --short
```

### Acceptance

All component families mapped; exact sources recorded; engine/content licenses distinct; corresponding-source/notice duties visible; unknowns explicit; no imported code/binary/commercial data.

### Evidence output

Four license/compliance docs and `docs/results/P00/DOOM-P0-060.md`.

### Stop/block conditions

Unverifiable official source, material source conflict, unclear redistribution terms, or need for legal interpretation beyond conservative inventory.

### Commit

One local commit only. No remote action.
