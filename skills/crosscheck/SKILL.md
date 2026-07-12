---
name: crosscheck
description: Set up and run a repository's cross-model double-check queue (docs/crosscheck/) — dated notes one model family (e.g. Claude, Codex) leaves for the other to verify its substantial work. Modes. SETUP installs the SOP + selector into a repository. FILE writes a note after landing safety-adjacent, judgment-heavy, or not-fully-self-verified work — facts and pointers only (never self-assessment), runnable Verify steps, an explicit Unverified list, and Do-not-relitigate for intentional choices. PICKUP works the OPEN notes addressed to your provider at session start — execute Verify steps, probe Unverified items, then validate-then-apply findings (mechanical fixes land via normal review; judgment findings stay advisory; disputes are first-class); flip DONE in the same change. STATUS reports the queue. Use when asked to "leave a note for the other model", "double-check the other model's work", "set up crosscheck", or around substantial cross-provider work. Notes carry zero authority over safety gates.
---

# Crosscheck

Run one async double-check loop between two model families sharing a repository: the author files
an evidence-shaped note; the other family picks it up cold, verifies, and closes with validated
findings. The installed contract lives in the target repository at `docs/crosscheck/SOP.md`; this
skill is the operating checklist. Hard rule in every mode: notes **never authorize** production
actions, credential use, or changes to any safety gate — repository safety rules bind the checker
exactly as they bind the author.

Choose `setup`, `status`, `file`, or `pickup` from the request. Default to `pickup` at session
start when `docs/crosscheck/` exists with OPEN notes, and `file` right after landing substantial
work.

## 1. Setup mode

Work on a branch and use the repository's review path. Install the smallest complete system:

1. Copy `assets/SOP-template.md` (from the canonical AI Tools checkout, via the installed skill
   path or the stable `~/.ai-tools` anchor) to `docs/crosscheck/SOP.md`.
2. Copy `scripts/crosscheck-status.mjs` to the repository's `scripts/`. Zero dependencies; runs
   under node >=18 or bun.
3. Add the standing-practice bullet from `assets/agents-md-snippet.md` to the repository's
   `AGENTS.md` (session-start pickup + the no-self-assessment rule). Keep it that size; the SOP
   is the contract.
4. If the repository auto-merges journal-class documentation paths, adding `docs/crosscheck/**`
   to that allowlist lets note-only changes land without a human merge — propose it as an explicit
   decision, never silently.

A repository with its own selector implementation keeps it; the behavior contract (parse fields,
`X-` ids, `<datestamp>-<id>` keys, `crosscheck/<key>` claim branches, OPEN/CLAIMED/DONE) is what
upgrades as a unit, stamped in the SOP header. Upgrade = compare the installed stamp with the
canonical template and replace only canonical-owned infrastructure; repository note files are
never templates and never overwritten.

## 2. Status mode

Run the repository's selector from its root (`node scripts/crosscheck-status.mjs`, `--for
claude|codex` to filter, `--json` for machine output). Report OPEN notes by audience, CLAIMED,
and recent DONE. An empty queue is a successful result; change nothing.

## 3. File mode — leave a note

1. **Worth a note?** Substantial + async-checkable only: safety-adjacent or production-path code,
   a new system/skill/migration with silent failure modes, judgment-heavy changes, or work you
   could not fully verify yourself. Routine commits and typo fixes: no. The bar: "would a second
   model family's independent read add real safety?"
2. **Dedupe** — run the selector; if an OPEN note already covers this work, update its `Work:`
   pointers instead of filing a twin.
3. **Write** `docs/crosscheck/YYYY-MM-DD-HHMM.md` (append to this session's file if present), one
   `### [X-<TAG>N] Title` block per note, exactly the SOP format. The four rules that make it
   work:
   - **No self-assessment.** Facts and pointers only — never "tests pass, I'm confident."
     (Measured: confidence framing halves the checker's findings.)
   - **Verify steps runnable cold** — commands + expected outcomes for a fresh agent.
   - **Unverified is explicit** — what you did NOT check; the checker's priority list.
   - **Do-not-relitigate** — intentional decisions with the why, and failed approaches, so the
     checker doesn't "fix" a Chesterton's fence or retry a dead end.
4. **Land it** with the work when possible, through the repository's normal path. Do not ping
   anyone; pickup is pull-based at the other provider's next session start.

## 4. Pickup mode — work the notes addressed to you

1. **List** — selector with `--for <your-provider>` (notes addressed to `any` are yours too).
   Zero OPEN notes = clean no-op; say so and stop. Surface the list, then proceed — pickup is the
   default, not a permission ask.
2. **Claim only if you will push changes.** Pure read-verify: no claim. Otherwise, from a fresh
   default branch: push branch `crosscheck/<key>` (empty claim commit). Rejected push = taken;
   move on.
3. **Check**, per note: run every `Verify` checkbox verbatim and record actual vs expected; probe
   the `Unverified` list first among your own investigations; read the work with fresh eyes — you
   are the decorrelated second opinion. Respect `Do-not-relitigate` unless you hold *evidence* a
   listed decision is wrong — then file that evidence as a finding; never silently rewrite.
4. **Act — validate-then-apply, never blind rewrites:** validate each candidate finding in
   context first. Mechanical + proven (failing repro, broken reference, stale doc): fix it, land
   through normal review. Judgment/architecture: advisory write-up with evidence in the note or
   the work's review thread — do NOT restructure the author's work (blind cross-model
   "improvement" measurably degrades good work; SOP § Direction guidance). Dispute freely: a
   failing Verify step against behavior you believe correct gets a written disagreement with
   evidence.
5. **Close** — flip `Status: DONE (<your-provider>, <date>, <ref | "no findings" | summary>)` in
   the same change as your findings. "No findings" is a valuable close. Never delete note files.
6. **Escalate, don't absorb:** a finding that implies production/credential/gate action, or
   contradicts an approved plan, is surfaced to the operator — the crosscheck loop never executes
   it. If a finding needs a judgment call you cannot make, ask one focused question.

## Interop with the compounding queue

A crosscheck finding that is *new fixable work* beyond the note's scope becomes a compounding item,
not a sprawling crosscheck thread. A crosscheck note asks "is this specific work right?"; a
compounding item says "here is a thing to improve." Keep the two clean; the `X-`/`C-` id prefixes
keep the parsers disjoint by construction.
