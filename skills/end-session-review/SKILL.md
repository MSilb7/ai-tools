---
name: end-session-review
description: Drive a work session to genuine closure — nothing left open, ready to close out — by reconciling product, technical, operational, git, validation, and compounding state. Use when wrapping a session, preparing a handoff, checking whether work is genuinely complete, or ensuring every loose end is completed, queued with acceptance criteria, or identified as an operator-only action. Run UNPROMPTED at any natural stopping point after substantive work — the user saying "wrapped?", "good to wrap?", "are we done?", or "all set?" IS the trigger; do not answer with a git-cleanliness check alone, and never wait for an explicit "compound this" request (capturing session learnings is part of this review, not a separate ask). Ends with an explicit closure assertion, so "are we good?" after a wrap report means the sweep missed something, not that the summary should be repeated.
---

# End Session Review

**The goal is closure: after this review the session can be closed, and nothing is left open.** Not
"loose ends are noted" — every one is finished, filed with acceptance criteria, or named as an
operator-only ask. Do not use a passing test suite as the only definition of done.

The review is finished when you can make the terminal assertion in § 7 and enumerate its basis. If you
cannot, the review is still running — keep going rather than reporting a summary with residue in it.
When the user follows a wrap report with "are we good?" or "is there more?", treat it as evidence the
sweep was not exhaustive, not as a request to repeat the summary.

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

### 2a. Sweep for what the work RETIRED — mechanically, not from memory

Reasoning about "which surfaces were affected" reliably misses stale claims, because a doc you never
opened can still instruct the reader to do something the work just made wrong. Whatever the work
retired or replaced is a **searchable string** — so search for it across the whole repository instead
of predicting where it appears: a removed credential or env var, a renamed identifier, a replaced
endpoint or vendor, a deleted flag, a moved path, a superseded command.

Classify **every** hit into exactly one of three, and leave none unclassified:

- **a live claim or instruction** → fix it (this is the dangerous class: it tells a future reader to
  provision a dead secret, call a removed endpoint, or trust a retired flag);
- **a dated record** — a design spec, a historical log entry, a closed queue item → annotate as
  superseded with a pointer to the replacement; do not rewrite history;
- **correct as history** → leave it alone.

Also check **cross-references that assert status**: a closed item's own `Ready`/`Status` header, and
other documents that describe it as open or awaiting a decision. Those contradict reality the moment the
work lands and are invisible to any test.

### 2b. Check the OTHER entrypoints into what you changed

When the work adds an output, signal, warning, or failure mode to a component, every *other* way that
component is invoked must surface it too — aliases, back-compat wrappers, secondary CLIs, alternate
callers. A wrapper that forwards only the success summary silently swallows a new alert, which
reproduces the exact failure the alert was added to prevent. Enumerate the callers and verify each.

## 3. Run the real green check

Execute the repository's documented tests, type checks, build, lint, link checks, or focused probes in
proportion to risk. Confirm the change did not weaken its own grader and that evidence supports any
claimed outcome. Note checks that could not run and why.

## 4. Scan for stranded work

Check uncommitted changes, unpushed commits, open or draft reviews, stale claim branches, unresolved
comments, temporary files, and instructions that now point at missing paths. Do not delete or rewrite
work merely because its ownership is unclear.

Scan **every** worktree, not just the current one — uncommitted and unmerged work hides in siblings,
and a wrap that inspects only the active directory reports a clean tree while work sits stranded one
path over. For each: its branch, uncommitted count, and commits not on the default branch.

## 4a. Close out the session's own worktree

An isolated worktree the session created is itself a loose end — leaving it behind is the worktree
equivalent of an unpushed commit, and the user discovers it as a failure when they try to close the
session. Decide explicitly and say which: **remove** it once its work is merged, or **keep** it and
say what remains. Three traps make this go wrong:

- **Judge "unmerged work" by commits unique to the worktree** — `git log <default-branch>..HEAD` —
  never by a tool's own count. Removal tooling often diffs against the worktree's *creation base*, so
  the default branch's forward progress since then (other sessions' merged work) is reported as
  commits about to be "discarded." That number can be large and alarming while the true count is
  zero. Verify before believing it; verify again before overriding it.
- **A lock naming a dead process is stale.** Locks typically record an owning process; a lock whose
  process has exited blocks cleanup while reporting the worktree as in use by a live session. Check
  whether the process is actually alive rather than trusting the message. The session's own lock is
  routinely the stale one, because the process that took it is the one that just ended.
- **Never clean up a worktree that isn't yours.** A lock held by a live process, or any worktree with
  uncommitted files or unique commits, belongs to another session — report it, leave it alone.

Removing a worktree whose HEAD is already an ancestor of the default branch destroys nothing. If any
doubt survives the checks above, keep it and hand it off — a kept worktree costs disk, a wrongly
removed one costs work.

## 5. Route every loose end

Each material follow-up must be exactly one of:

- completed and validated now;
- entered in the compounding queue with evidence and acceptance criteria;
- recorded as a true operator-only action with the smallest concrete ask.

Promote a non-obvious repeated procedure to a repository-local skill, or to canonical AI Tools with
`promote-skill` when it generalizes. Do not leave substantive follow-up only in the final chat reply.

## 5a. Merge checkpoint — the auto-detected stopping point between wraps

A PR merging is the clearest natural stopping point a session produces, so treat **every merge as a
mini checkpoint** without waiting for the wrap: sweep the conversation since the last checkpoint and
answer in one line — loose ends to file? learnings to capture? a doc the merge just made stale? If
none, say exactly "merge checkpoint: nothing new to file or compound." This is deliberately
lightweight (one line, not a full review) so multi-PR sessions keep momentum; the full review below
still owns the actual wrap. Deterministic enforcement for Claude Code ships alongside this skill:
`scripts/merge-checkpoint-hook.py` + a `PostToolUse` (Bash) entry in `.claude/settings.json` inject
the checkpoint prompt whenever a `gh pr merge` runs — install both in repositories that want the
trigger to be machinery rather than memory. Other providers apply the rule behaviorally.

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

## 7. Closure gate — assert it, or keep working

End with an explicit statement that the session is ready to close, and the basis for it. The answer is
**not yet** while any of these is true — check them rather than assuming:

- work committed but not merged, or a review still open, without an explicit decision to leave it so;
- a hit from § 2a still unclassified, or a status cross-reference still contradicting reality;
- an entrypoint from § 2b not verified;
- a follow-up mentioned only in prose, with no queue item, owner, or acceptance criteria;
- the session's own worktree left behind without a stated keep-or-remove decision (§ 4a);
- learnings never swept (§ 5b has a terminal state either way — "nothing novel to compound" counts,
  silence does not);
- a documented check that could not run, without saying which and why.

Then state plainly, in one line: **either** the session is ready to close and nothing is open, **or**
exactly what remains and who owns it. Anything filed is not the user's problem — say so, and do not
present a queued item as if it were an outstanding ask. If work is deliberately left open, that is a
closed loop too, provided the decision is stated rather than implied.
