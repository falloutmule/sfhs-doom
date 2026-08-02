## DOOM-P0-070 — Define evidence, build identity, and artifact-manifest validation

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-060  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/EVIDENCE_POLICY.md`; `docs/BUILD_IDENTITY.md`; `evidence/**`; `tools/validate_artifact_manifest.py`; `tests/test_artifact_manifest.py`; `docs/results/P00/DOOM-P0-070.md`; `.agent/task-state.json`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Create an evidence contract that cryptographically binds a produced file to source commit, upstream base, inputs, commands, and verification result.

### Constraints

- SHA-256 is canonical.
- Explicit JSON schema fields; validator uses standard library only.
- Fixture proves mechanism; it is not a game artifact.
- No engine compilation, WAD download, browser test, or release build.
- Paths are repository-relative and cannot escape.
- Recompute size/hash from disk.

### Work

1. Start through `taskctl`.
2. Create `docs/EVIDENCE_POLICY.md` covering evidence labels, run IDs/directories, command capture, stdout/stderr/exit codes, screenshot/log privacy, commercial-data exclusions, SHA-256/size, stale evidence after source changes, checker expectations.
3. Create `docs/BUILD_IDENTITY.md` defining project/edition, phase/task, source commit, upstream tag/SHA, dirty flag, toolchains, input hashes, build UTC/ID, artifact path/bytes/hash, verification run IDs.
4. Create `evidence/README.md` and directories for manifests, fixtures, task runs, phase gates, screenshots, logs, reports.
5. Create `evidence/manifests/artifact-manifest.schema.json`.
6. Create a small text fixture and matching `evidence/manifests/fixture-artifact-manifest.json` bound to current source/upstream identity.
7. Implement validator to reject missing/unknown critical fields, absolute/escaping paths, malformed SHAs, wrong size/hash, duplicates, missing files, and tampering.
8. Add tests for valid manifest and all declared corruptions.
9. Write result, finish with `SELF`, commit:

```text
DOOM-P0-070 add evidence and artifact identity contract
```

10. Run `verify-head`.

### Exact verification

```bash
python -m unittest -v tests/test_artifact_manifest.py
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
python - <<'PY'
import json, subprocess, tempfile
from pathlib import Path
src = Path('evidence/manifests/fixture-artifact-manifest.json')
data = json.loads(src.read_text(encoding='utf-8'))
data['artifacts'][0]['sha256'] = '0' * 64
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / 'bad.json'
    p.write_text(json.dumps(data), encoding='utf-8')
    r = subprocess.run(['python','tools/validate_artifact_manifest.py',str(p)])
    assert r.returncode != 0
print('TAMPERED_MANIFEST_REJECTED PASS')
PY

python tools/taskctl.py validate
python tools/taskctl.py verify-head DOOM-P0-070
git status --short
```

### Acceptance

Policies explicit, valid fixture passes, corruption cases fail, standard library only, no engine/game artifact built, one clean commit.

### Evidence output

Policies, schema/fixture/validator/tests, and `docs/results/P00/DOOM-P0-070.md`.

### Stop/block conditions

Conflicting existing evidence policy, undefined critical manifest meaning, or need to execute untrusted commands/read outside repository.

### Commit

One local commit only. No remote action.
