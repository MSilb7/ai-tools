---
name: end-session-review
description: Reconcile product, technical, operational, git, validation, and compounding state before ending substantive repository work. Use when wrapping a session, preparing a handoff, checking whether work is genuinely complete, or ensuring every loose end is completed, queued with acceptance criteria, or identified as an operator-only action. Run UNPROMPTED at any natural stopping point after substantive work — the user saying "wrapped?", "good to wrap?", "are we done?", or "all set?" IS the trigger; do not answer with a git-cleanliness check alone, and never wait for an explicit "compound this" request (capturing session learnings is part of this review, not a separate ask).
---

# End Session Review

Close the loop on substantive work. Do not use a passing test suite as the only definition of done.

## 1. Establish current ground truth

Read repository instructions and inspect the final working tree, current branch, commits or review,
and validation output. Re-read the request and acceptance criteria. Identify unrelated user changes
and leave them untouched.

## 2. Reconcile maintained sources

Check only the surfaces affected by the work:

- living PRD for confirmed decisions, shipped outcomes, priorities, stories, and roadmap movement;
- technical-design index for changed components, data ownership, interfaces, trust boundaries,
  runtime topology, operations, or test strategy;
- decision records for meaning-bearing architecture choices;
- current-state or build logs for status and chronology;
- runbooks for changed operating or recovery procedures;
- shared agent instructions and local skills for repeated or newly stable workflows;
- compounding queue for gaps, silent failures, and follow-ups.

Fix safe factual drift when the request authorizes repository changes. Surface product, architecture,
security, or ownership decisions instead of guessing.

## 3. Run the real green check

Execute the repository's documented tests, type checks, build, lint, link checks, or focused probes in
proportion to risk. Confirm the change did not weaken its own grader and that evidence supports any
claimed outcome. Note checks that could not run and why.

## 4. Scan for stranded work

Check uncommitted changes, unpushed commits, open or draft reviews, stale claim branches, unresolved
comments, temporary files, and instructions that now point at missing paths. Do not delete or rewrite
work merely because its ownership is unclear.

## 5. Route every loose end

Each material follow-up must be exactly one of:

- completed and validated now;
- entered in the compounding queue with evidence and acceptance criteria;
- recorded as a true operator-only action with the smallest concrete ask.

Promote a non-obvious repeated procedure to a repository-local skill, or to canonical AI Tools with
`promote-skill` when it generalizes. Do not leave substantive follow-up only in the final chat reply.

## 5b. Capture what the session learned

Loose ends are not the only compounding output — sweep the session itself for durable learnings the
work *generated*: a non-obvious gotcha, a capability or surface discovered, a failure mode observed, a
procedure confirmed or invalidated, an assumption a single observation now qualifies. Route each with
`capture-learning` (or the repository's equivalent) to its one canonical home. This step has an
explicit terminal state either way: name what was captured and where, or state "nothing novel to
compound" — a wrap that is silent about learnings is incomplete, because unprompted capture is exactly
what a compounding repository exists for.

## 6. Hand off

Lead with the outcome. Report changed sources, validation, review state, queue status, unresolved
decisions, and the one most useful next action. Distinguish completed work from proposed or unmerged
work.
