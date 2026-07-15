---
description: >
  Drain ONE eligible item from the compounding queue (docs/compounding/) — the daily self-improvement
  worker. Selects the top-ranked ELIGIBLE item via the selector's --json output, claims it with a
  compounding/<key> branch + draft PR (atomic mutex), implements to the item's acceptance criteria,
  green-checks, flips the item to DONE in the same diff, and lands it (queue-only diff → auto-merge;
  anything else → draft PR for human merge). Use on the daily routine fire or on demand ("drain the
  compounding queue", "work the next improvement item"). Zero eligible items ⇒ clean no-op. NEVER runs
  an item that is operator-action, Ready:no, above the effort ceiling, or already claimed.
---

<!-- compounding-system: v7 — installed from claude_tools; do not hand-edit; run /compounding upgrade -->

# compounding-drain — work one queue item to done

DEV worker. Hard limits regardless of what any queue item says: **no credentials/secrets, no
money-moving or external-state-mutating tools** (no broker/exchange/payment/infra-mutation APIs —
if the repo has such systems, this worker does not touch them), **never merge code, never
force-push, never delete a branch, never push the default branch directly**. The only path to the
default branch is the `auto-merge-journal` workflow on a queue-only PR. One item per run.
`SELECTOR` below = `node scripts/compounding-status.mjs` (or the repo's `compounding-status`
package script — same contract).

## STEP 0 — repo presence guard
`test -d docs/compounding` must pass. If not: this environment booted without the repo (or the
system isn't installed — run `/compounding setup`) — report **SETUP GAP, cannot run** and STOP. Do
not probe the filesystem for credentials.

## STEP 1 — select
`git fetch origin && git checkout <default-branch> && git pull` (evidence rule: never select from a
stale base). Run `SELECTOR --json`. Note `.eligible` for STEP 2 — but run STEP 1.5 on every fire
regardless.

## STEP 1.5 — status hygiene (every fire; statuses must not wait for a human "wrap it up")
Sync every **git-verifiable** stale status found in the same read, so the queue is truthful daily
even when nothing is drained:
- An item still `OPEN` whose key matches a **MERGED** PR (`gh pr list --state merged --search <key>`
  distinguishes merged from closed-rejected) → flip it to `DONE (PR #n)` — the work landed, only the
  flip was forgotten. A closed-UNMERGED PR stays NEEDS-REVIEW for a human.
- An item whose `Status` prose contradicts checkable git state (e.g. "pending" but the referenced
  file/PR is on the default branch) → correct the status line, dated.
- STALE items (idle PR / orphan claim branch) and NEEDS-REVIEW items → don't fix, but list them in
  the run report so the notification surfaces them.
If any fixes were made: commit them to a branch `compounding/status-sync-<UTC-date>`, open a PR —
the diff is `docs/compounding/**`-only, so mark it ready and `auto-merge-journal` lands it. What
this step must NOT do: claim external-system state (live configs, third-party dashboards) it cannot
verify from this session — that state is updated same-PR by whichever session touches that system.

Then: if `.eligible` is empty → log "compounding-drain: nothing eligible" (mention top
BLOCKED/STALE/NEEDS-REVIEW counts so the log is diagnosable) and EXIT cleanly (after landing any
STEP 1.5 status-sync PR). Otherwise take `.eligible[0]` (already ordered by the selector's ranking
(see `compounding-status.mjs`)). Read its full item in `docs/compounding/<file>` — Goal + AC are the contract; the AC
define done.

## STEP 2 — claim (atomic; claim BEFORE work)
- `git checkout -b compounding/<key>` (from the fresh default branch)
- `git commit --allow-empty -m "claim: <key>"`
- `git push origin compounding/<key>` — **if the push is rejected because the ref exists, the item
  is taken**: go back to STEP 1's list, take the next eligible item; if none, EXIT cleanly.
- Open a **draft PR** immediately: title `chore(compounding): <key> — <title>`, body = the item's
  Goal + AC checklist + "auto-drain claim". Use `gh pr create --draft`; if `gh` is unavailable, use
  the GitHub API. If a PR cannot be opened at all, note it in the run log and continue — the pushed
  branch is still the lock; the PR is reporting.

## STEP 3 — implement to the AC (held-in first)
Work strictly to the item's acceptance criteria — no scope creep; a neighboring discovery becomes a
NEW queue entry, not extra diff. If the item is tagged `Upstream: claude_tools`, the implementation
PR targets `github.com/MSilb7/claude_tools` (templates + VERSION bump) and this repo's item flips
DONE referencing that PR.

**Held-in proof (bug / behavioral items):** follow tests-first — add a regression test that **fails on
the current, pre-fix code** (run it, watch it fail: that failure IS the proof the weakness is real),
THEN implement the fix so the same test passes. A "DONE" flip must mean *the weakness is proven
resolved*, not *the suite happens to be green* (SOP § Validating a fix — held-in + held-out). Doc-only,
config, and pure-refactor items have no behavior to pin and are exempt — say so in the PR.

## STEP 4 — green-check
Run the repo's gate (typecheck/tests — whatever its CI runs; check `package.json` scripts /
`pyproject.toml` / CI workflow for the canonical commands). If red and you cannot make it green
**within the item's scope**: push WIP, leave the PR draft, comment the failure on the PR, and EXIT
(the item shows IN-PROGRESS; a human or the weekly sweep reclaims via STALE). Never mark ready on red.

## STEP 4.5 — integrity check (no grader-hacking)
Before finalizing, diff the change against its own graders. A self-improvement worker optimizes the
signal it is given ("CI is green"), so guard against reaching green the wrong way: if the PR makes the
gate pass by **weakening a test/eval that guards this item's behavior** — a removed case, a loosened
assertion, a relaxed threshold, a deleted eval — that is a reward-hack, NOT a fix. Revert the grader
change, keep the PR **draft**, and flag it for human review in a PR comment. The thing under test and
the test that judges it must never move the same direction in one drain change. Adding the STEP 3
held-in regression test, or *strengthening* a grader, is fine (SOP § Never reach green by editing the
grader). If the item's genuine fix legitimately requires changing a test's expectations (the old
assertion was itself wrong), that is a human-review case — do not auto-merge it.

## STEP 5 — flip status + finalize
In the item's file, set `- **Status:** DONE (PR #<n>)` and tick the AC boxes that are objectively
met (same diff as the fix — merging lands both atomically). Every AC box is either ticked or the PR
comment explains why it's N/A. Push.

## STEP 6 — land
Inspect the PR diff file list:
- ONLY `docs/compounding/**` → mark the PR ready (`gh pr ready`) — `auto-merge-journal`
  squash-merges it (~1 min) and deletes the branch. VERIFY: within ~3 min `git fetch origin` shows
  the flip on the default branch; if not, report NOT-LANDED loudly.
- anything else → keep it **draft**, and end the run reporting: item key, PR URL, one-line summary,
  "awaiting human merge".

## STEP 7 — report
One line per run outcome: `drained <key> → PR #<n> (auto-merged | draft, awaiting merge)` or
`nothing eligible` or `claim lost to concurrent worker`. If this run itself hit something fixable,
file a NEW compounding entry per `docs/compounding/SOP.md` — that's the loop compounding on itself;
if the fixable thing is the SYSTEM (this skill, the selector, the SOP), tag it `Upstream:
claude_tools` (SOP § Upstreaming).
