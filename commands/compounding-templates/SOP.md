<!-- compounding-system: v1 — installed from claude_tools; do not hand-edit; run /compounding upgrade -->
# Compounding SOP — Continuously-Discovered Improvements

Any session — scheduled routine, build agent, research thread — that encounters something worth
fixing writes a scoped entry here. The goal is a structured queue that any agent can surface to the
operator ("I see 3 OPEN items — want to tackle any?"), that a daily worker can drain autonomously
once an item's acceptance criteria are firm.

*Canonical system:* this SOP, the selector (`scripts/compounding-status.mjs`), the drain worker
(`.claude/commands/compounding-drain.md`), and the auto-merge workflow are installed and upgraded by
the global `/compounding` skill (`github.com/MSilb7/claude_tools`). The reference implementation
lives in `MSilb7/investment-agent` (which uses a native TypeScript selector — behavior is identical).

---

## When to write a compounding doc

Write an entry whenever any session:
- Hits an error it worked around (the workaround will bite next time)
- Observes silent or partial output that could mislead a future run or operator
- Encounters an undocumented format or interface it had to reverse-engineer from source
- Notices a logging/observability gap that makes post-hoc diagnosis harder
- Surfaces a reconciliation gap (state vs expectation, doc vs reality)
- Learns something non-obvious that should change how we build or operate
- **Finds a SIMPLIFICATION opportunity** (*simplicity is a first-class compounding dimension*) —
  the same knowledge duplicated across N docs (collapse to ONE canonical home + pointers;
  duplication is how copies go stale and parallel sessions collide), a procedure that has accreted
  steps no longer paying rent, a dual-format/legacy path whose deprecation window has passed, or any
  place where making a complicated thing simple beats adding another guard on top of it. When the
  simplification is small and safe, **just do it inline** (same rule as low-risk fixes); file an
  entry only when it needs a decision or real effort.

Do NOT write entries for clean runs with no observations — signal-to-noise matters.

---

## File naming

```
docs/compounding/YYYY-MM-DD-HHMM.md
```

One file per session. Multiple items go in the same file. If nothing noteworthy happened, no file.

---

## Item format

Each item uses this block. Goal + AC are the critical fields — they're what lets the operator
decide in-thread whether to execute, spec more deeply, or defer. AC can be skeletal; the operator
will refine them in conversation before execution begins.

```markdown
### [ID] Title
- **Severity:** low | medium | high
- **Effort:** low | medium | high
- **Pickup:** active-agent | cleanup-routine | operator-action
- **Ready:** yes | no
- **Files:** path(s) to touch (omit if not yet known)
- **Status:** OPEN | DONE (PR #N / commit sha)

**Background:** what was observed during the session — concrete and skimmable

**Goal:** one sentence describing the desired end state

**Acceptance criteria:**
- [ ] criterion (can be a skeleton — operator refines in conversation before execution)
- [ ] criterion
- [ ] ...

**Proposed approach:** rough direction or options (optional; omit if unclear)
```

Severity = blast radius if left unfixed.
Effort = engineering cost to fix.
Pickup:
- `active-agent` — worth doing soon, can be done inline
- `cleanup-routine` — fine to batch with the weekly sweep
- `operator-action` — needs an operator decision before any code change

`Ready` = the AC are firm enough that an autonomous worker could execute this item to a verifiable
done with no conversation. **Default `no`.** Flipping to `yes` is a deliberate act — the operator (or
a scoping session with operator sign-off) confirms the AC first. Only `Ready: yes` items are
auto-drain eligible.

---

## Pickup protocol

**Any session start** — run `node scripts/compounding-status.mjs` (or the repo's `compounding-status`
package script; falls back to `ls docs/compounding/` off-repo) and skim OPEN items. Surface them to
the operator: *"I see N OPEN compounding items — [C1: title (severity/effort)], [C2: ...]. Want to
tackle any, or should I just proceed?"* Let the operator direct. For `effort:low` + `severity:low`
items with no operator-decision dependency, you may knock them out silently inline.

**Before executing any OPEN item** — if the AC are skeletal, offer to flesh them out in
conversation first: *"C3's AC are rough — want me to scope it fully before we build?"*

**When done** — set `Status: DONE (PR #N)` in the item. Do not delete the file; it's an audit trail.

**Status currency is continuous, not wrap-up-driven**: flip a status **in the same PR/session as the
change that made it true** — never park it for an end-of-session sweep the operator may never ask
for. Backstop: the daily drain's STEP 1.5 status-hygiene pass flips any OPEN item whose referenced
PR merged and corrects git-contradicted status prose. State the selector can't verify from git
(external systems, live configs) is updated same-PR by whichever session touches that system.

**Weekly cleanup routine** — full scan of all OPEN items. Execute remaining `effort:low` items.
Summarize `effort:medium` items for the operator. Leave `operator-action` items untouched.
Also review STALE and NEEDS-REVIEW items surfaced by the selector — reclaim or retire them — and
run `/compounding upgrade` so this repo's installed system tracks the canonical templates.

---

## Item identity & the lock key

Local IDs (`C1`, `C-GPU2`) are NOT globally unique — the same `C1` can exist in multiple session
files. The globally unique **key** is `<file-datestamp>-<id>` (e.g. `20260702-1500-C-LEDGER1`),
derived from the filename. All coordination (claim branches, PR titles) uses the key, never the bare id.

---

## Derived states (never persisted — computed by the selector)

The markdown carries only `OPEN` → `DONE (PR #N)`. Everything in between is DERIVED from GitHub
branch/PR state, so it can't go stale on the default branch:

| State | Meaning |
|---|---|
| `ELIGIBLE` | OPEN + `Ready: yes` + `Pickup ∈ {active-agent, cleanup-routine}` + effort ≤ ceiling (v1: low) + unclaimed |
| `IN-PROGRESS` | an open PR references the key — a thread is working it; do not pick it up |
| `CLAIMED` | claim branch `compounding/<key>` exists; PR data unavailable on this surface — treat as in-progress |
| `NEEDS-REVIEW` | a prior PR was closed unmerged (rejected fix) — a human decides whether to retry; never auto-retried |
| `STALE` | open PR idle > 7 days, or an orphan claim branch with no PR — reclaim candidate for the weekly sweep |
| `BLOCKED` | operator-action, `Ready: no`, or effort above the auto ceiling — surfaced, never auto-run |

---

## Auto-drain (the daily worker)

A daily `compounding-drain` routine (skill: `.claude/commands/compounding-drain.md`) picks the single
top-ranked ELIGIBLE item (severity desc → effort asc → oldest first), claims it by pushing branch
`compounding/<key>` (an empty claim commit + a draft PR — the branch push is the atomic mutex; if the
push is rejected the item is taken, move on), implements to the item's AC, runs the repo's
green-check, flips the item to `DONE (PR #N)` in the same diff, and:
- diff touches ONLY `docs/compounding/**` → marks the PR ready and the `auto-merge-journal`
  workflow lands it;
- anything else (code, skills, workflows) → leaves a **draft PR** for human merge.

Zero ELIGIBLE items ⇒ clean no-op. The worker never merges code, never touches credentials/secrets
or money-moving/state-mutating systems, never force-pushes, never deletes branches, never pushes the
default branch directly.

---

## Upstreaming — compounding the compounding system

Improvements to the SYSTEM itself (this SOP's rules, selector behavior, the drain protocol, the
workflow) are not repo-local: file them as a queue item with an extra line after `Pickup:`:

```markdown
- **Upstream:** claude_tools
```

Executing an upstream item means PRing `github.com/MSilb7/claude_tools`
(`commands/compounding-templates/` + a `VERSION` bump), after which **every** repo's next
`/compounding upgrade` inherits the improvement. Never fork the system silently in one repo — that
recreates the drift this design exists to kill.

---

## Wiring

This SOP is referenced from the repo's CLAUDE.md compounding bullet (installed by `/compounding
setup`), which is how both headless routine runs and interactive sessions see the convention.
