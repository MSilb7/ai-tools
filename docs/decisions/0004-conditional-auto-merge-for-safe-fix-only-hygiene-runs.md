# ADR 0004: Conditional auto-merge for SAFE-FIX-only hygiene runs

- **Status:** Accepted
- **Date:** 2026-07-26

## Context

`repository-hygiene`'s `run` mode has always required a human to merge every review it opens:
`SKILL.md` step 2 said "Never merge automatically," step 4 said "Never merge the result from this
skill," the Claude Workflows adapter said "Never configure auto-merge," and the `run-prompt` asset
said "Never merge." In practice, on `ai-tools`' own weekly hygiene runs the operator merged every
SAFE-FIX-only review immediately after it opened (PRs #26, #30, #31, #32, #33, #34) — the manual
approval step never changed the outcome, it only added latency. On 2026-07-26 the operator confirmed
this directly: "We can merge simple things automatically too."

## Decision

`repository-hygiene`'s `run` mode may merge the review it opens automatically, but only when every
one of these holds for that run:

- every applied change in the diff is `SAFE-FIX` — no `PROPOSE`-classified change is included;
- the repository's real gate (established in step 1) ran and passed;
- no committed secret or other LOUD finding occurred;
- auto-merge is explicitly enabled for that repository's configuration — an opt-in safety-envelope
  setting per repository/schedule, never a silent default.

A run that includes any `PROPOSE` item in its diff, has a failing or unavailable gate, surfaces a
secret, or targets a repository where auto-merge has not been explicitly enabled still stops exactly
as before: open one review with the full punch list, never merge. Carrying forward previously filed,
unchanged `PROPOSE` items as informational context in the review body does not by itself block
auto-merge — they are not part of the diff being merged.

## Consequences

- `SKILL.md` step 2 and step 4 state the conditional merge rule instead of an unconditional
  prohibition.
- `references/claude-workflows.md` gains merge-outcome as an explicit configuration choice instead of
  banning auto-merge outright; still defaults to review-only unless the operator opts in.
- `references/codex-scheduled-tasks.md` notes the same opt-in for parity.
- `assets/run-prompt.md`'s instruction becomes conditional per this ADR.
- Existing installed automations keep manual-merge behavior until an operator explicitly opts a given
  schedule into this mode — this is not a blanket behavior change for every repository already running
  the skill.
