# SFHS Doom — Frozen Phase P00 Plan and Luna Task Cards

**Document status:** FROZEN FOR EXECUTION  
**Date:** 2026-08-02  
**Planning authority:** ChatGPT Sol High  
**Project:** `sfhs-doom`  
**Accepted project specification:** `SFHS-DOOM-COMPLETE-PROJECT-SPEC-v1.0-ACCEPTED.md`  
**Accepted specification SHA-256:** `05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c`  
**Phase branch:** `phase/p00-governance`  
**Remote operations:** Forbidden until separately authorized for DOOM-P0-080

---

# Overall goal

Create a complete, legally distributable, vanilla-compatible Doom source port whose canonical releases are offline-capable single HTML files.

# Current goal

Create the clean repository, frozen governance documents, task machinery, licensing map, and evidence contracts needed for Luna to execute later phases from one task ID without changing Chocolate Doom behavior.

# Plain-language summary

Phase P00 builds the workshop before anyone modifies the engine. It establishes the correct upstream base, writes down the rules, creates small task cards, adds a local task tracker, maps the licensing obligations, and proves that evidence can be tied to a real commit and file hash.

It does **not** compile, port, redesign, modernize, or “improve” Doom.

---

# 1. Decision freeze

The user accepted all four previously unresolved assumptions on 2026-08-02:

| ADR | Accepted decision |
|---|---|
| ADR-011 | Android Chrome on the user’s Samsung phone is a release target and requires physical verification. |
| ADR-012 | Gameplay is landscape-first; the launcher remains usable in portrait; orientation lock is optional. |
| ADR-013 | Desktop Chromium and Firefox are release gates; iOS Safari is best-effort. |
| ADR-014 | Luna in Codex is the default implementation worker; an offline model is optional and not critical-path. |

ADR-010 remains the reversible phase default: one source-modifying Luna worker at a time, with an optional read-only checker.

---

# 2. Verified current state

## Verified

- The accepted v1.0 specification exists outside the repository.
- DOOM-P0-001 is complete at the planning level.
- No SFHS Doom repository, source pin, native build, Wasm build, or HTML artifact has been verified yet.
- No commercial IWAD has been requested or inspected.
- No remote creation, push, PR, merge, or publication is authorized by this plan alone.

## Proposed and not yet verified

- The official Chocolate Doom stable release selected during DOOM-P0-010 will provide the correct build base.
- The local task helper and document validators described here will work as designed.
- A user-owned remote and draft PR workflow will be available when DOOM-P0-080 is reached.

## Current blocker

There is no technical blocker. Execution needs an authorized clean project workspace. Remote writes remain separately unauthorized.

---

# 3. Phase boundary

## In scope

- Establish a clean local working repository from official Chocolate Doom source.
- Pin and record one official stable upstream release commit.
- Install the accepted project specification and decision record.
- Install root repository instructions and planning/task/result templates.
- Implement a small standard-library-only task-state helper.
- Inventory third-party licensing and source/notice obligations.
- Define evidence directories, build identity, SHA-256 policy, and a validated fixture manifest.
- Prove the serial one-task/one-commit phase workflow.
- Create one draft phase PR only after explicit remote authorization.
- Run one independent Sol phase gate.

## Out of scope

- Any engine, renderer, gameplay, timing, input, audio, save, WAD, or network behavior change.
- Native or Emscripten compilation.
- Downloading or embedding commercial Doom data.
- Downloading Freedoom content except read-only license inspection if needed.
- Selecting the Emscripten version; Phase P02 owns that pin.
- Building the native oracle; Phase P01 owns that work.
- Browser shell or single-file packaging.
- Multiplayer.
- Any remote operation before the explicit DOOM-P0-080 authorization.

---

# 4. Source-of-truth order

After DOOM-P0-030:

```text
AGENTS.md
-> docs/PROJECT_SPEC.md
-> docs/CURRENT_STATE.md
-> docs/phases/P00/PHASE_PLAN.md
-> docs/tasks/P00/<TASK-ID>.md
-> relevant files and tests
```

Before `AGENTS.md` exists, DOOM-P0-010 through DOOM-P0-030 use the accepted specification plus this document as the temporary authority.

---

# 5. Non-negotiable invariants

1. Upstream engine behavior remains untouched during P00.
2. Unknown or unrelated working-tree changes cause a blocker; they are never destroyed or hidden.
3. No task uses `git reset --hard`, `git clean`, broad restore, destructive checkout, broad stash, amend, or force push.
4. No commercial IWAD, PWAD, DeHackEd patch, demo, screenshot, or proprietary lump enters the repository.
5. No source-modifying workers run in parallel.
6. Every passing Luna task creates one coherent commit whose subject begins with its task ID.
7. A blocked task records exact evidence and does not claim completion.
8. No remote creation, remote mutation, push, PR, or merge occurs unless the user explicitly authorizes that exact action.
9. Generated release files do not exist in P00 and are never edited as source.
10. Results distinguish verified, inferred, proposed, and untested facts.

---

# 6. Self-referential commit convention

A report cannot contain the SHA of the same commit that contains the report. P00 therefore establishes this exact convention:

- `Result commit: SELF` means “the commit containing this report.”
- `Candidate commit: SELF` means “the phase-head commit containing this phase result.”
- The actual SHA is proven after commit by `git rev-parse HEAD`, the task handoff, task-state verification, and, when applicable, the draft PR head.
- Workers must not amend a commit merely to replace `SELF` with its SHA.

---

# 7. Task graph

```text
DOOM-P0-001  accepted decisions and Sol freeze              PASS
      |
DOOM-P0-010  clean upstream repository and phase branch
      |
DOOM-P0-020  install specification, decisions, state docs, plan, cards
      |
DOOM-P0-030  install root AGENTS.md
      |
DOOM-P0-040  install PLANS.md, templates, and document validator
      |
DOOM-P0-050  implement taskctl and task state
      |
DOOM-P0-060  license and notice inventory
      |
DOOM-P0-070  evidence, build identity, manifest schema, validator
      |
DOOM-P0-080  phase result, authorized push, one draft PR
      |
DOOM-P0-090  independent Sol gate; no repair
```

| Task | Intelligence | Dependency | Remote | Expected change |
|---|---|---|---|---|
| DOOM-P0-001 | SOL-H | none | none | Planning freeze only; complete |
| DOOM-P0-010 | LUNA-L | P0-001 | forbidden | Git base plus baseline/result documentation |
| DOOM-P0-020 | LUNA-L | P0-010 | forbidden | Authoritative docs and task cards |
| DOOM-P0-030 | LUNA-L | P0-020 | forbidden | Root `AGENTS.md` |
| DOOM-P0-040 | LUNA-L | P0-030 | forbidden | Planning/result templates and validator |
| DOOM-P0-050 | LUNA-M | P0-040 | forbidden | `taskctl.py`, tracked task state, tests |
| DOOM-P0-060 | LUNA-L | P0-050 | read-only fetch permitted | License/notice documentation |
| DOOM-P0-070 | LUNA-L | P0-060 | forbidden | Evidence policy, manifest schema/validator/tests |
| DOOM-P0-080 | LUNA-L + HUMAN AUTH | P0-070 | push + one draft PR only | Phase result and PR evidence |
| DOOM-P0-090 | SOL-GATE | P0-080 | read-only | Gate verdict and P01 plan on PASS |

---

# 8. Minimal handoffs

## First Luna run: bootstrap exception

Attach this document and the accepted specification to Codex, open a clean authorized project workspace, and send:

```text
Execute DOOM-P0-010 from the attached SFHS Doom Phase P0 plan. Perform no remote creation, push, or PR action. Stop on any unsafe repository condition.
```

## DOOM-P0-020

```text
Execute DOOM-P0-020 from the attached Phase P0 plan. Perform no remote action. Preserve the accepted specification exactly and stop on any unrelated working-tree change.
```

## DOOM-P0-030

```text
Execute DOOM-P0-030 from its repository task card. This task creates AGENTS.md, so use the task card and Phase P00 plan as the authority. Perform no remote action.
```

## Ordinary Luna runs after DOOM-P0-030

```text
Execute <TASK-ID>. Follow AGENTS.md and the task card. Stay within scope, run the exact verification, commit only on PASS, and stop with an evidenced blocker rather than redesigning.
```

## Remote authorization for DOOM-P0-080

This exact authority must be supplied when the task is reached:

```text
Authorize DOOM-P0-080 to push branch phase/p00-governance to the already configured user-owned origin and create one draft PR targeting the repository default branch. Do not merge, force-push, alter other branches, or publish a release.
```

## Sol gate

```text
Review Phase P00 on the draft PR against docs/PROJECT_SPEC.md and docs/phases/P00/PHASE_RESULT.md. Inspect the actual diff, rerun or verify the declared checks, and return the DOOM-P0-090 gate verdict. Do not repair. On PASS, author the exact Phase P01 plan and Luna task cards; do not implement them.
```

---

# 9. Phase-wide verification

At the P00 candidate head, all of the following must succeed:

```bash
python tools/validate_project_docs.py --all
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/taskctl.py validate
python tools/taskctl.py status
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
```

The candidate must also prove:

```bash
git status --short
git log --oneline --decorate --no-merges <UPSTREAM_BASE_SHA>..HEAD
git diff --name-only <UPSTREAM_BASE_SHA>...HEAD
```

The changed-file list must contain only governance, documentation, task tooling, tests, and evidence fixtures explicitly permitted by P00. Any engine-source path is a phase failure.

---

# 10. Exit gate

P00 passes only when:

- the working repository descends from one recorded official Chocolate Doom stable release commit;
- the branch is `phase/p00-governance`;
- the accepted v1.0 specification is installed without silent rewriting;
- decisions ADR-011 through ADR-014 are recorded as accepted;
- a new worker can determine goal, scope, commands, prohibited actions, and report location from `AGENTS.md` plus one task card;
- templates and task cards pass structural validation;
- `taskctl.py` passes fixture and real-state validation;
- licensing and notice obligations are mapped with evidence and unknowns labeled;
- a fixture artifact manifest recomputes its SHA-256 and rejects tampering;
- one task maps to one coherent commit, with the `SELF` convention used correctly;
- one authorized draft phase PR exists;
- no engine behavior or source file was changed;
- the independent Sol checker returns PASS.

---

# 11. Task cards

## DOOM-P0-001 — Freeze the project contract and Phase P00

**Intelligence:** SOL-H  
**Phase:** P00  
**Status:** PASS at planning level  
**Depends on:** none  
**Branch:** none yet  
**Allowed files/directories:** planning artifacts outside the repository  
**Parallel:** No

### Goal

Resolve the four open platform/model decisions and produce an authoritative v1.0 project specification plus a repository-ready P00 plan and Luna cards.

### Accepted decisions

The user replied “accept all four” on 2026-08-02, accepting ADR-011 through ADR-014.

### Work completed

- Updated the specification to accepted authoritative v1.0.
- Recorded the accepted ADR statuses.
- Removed the external decision blocker.
- Authored this exact P00 plan and bounded task cards.
- Defined the bootstrap exception, normal one-line Luna handoff, remote authorization boundary, and Sol gate prompt.

### Verification

- The accepted specification exists and has a recorded SHA-256.
- This P00 document contains cards DOOM-P0-001 through DOOM-P0-090.
- No repository, source, remote, build, or product system was changed.

### Acceptance

PASS. Repository materialization is owned by DOOM-P0-010 and DOOM-P0-020.

### Evidence output

- `SFHS-DOOM-COMPLETE-PROJECT-SPEC-v1.0-ACCEPTED.md`
- `SFHS-DOOM-P0-PLAN-AND-LUNA-CARDS.md`

### Commit

No repository commit exists for this planning task. DOOM-P0-020 materializes its decision and result records.

---

## DOOM-P0-010 — Establish the clean Chocolate Doom repository base

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-001  
**Branch:** create/use `phase/p00-governance`  
**Allowed files/directories:** Git metadata in the authorized workspace; `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md`  
**Parallel:** No  
**Remote authorization:** NONE; clone/fetch from official upstream is allowed, but remote creation, remote mutation, push, PR, and merge are forbidden

### Goal

Create a clean local working repository that descends from one unambiguous official Chocolate Doom stable release commit, without changing engine behavior.

### Context

This is the bootstrap exception. `AGENTS.md` and repository task cards do not exist yet. The attached accepted specification, this P00 plan, and this card are the authority.

### Constraints

- Work only in the user-authorized project workspace.
- Do not overwrite or absorb an unrelated repository.
- Do not destroy, stash, reset, clean, or restore unknown changes.
- Do not modify any upstream source or build file.
- Do not create a GitHub fork/repository, alter a remote, push, or open a PR.
- Do not choose an unreleased branch tip when an official stable release exists.
- If official release metadata is unavailable or ambiguous, block for Sol rather than guessing.

### Work

1. Record `pwd`, directory listing, Git presence, current branch/HEAD, remotes, and `git status --short` before making changes.
2. If the workspace contains unrelated files, unrelated Git history, or user changes, stop with a blocker.
3. If the workspace is empty and not a Git repository, clone the official Chocolate Doom repository into the current authorized directory.
4. Normalize remotes without changing remote URLs silently:
   - preserve a user-owned `origin` if already configured;
   - ensure official Chocolate Doom is available as `upstream`;
   - if `origin` points to official Chocolate Doom and no user-owned origin exists, rename it to `upstream` rather than inventing a user remote.
5. Fetch official tags and resolve the latest official non-draft, non-prerelease release tag using official release metadata. Record the tag, full commit SHA, release identifier, and exact resolution command.
6. If a pre-existing project base is already explicitly recorded and differs, block rather than rebasing it silently.
7. Create `phase/p00-governance` from the selected upstream commit.
8. Write `docs/bootstrap/REPOSITORY_BASELINE.md` containing official upstream URL, selected tag/SHA, selection method/time, branch/remote map, clean-state evidence, zero-engine-delta statement, and unverified items.
9. Write `docs/results/P00/DOOM-P0-010.md` using `Result commit: SELF`.
10. Commit only those two files with:

```text
DOOM-P0-010 establish clean upstream repository base
```

### Exact verification

```bash
test "$(git branch --show-current)" = "phase/p00-governance"
git rev-parse --verify HEAD
git rev-parse --verify "$UPSTREAM_BASE_SHA"
git merge-base --is-ancestor "$UPSTREAM_BASE_SHA" HEAD
git remote -v
git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git status --short
```

The final diff from upstream base must list only:

```text
docs/bootstrap/REPOSITORY_BASELINE.md
docs/results/P00/DOOM-P0-010.md
```

### Acceptance

- Official upstream identity is directly verified.
- One stable release tag and full source commit are pinned.
- The phase branch descends from that exact commit.
- No engine or upstream build file differs from base.
- No remote write occurred.
- One coherent task commit exists and the worktree is clean.

### Evidence output

- `docs/bootstrap/REPOSITORY_BASELINE.md`
- `docs/results/P00/DOOM-P0-010.md`
- exact command output embedded in the result

### Stop/block conditions

Stop for nonempty unrelated workspace, dirty user work, official identity mismatch, ambiguous release metadata, unavailable verification network, divergent phase branch, or any required history/remote rewrite.

### Commit

One local commit only. No amend, push, force, or PR.

---

## DOOM-P0-020 — Install the authoritative specification and governance documents

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-010  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/PROJECT_SPEC.md`; `docs/DECISIONS.md`; `docs/CURRENT_STATE.md`; `docs/UPSTREAM_DELTA.md`; `docs/COMPATIBILITY_MATRIX.md`; `docs/ISSUE_LOG.md`; `docs/phases/P00/**`; `docs/tasks/P00/**`; `docs/results/P00/DOOM-P0-001.md`; `docs/results/P00/DOOM-P0-020.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Install the accepted v1.0 specification and complete P00 repository memory so later workers do not depend on chat history.

### Context

Accepted specification SHA-256:

```text
05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c
```

Do not paraphrase or redesign it during installation.

### Constraints

- Do not modify engine source, upstream build files, or upstream documentation.
- Do not silently “correct” or broaden the accepted specification.
- Preserve the exact accepted product boundary.
- Do not claim any build, toolchain, browser, content, or compatibility result that has not happened.
- Do not perform remote operations.

### Work

1. Verify branch, HEAD, clean tree, and DOOM-P0-010 result.
2. Install the supplied accepted file as `docs/PROJECT_SPEC.md`.
3. Install this plan as `docs/phases/P00/PHASE_PLAN.md` and split all P00 task cards into `docs/tasks/P00/DOOM-P0-*.md`.
4. Create `docs/DECISIONS.md` with the complete ADR table and explicit acceptance of ADR-011 through ADR-014 dated 2026-08-02. Preserve ADR-010 as reversible.
5. Create `docs/CURRENT_STATE.md` containing only verified reality: P0-001/P0-010 complete, upstream tag/SHA/branch, no builds, no commercial data, no remote action, next task P0-030.
6. Create `docs/UPSTREAM_DELTA.md` with zero engine delta and a future-entry schema: task, commit, paths, reason, native effect, Wasm effect, tests, disposition.
7. Create `docs/COMPATIBILITY_MATRIX.md` as a non-claiming skeleton. Mark every runtime row `UNTESTED`.
8. Create `docs/ISSUE_LOG.md` with issue fields and state that no product issue has yet been observed.
9. Create `docs/results/P00/DOOM-P0-001.md` and `docs/results/P00/DOOM-P0-020.md`; use `Result commit: SELF` for P0-020.
10. Commit:

```text
DOOM-P0-020 install authoritative project and phase documents
```

### Exact verification

```bash
python - <<'PY'
from pathlib import Path
import hashlib
p = Path('docs/PROJECT_SPEC.md')
assert p.exists()
assert hashlib.sha256(p.read_bytes()).hexdigest() == '05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c'
required = [
 'docs/DECISIONS.md', 'docs/CURRENT_STATE.md', 'docs/UPSTREAM_DELTA.md',
 'docs/COMPATIBILITY_MATRIX.md', 'docs/ISSUE_LOG.md',
 'docs/phases/P00/PHASE_PLAN.md',
 *[f'docs/tasks/P00/DOOM-P0-{n}.md' for n in ('001','010','020','030','040','050','060','070','080','090')],
 'docs/results/P00/DOOM-P0-001.md', 'docs/results/P00/DOOM-P0-020.md',
]
for item in required:
    assert Path(item).is_file(), item
text = Path('docs/DECISIONS.md').read_text(encoding='utf-8')
for adr in ('ADR-011','ADR-012','ADR-013','ADR-014'):
    assert adr in text and 'Accepted' in text
print('P0_DOCUMENT_INSTALL PASS')
PY

git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git status --short
```

### Acceptance

- Specification byte hash matches.
- All required P00 documents/cards exist.
- Accepted decisions are explicit.
- Current-state and compatibility docs make no untested success claims.
- Upstream engine delta remains zero.
- One local commit exists; no remote write occurred.

### Evidence output

- `docs/results/P00/DOOM-P0-020.md`
- installed authoritative documents

### Stop/block conditions

Stop for hash mismatch, missing baseline, existing user work that would be overwritten, card/spec conflict, or any engine-source modification.

### Commit

One local commit only. No amend or remote action.

---

## DOOM-P0-030 — Install the root AGENTS.md contract

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-020  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `AGENTS.md`; `docs/results/P00/DOOM-P0-030.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Create concise root instructions that let a fresh Codex/Luna thread identify the goal, source of truth, workflow, prohibited actions, verification duty, and blocker protocol without historical chat.

### Context

This task creates `AGENTS.md`; the Phase P00 plan and this card are the authority for this run.

### Constraints

- Keep it operational, not encyclopedic.
- Do not duplicate the whole specification.
- Do not weaken compatibility, evidence, Git safety, commercial-data, or remote rules.
- If a root `AGENTS.md` already exists and is not this project’s contract, block instead of overwriting it.

### Work

Create `AGENTS.md` with required headings:

1. Project goal
2. Current phase/current goal
3. Source-of-truth read order
4. Compatibility invariant
5. Task execution protocol
6. Allowed/forbidden Git operations
7. Commercial data/privacy rule
8. Build/test/evidence rule
9. Generated artifact rule
10. Issue/blocker protocol
11. Remote operation boundary
12. Required result/commit format

It must explicitly state Chocolate Doom is authoritative, no modernization/JS rewrite, one writer by default, read card first, edit only allowed paths, no commercial WAD bytes, no required runtime network dependency, no generated-dist editing, exact verification/evidence, unknown changes block, destructive Git operations forbidden, remote writes require exact authority, commit subject starts with task ID, and result uses `SELF`.

Write the result and commit:

```text
DOOM-P0-030 install repository agent contract
```

### Exact verification

```bash
python - <<'PY'
from pathlib import Path
p = Path('AGENTS.md')
assert p.is_file()
t = p.read_text(encoding='utf-8').lower()
required = [
 'project goal', 'current phase', 'source-of-truth', 'compatibility invariant',
 'task execution', 'git', 'commercial', 'evidence', 'generated', 'blocker',
 'remote', 'self', 'docs/project_spec.md', 'docs/current_state.md',
 'docs/phases/p00/phase_plan.md', 'docs/tasks/p00/'
]
missing = [x for x in required if x not in t]
assert not missing, missing
for forbidden in ('git reset --hard', 'git clean', 'force push'):
    assert forbidden in t, forbidden
print('AGENTS_CONTRACT PASS')
PY

git diff --name-only HEAD~1..HEAD
git status --short
```

The result must answer, from only `AGENTS.md` and this card: project, phase, conflict authority, whether engine may change, whether commercial data may be committed, whether push is allowed, permitted files, completion proof, blocker conditions, and `SELF` meaning.

### Acceptance

- All required sections exist.
- Fresh-context questions are unambiguous.
- No project scope/source changed.
- One local commit exists and tree is clean.

### Evidence output

- `AGENTS.md`
- `docs/results/P00/DOOM-P0-030.md`

### Stop/block conditions

Existing root instructions, material spec/plan conflict, or unresolved architecture needed to write the contract.

### Commit

One local commit only. No remote action.

---

## DOOM-P0-040 — Install planning, task, result, and blocker templates

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-030  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `.agent/PLANS.md`; `docs/templates/**`; `tools/validate_project_docs.py`; `tests/test_project_docs.py`; `docs/results/P00/DOOM-P0-040.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Create stable, machine-checkable Markdown contracts for phase plans, task cards, task results, phase results, blockers, and gate verdicts.

### Constraints

- Python standard library only.
- Validation checks structure; it does not prove implementation correctness.
- Templates remain readable Markdown.
- Do not weaken cards to satisfy the validator.
- Do not touch engine source.

### Work

1. Create `.agent/PLANS.md` covering Sol plan ownership, self-contained phases, repeated assumptions/ADRs, exit evidence, update-on-reality-change, planning-only no implementation, and checker no-repair.
2. Create:
   - `docs/templates/PHASE_PLAN.md`
   - `docs/templates/TASK.md`
   - `docs/templates/TASK_RESULT.md`
   - `docs/templates/PHASE_RESULT.md`
   - `docs/templates/BLOCKER.md`
   - `docs/templates/GATE_VERDICT.md`
3. Include intelligence, dependency, allowed-path, remote-authorization, exact-verification, acceptance, evidence, blocker, commit, and current-state fields where applicable.
4. Document `SELF` in result templates.
5. Implement `tools/validate_project_docs.py` supporting `--templates`, `--task <path>`, `--phase <path>`, and `--all`.
6. Validator returns nonzero with precise missing-field messages.
7. Add valid/invalid temporary-fixture tests.
8. Write result and commit:

```text
DOOM-P0-040 add planning and evidence document contracts
```

### Exact verification

```bash
python tools/validate_project_docs.py --templates
python tools/validate_project_docs.py --phase docs/phases/P00/PHASE_PLAN.md
for f in docs/tasks/P00/DOOM-P0-*.md; do python tools/validate_project_docs.py --task "$f"; done
python -m unittest -v tests/test_project_docs.py
python - <<'PY'
import subprocess, tempfile
from pathlib import Path
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / 'bad.md'
    p.write_text('# incomplete\n', encoding='utf-8')
    r = subprocess.run(['python','tools/validate_project_docs.py','--task',str(p)])
    assert r.returncode != 0
print('INVALID_FIXTURE_REJECTED PASS')
PY

git status --short
```

### Acceptance

All templates/cards validate, invalid fixture fails usefully, standard library only, one clean commit, no source change.

### Evidence output

- validator output
- `docs/results/P00/DOOM-P0-040.md`

### Stop/block conditions

Incompatible existing schema, accepted card semantics would need changing, or a third-party dependency appears necessary.

### Commit

One local commit only. No remote action.

---

## DOOM-P0-050 — Implement the minimal local task-state helper

**Intelligence:** LUNA-M  
**Phase:** P00  
**Depends on:** DOOM-P0-040  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `tools/taskctl.py`; `.agent/task-state.json`; `tests/test_taskctl.py`; `tests/fixtures/taskctl/**`; `docs/results/P00/DOOM-P0-050.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Implement a small deterministic helper that shows, starts, finishes, blocks, validates, and reports task state without becoming an orchestrator or pretending tests passed.

### Constraints

- Python standard library only.
- No daemon, scheduler, model invocation, GitHub API, network, database, or background process.
- Task cards remain authoritative.
- Preserve unknown fields.
- Never run arbitrary commands from task data.
- Do not mark done unless dependencies are done, branch matches, result exists, and commit identity is supplied.
- Accept `SELF` as the exact pending-containing-commit sentinel.

### Work

Implement:

```text
python tools/taskctl.py status
python tools/taskctl.py show DOOM-Px-yyy
python tools/taskctl.py start DOOM-Px-yyy
python tools/taskctl.py finish DOOM-Px-yyy --commit <sha|SELF>
python tools/taskctl.py block DOOM-Px-yyy --report <path>
python tools/taskctl.py validate
python tools/taskctl.py verify-head DOOM-Px-yyy
```

Required behavior:

1. Read `.agent/task-state.json` and recorded task-card paths.
2. Validate unique IDs, known statuses, dependencies, acyclic graph, card existence, branch contract, result path.
3. Compute ready from dependencies while preserving explicit blocked state.
4. `show` prints status, dependencies, card, allowed paths, legal transitions.
5. `start` refuses wrong branch, unmet dependencies, invalid state, or dirty out-of-scope changes; records start time/base HEAD.
6. `finish` requires running state, result file, task-owned staged changes, and commit token; records done but does not create commit.
7. `block` requires a blocker report and never claims completion.
8. `verify-head` confirms HEAD subject begins with task ID and result exists; resolves `SELF` to HEAD.
9. Initialize real P00 state with P0-001 through P0-040 done, P0-050 completed via `SELF`, and later tasks pending/ready.
10. Use atomic state writes.
11. Add temporary-repository tests for lifecycle, unmet dependency, wrong branch, missing report, block, cycle, `SELF`, verify-head, dirty out-of-scope path.
12. Write result, run `finish ... --commit SELF`, commit:

```text
DOOM-P0-050 add bounded local task-state helper
```

Then run `verify-head`.

### Exact verification

```bash
python -m unittest -v tests/test_taskctl.py
python tools/taskctl.py validate
python tools/taskctl.py status
python tools/taskctl.py show DOOM-P0-060
python tools/taskctl.py verify-head DOOM-P0-050
git status --short
```

Tests must fail for cycle, wrong branch, missing result, invalid finish state, unknown task, invalid commit token, and dirty out-of-scope path.

### Acceptance

All commands work, real P00 state validates, `SELF` avoids amend/two commits, helper does not claim product correctness, one clean commit.

### Evidence output

- `docs/results/P00/DOOM-P0-050.md`
- unit-test and real-status output

### Stop/block conditions

Unsafe Git inspection, ambiguous allowed-path syntax, third-party dependency requirement, or unreconcilable earlier task history.

### Commit

One local commit only. No remote action.

---

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

---

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

---

## DOOM-P0-080 — Produce the P00 phase candidate and one authorized draft PR

**Intelligence:** LUNA-L + HUMAN AUTHORIZATION  
**Phase:** P00  
**Depends on:** DOOM-P0-070  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/phases/P00/PHASE_RESULT.md`; `docs/CURRENT_STATE.md`; `docs/results/P00/DOOM-P0-080.md`; `evidence/phase-gates/P00/**`; `.agent/task-state.json`  
**Parallel:** No  
**Remote authorization:** REQUIRED; push this phase branch and create one draft PR only; no merge, force, release, issue creation, or other branch change

### Goal

Prove the complete serial P00 workflow, produce one phase result bound to actual branch/evidence, and expose the candidate in one draft PR for independent Sol review.

### Required human authorization

Do not start until the user supplies:

```text
Authorize DOOM-P0-080 to push branch phase/p00-governance to the already configured user-owned origin and create one draft PR targeting the repository default branch. Do not merge, force-push, alter other branches, or publish a release.
```

### Constraints

- Write remote must be user-owned, not official Chocolate Doom.
- No force push, merge, auto-merge, source modification, per-task PRs, or fake local PR substitute.
- P00 checks must pass before push.

### Work

1. Verify authorization, branch, clean tree, upstream base, user-owned origin, auth, and default target branch.
2. Start through `taskctl`.
3. Rerun all P00 checks.
4. Prove changed paths contain no engine/upstream build file.
5. Verify one coherent task commit for P0-010 through P0-070 with correct prefixes.
6. Create `docs/phases/P00/PHASE_RESULT.md` with `Candidate commit: SELF`, upstream base, task table, actual architecture, exact verification, zero engine delta, license/evidence summary, deviations/failures, exact state, remote authorization, proposed P01 assumptions without implementation.
7. Update `docs/CURRENT_STATE.md` to “P00 candidate ready for gate,” not accepted.
8. Write result, finish with `SELF`, commit:

```text
DOOM-P0-080 prepare P00 gate candidate and draft PR
```

9. Verify HEAD/clean state.
10. Push only `phase/p00-governance` without force.
11. Create exactly one draft PR targeting default branch titled:

```text
[P00] SFHS Doom governance and task infrastructure
```

12. PR body includes goal, base, head SHA, changed paths, exact checks, zero-engine-delta claim, limitations, phase-result path, request for P0-090 review.
13. Do not amend to add post-commit PR metadata; return PR JSON in the handoff.

### Exact verification

Before push:

```bash
python tools/validate_project_docs.py --all
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/taskctl.py validate
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git log --format='%h %s' "$UPSTREAM_BASE_SHA"..HEAD
git status --short
```

After push/PR:

```bash
git rev-parse HEAD
git ls-remote --heads origin phase/p00-governance
gh pr view --json number,url,isDraft,state,baseRefName,headRefName,headRefOid,title
```

Required: draft/open, correct branch, remote head equals local HEAD, target is default branch, exactly one open P00 PR.

### Acceptance

All local checks pass, no engine changes, phase result exists but does not self-approve, one task commit, branch pushed without force, exactly one matching draft PR, local/remote head match, no merge/publication.

### Evidence output

- `docs/phases/P00/PHASE_RESULT.md`
- `docs/results/P00/DOOM-P0-080.md`
- full check output
- PR URL/number/head SHA and `gh pr view` JSON

### Stop/block conditions

Missing remote authority, bad/missing origin, auth failure, conflicting PR/branch, failing check, engine change, SHA mismatch, or force/history rewrite requirement.

### Commit

One local commit before push. No amend, merge, or force.

---

## DOOM-P0-090 — Independent Sol gate for Phase P00

**Intelligence:** SOL-GATE  
**Phase:** P00  
**Depends on:** DOOM-P0-080  
**Branch:** review `phase/p00-governance` and its draft PR  
**Allowed files/directories:** read-only repository/PR inspection; gate-verdict Markdown output outside branch unless separately authorized  
**Parallel:** No source modification  
**Remote authorization:** read-only

### Goal

Determine whether P00 actually created a safe minimal-handoff repository with zero engine behavior change.

### Inputs

`docs/PROJECT_SPEC.md`, `AGENTS.md`, `CURRENT_STATE`, P00 plan/result/cards/results, upstream base, draft PR, deterministic outputs, task state, licensing, evidence, manifest.

### Review duties

1. Inspect actual PR diff/commit range.
2. Confirm official stable upstream base ancestry.
3. Confirm no engine/source/build behavior file changed.
4. Read `AGENTS.md` as a fresh worker and test the one-sentence handoff claim.
5. Inspect cards for bounded scope, exact verification, stop conditions, remote policy.
6. Verify `SELF` works without amend/metadata-only second commits.
7. Rerun or inspect document validator, taskctl tests/state, manifest validator/tamper rejection, Git state, and PR identity.
8. Inspect conservative license/source mapping.
9. Confirm `CURRENT_STATE.md` makes no untested build/compatibility claims.
10. Confirm phase result records deviations and does not self-approve.
11. Do not repair.

### Exact verification

```bash
python tools/validate_project_docs.py --all
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/taskctl.py validate
python tools/taskctl.py status
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
git diff --name-status "$UPSTREAM_BASE_SHA"...HEAD
git log --format='%H %s' "$UPSTREAM_BASE_SHA"..HEAD
git status --short
gh pr view --json number,url,isDraft,state,baseRefName,headRefName,headRefOid,title
```

If direct execution is unavailable, label checks “not independently rerun”; do not promote them to verified.

### Gate acceptance

PASS only if upstream base proven, all changes are governance/tooling/evidence only, minimal handoff works, cards validate, taskctl is operational but not fake proof, licenses mapped conservatively, manifest detects tampering, Git/remote safety followed, one draft PR matches candidate, current-state matches reality, and no P00 blocker remains.

### Verdict format

```md
# GATE VERDICT — DOOM-P0-090

**Verdict:** PASS | FAIL — REPAIRABLE | FAIL — ARCHITECTURAL | BLOCKED — EXTERNAL INPUT REQUIRED
**Reviewed base:**
**Reviewed candidate:**
**Draft PR:**

## What was inspected
## What was independently verified
## Findings
## Scope and engine-delta verdict
## Evidence quality verdict
## Minimal-handoff test
## Required repairs or blocker
## Exact current state
## Next action
```

On repairable failure, propose one repair card per finding; do not implement. On PASS, author exact P01 plan/cards; do not begin native build work.

### Stop/block conditions

PR/candidate cannot be identified, base/head changes during review, evidence missing, or checker access cannot support PASS.

### Commit

None. Read-only Sol gate.

---

# 12. Required result format for Luna tasks

```md
# TASK RESULT

**Task:** DOOM-Px-yyy
**Status:** PASS | BLOCKED | FAIL
**Base commit:**
**Result commit:** SELF | actual prior commit | EXTERNAL
**Branch:**

## What was done
## What was verified
## What failed
## Changed files
## Commands and exact results
## Acceptance mapping
## Evidence paths
## Current exact state
## Known limitations
## Remaining blocker or next task
## Post-run git status
```

A blocker must include exact component, exact observed behavior, base/current commit, exact command, full log path, changed/partial state, what was ruled out, branch safety, and exact input/decision required.

---

# 13. Current exact state

## What was done

- ADR-011 through ADR-014 were accepted.
- The complete specification was promoted to accepted v1.0.
- P00 was frozen into a linear set of small Luna tasks with exact safety and verification contracts.

## What was verified

- The accepted specification file exists and has SHA-256 `05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c`.
- This P00 handoff includes all tasks P0-001 through P0-090.
- No implementation or remote action has occurred.

## What failed

Nothing failed during the planning freeze.

## Current exact state

The project is ready for repository bootstrap, not engine implementation. P00 has not been executed in a Git repository.

## Remaining blockers

- A clean authorized project workspace is required for P0-010.
- A user-owned remote and explicit push/PR authorization will be required only at P0-080.

# Next actionable step

Attach this file and the accepted specification to a Luna Codex run in a clean authorized workspace and send the P0-010 bootstrap prompt shown in Section 8.
