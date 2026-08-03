# Planning Contract

## Sol plan ownership

Sol owns architecture decisions, phase boundaries, accepted assumptions, blockers that need judgment, and phase-gate criteria. A plan is authoritative only when it records its scope, dependencies, evidence, and exit conditions.

## Self-contained phases

Each phase plan must stand alone for a fresh worker. It names the goal, source-of-truth order, task graph, allowed paths, remote boundary, exact verification, evidence locations, current state, and exit gate. Do not require chat history to interpret a card.

## Repeated assumptions and ADRs

Repeat the assumptions and ADRs that materially affect the phase. Link or identify the authoritative decision record. Do not silently reopen an accepted decision; elevate a new decision as a new ADR or blocker.

## Exit evidence

An exit gate is a concrete evidence contract, not a narrative. It lists exact commands, expected outputs, changed-path restrictions, hashes where applicable, and independent checks. Untested claims remain untested.

## Update on reality change

Update current-state and result records whenever observed repository reality differs from the plan. Do not edit historical evidence to make it agree with a later state; record the deviation and its cause.

## Planning-only means no implementation

Planning tasks define work and acceptance but do not implement later-phase engine, build, runtime, content, or release behavior. A worker must stop rather than broadening a planning task.

## Checker no-repair

An independent checker reports findings and does not repair them in the same run. Repair belongs to a bounded task with explicit allowed paths and verification.
