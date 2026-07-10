---
name: repository-hygiene
description: Inspect, run, schedule, reconcile, or audit recurring repository hygiene while preserving a portable scan, safety, validation, and review contract. Use when asked to clean up a repository, create a weekly hygiene check, audit scheduled maintenance, find repositories missing coverage, or separate a reusable maintenance method from Claude Workflows, Codex scheduled tasks, or another automation runtime.
---

# Repository Hygiene

Keep the maintenance method portable and select a runtime adapter only when scheduling or inspecting
live automation. Skills define the work; provider features define when, where, and with which native
capabilities it runs.

Choose the mode from the request:

- `run` — inspect one repository and optionally apply safe fixes through review;
- `schedule` — compose the portable run and configure one supported automation runtime;
- `reconcile` — find active repositories missing intended hygiene coverage;
- `audit` — check existing scheduled runs for health, drift, safety, and coverage.

## 1. Gather repository facts

Read repository instructions and inspect the target without guessing:

- remote, default branch, review path, and dirty worktree state;
- stack, dependency manager, and test/typecheck/lint/build commands that actually exist;
- PRD, technical design, decisions, current-state docs, runbooks, and compounding queue;
- meaningful source directories and critical paths;
- risk surfaces such as credentials, personal data, money movement, signing, deployment, or other
  external state mutation.

Do not add a gate command merely because it is conventional for the detected language.

## 2. Establish the safety envelope

Always preserve unrelated work, stage exact paths, avoid history rewrites, keep changes reversible,
and stop loudly on a committed secret or key. Never merge automatically.

Add repository-specific prohibitions for live financial actions, transaction signing, production
infrastructure, sensitive databases, credentials, or safety controls. A scheduled maintenance worker
must not receive capabilities it does not need.

## 3. Scan the repository

Produce a prioritized punch list with evidence, effort, and one of two dispositions:

- `SAFE-FIX` — low-risk, mechanical, and verifiable within the current run;
- `PROPOSE` — meaning-bearing, risky, uncertain, or larger than the maintenance envelope.

Cover:

1. dead code, duplication, and simplification;
2. PRD, technical, operational, and current-state documentation drift;
3. missing or weak tests on critical paths;
4. artifact, secret, ignore-file, TODO, and generated-file hygiene;
5. context entropy: duplicated standing rules, stale adapters, and procedures that belong in skills.

Use `compounding-curate`, `prd-reconcile`, and `maintain-technical-design` when those focused methods
fit. Route unresolved actionable gaps into the compounding queue.

## 4. Apply only safe fixes

Create a dedicated branch, apply only `SAFE-FIX` items, and run the repository's real gate. Revert an
individual maintenance fix that breaks its check and reclassify it as `PROPOSE`. Use
`assets/run-prompt.md` when a headless run needs a self-contained prompt.

Open one review containing the complete punch list, applied fixes, validation, and deferred proposals.
Open a report-only issue or review when no fix is safe but the runtime supports it. Never merge the
result from this skill.

## 5. Schedule through a capability adapter

Confirm the target repository, cadence, execution isolation, safety envelope, expected output, and
required permissions before creating or updating automation. Then read exactly one adapter:

- `references/claude-workflows.md` for Claude Workflows and its repository-source configuration;
- `references/codex-scheduled-tasks.md` for Codex scheduled tasks and local/worktree selection.

If the current client exposes neither adapter's required capability, return a paste-ready automation
spec instead of inventing an API. Keep the task prompt centered on invoking `$repository-hygiene`;
do not copy the full method into live configuration unless the runtime cannot load skills.

## 6. Reconcile or audit coverage

For reconciliation, start from operator-named or already-maintained active repositories. Treat any
broader repository list as a menu, never a mandate to schedule everything.

For each existing automation, verify:

- enabled state, cadence, recent successful run, and non-colliding schedule;
- correct repository/project binding and default branch;
- execution isolation appropriate to the expected mutations;
- current stack gate and safety envelope;
- prompt invokes the canonical skill rather than a stale copied workflow;
- attached connectors, tools, and permissions are least-privilege;
- the output reaches a visible review or findings inbox instead of silently no-oping.

Propose live automation changes before applying them. Report healthy, updated, missing, and
misconfigured counts separately.
