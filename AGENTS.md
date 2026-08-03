# SFHS Doom Repository Instructions

## 1. Project goal

SFHS Doom is a complete single-player, vanilla-compatible Doom source port with a strict single-file HTML release target. Chocolate Doom is authoritative for engine behavior, including vanilla limits, compatibility behavior, and intentional bugs.

## 2. Current phase/current goal

The current phase is P00, governance and repository bootstrap. The current goal is to install the contracts, task machinery, licensing map, and evidence rules needed for later implementation without changing Chocolate Doom behavior.

P00 is not engine implementation. Do not modernize the engine, rewrite it in JavaScript, select later-phase toolchains, build the engine, or add gameplay features during governance tasks.

## 3. Source-of-truth read order

Read the task card before acting. After this file exists, use this order:

```text
AGENTS.md
-> docs/PROJECT_SPEC.md
-> docs/CURRENT_STATE.md
-> docs/phases/P00/PHASE_PLAN.md
-> docs/tasks/P00/<TASK-ID>.md
-> relevant files and tests
```

The task card controls the current allowed paths, commands, stop conditions, and acceptance criteria. The accepted specification and frozen phase plan control product and phase scope.

## 4. Compatibility invariant

Chocolate Doom at the recorded upstream source commit is the compatibility authority. Preserve vanilla behavior, limits, demos, configuration, savegames, input/display feel, and intentional bugs by default. No modernization or JS rewrite is permitted as a substitute for the engine. Native and future WebAssembly work must remain comparable to the recorded authority.

## 5. Task execution protocol

1. Read the task card and relevant source-of-truth documents first.
2. Confirm branch, expected dependency commit, remotes, root instructions, and a clean working tree.
3. If any unknown, unrelated, or conflicting working-tree change exists, stop and report it; never hide or destroy it.
4. Use one source-modifying writer by default. Read-only checking may run separately.
5. Edit only the paths explicitly allowed by the task card. Do not broaden the task.
6. Run the exact verification from the card and record commands, outputs, evidence paths, and limitations.
7. Write the required task result before committing. Use `Result commit: SELF` when the result is contained in the commit being created.
8. Commit once on PASS with a subject beginning with the task ID, then verify the committed tree is clean.

## 6. Allowed/forbidden Git operations

Read-only status, log, diff, ancestry, remote inspection, and file-history checks are allowed when relevant to the card. Local branch creation or local metadata changes are allowed only when the card explicitly requires them.

Destructive Git operations are forbidden by default, including `git reset --hard`, `git clean`, broad restore, broad stash, history rewrites, amend, and force push. Never discard unknown work to make a check pass. Do not modify engine source, upstream build files, or upstream documentation in P00 governance tasks.

## 7. Commercial data/privacy rule

Never commit commercial IWAD or PWAD bytes, DeHackEd patches, proprietary lumps, demos, screenshots, copied game assets, secrets, tokens, or private credentials. Do not download or embed commercial Doom data. Keep legal engine licensing, Freedoom content, corresponding-source duties, and trademark/non-affiliation language distinct and evidence-backed.

## 8. Build/test/evidence rule

Run the exact verification required by the current task card. Do not claim a build, toolchain, browser, device, gameplay, compatibility, performance, or release result that was not directly verified. Record exact command results and repository-relative evidence paths. SHA-256 is canonical for artifact identity. A failed or incomplete check is a blocker, not an invitation to redesign the task.

## 9. Generated artifact rule

Keep readable source and governance documents as the edit surface. Do not edit generated `dist` files or any generated release artifact by hand. The eventual `index.html` is a packaging output, not a P00 source file. Do not add a generated artifact merely to satisfy a documentation task.

## 10. Issue/blocker protocol

Unknown working-tree changes, an existing conflicting root `AGENTS.md`, material specification or plan conflict, unsafe history, missing evidence, failed acceptance criteria, or required out-of-scope authority are blockers. Stop without cleanup or speculative repair. Record the exact component, command, observed output, current commit, changed/partial state, ruled-out causes, and the precise external input required.

## 11. Remote operation boundary

Remote writes require exact authority for the named action. Without that authority, do not create or mutate remotes, push, open or update pull requests, merge, publish, release, or alter another branch. A task that says no remote action means no remote action. Read-only upstream metadata inspection is allowed only when the task explicitly permits it.

## 12. Required result/commit format

Every task result must identify the task, status, base commit, result commit, branch, work performed, verification, failures, changed files, exact commands/results, acceptance mapping, evidence paths, current exact state, limitations, blockers, and next task. `SELF` means the result is in the commit currently being created; do not amend solely to replace it with the eventual SHA. A passing task has one coherent local commit whose subject starts with the task ID and a clean worktree afterward.
