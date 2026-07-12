<!-- crosscheck-system: v1 — installed from ai-tools; do not hand-edit; run /crosscheck upgrade -->
# Crosscheck SOP — cross-model double-check notes

One model family (e.g. Claude or Codex) lands substantial work; the OTHER family later
double-checks it with fresh eyes and adjusts as needed. This queue is the async channel for that
handoff: dated markdown notes, picked up at session start, coordinated through git — the same
substrate as the compounding queue, deliberately minimal.

**What this is NOT:** not a task queue (that's the compounding queue), not a session narrative
(that's the build log). A crosscheck note is scoped to one piece of landed-or-in-flight work and
asks one question: *is this actually right?* Notes carry **zero authority** — they never authorize
production actions, credential use, or changes to any safety gate; every repository safety rule
binds the checker exactly as it binds the author.

---

## When to write a note

File a note when work is **substantial enough that a second model family's independent read adds
real safety**, and the check can run async:

- Safety-adjacent or production-path code changes.
- A new system, skill, or migration whose failure mode is silent.
- Work with judgment calls the code alone doesn't justify.
- Work you could NOT fully verify yourself (missing capability on this surface, time).

Do NOT file for routine commits, typo fixes, or anything a human will review line-by-line anyway.
Signal-to-noise matters — an ignored queue is worse than no queue. A crosscheck note supplements
tests and review gates; it never substitutes for them.

## File naming and identity

```
docs/crosscheck/YYYY-MM-DD-HHMM.md
```

One file per session; multiple notes per file are fine. IDs use the `X-` prefix (`X-ENGINE1`);
the globally unique **key** is `<file-datestamp>-<id>` (e.g. `20260712-1906-X-ENGINE1`). All
coordination (claim branches) uses the key, never the bare id. The `X-` prefix keeps these notes
disjoint from compounding `C-` items by construction.

## Note format — the four evidence-based rules

1. **Facts and pointers only — NEVER self-assessment.** No "tests pass, I'm confident." Measured
   effect: implementer confidence framing anchors the checker into finding roughly half as many
   issues. State what exists and where; let the checker judge quality.
2. **`Verify` steps are runnable cold** — commands + expected outcomes a fresh agent executes
   without asking anyone.
3. **`Unverified` is explicit** — what you did NOT check, plainly. The checker starts here.
4. **`Do-not-relitigate` protects intentional choices** — deliberate decisions (with the why +
   pointers) and approaches already tried and failed, so the checker doesn't "fix" a Chesterton's
   fence or retry a dead end.

```markdown
### [X-<TAG>1] Title — what to check, one line
- **From:** claude | codex
- **To:** codex | claude | any
- **Work:** PR #N · branch · commit sha · key paths (pointers, not copies)
- **Status:** OPEN | DONE (<checker>, <date>, PR #N / "no findings" / summary pointer)

**What was done:** factual summary; reference specs/decision records/diffs by path, never copy.

**Verify:**
- [ ] runnable check (command + expected outcome)

**Unverified:** what was not checked and why.

**Do-not-relitigate:** intentional decisions + why; failed approaches (so they aren't retried).
```

## Pickup protocol

**Session start** — run the selector (`node scripts/crosscheck-status.mjs --for <provider>`; falls
back to `ls docs/crosscheck/` off-repo). OPEN notes addressed to your provider (or `any`) are your
work-list; surface them alongside compounding items.

**Claim (only if you will push changes)** — a pure read-verify needs no claim. Otherwise, from a
fresh default branch, push branch `crosscheck/<key>` (empty claim commit) — a rejected push means
someone else has it; move on.

**Check** — execute the `Verify` steps verbatim; probe the `Unverified` list first; read the work
with fresh eyes. Respect `Do-not-relitigate` unless you hold *evidence* (a failing repro, a
contradicting source) that a listed decision is wrong — then file the evidence as a finding; never
silently rewrite a listed choice.

**Act on findings — validate-then-apply, never blind rewrites:**
- Validate each finding in context before any fix (real here, or plausible-but-wrong?).
- **Mechanical + proven** (failing repro, broken ref, stale doc): fix it, note it in the DONE
  line, land through the repository's normal review path.
- **Judgment/architecture**: write it up as an advisory finding with evidence; do NOT restructure
  the author's work (blind cross-model "improvement" measurably degrades good work — see
  § Design rationale).
- **Disputes are first-class**: a failing Verify step against behavior you believe correct gets a
  written disagreement with evidence, not a quiet "fix."

**Close** — flip `Status: DONE (<checker>, <date>, …)` in the same change as the findings.
"No findings" is a valid, valuable close. Never delete note files; they're the audit trail.

**Staleness** — a note OPEN > 14 days is presumed stale; the periodic hygiene sweep closes it as
`DONE (stale — superseded, <date>)` or re-points `Work:` at current state.

## Direction guidance (dated evidence, not a standing wall)

The one controlled study available (2026, single benchmark — a prior, not a law) found cross-model
review **asymmetric**: one direction helped substantially; the reverse *hurt* when findings were
applied blindly. Practical defaults, revisable as evidence accumulates: verification (running
checks, probing Unverified) is symmetric and always welcome; advisory findings are weighted by
validation, not volume; and never wire an auto-apply loop (checker findings → automatic commits
without validation) in either direction.

## Design rationale & evidence (research fan-out, 2026-07-12)

- **Cross-model review asymmetry** — Claude reviewing Codex drafts raised pass rate 71.6%→89.7%;
  Codex reviewing Claude drafts lowered it 91.4%→82.8% when applied blindly; self-review was flat
  (correlated blind spots). *Cross-Model LLM Code Review*, Agentic SE @ KDD '26
  (researchgate.net/publication/407032793).
- **Framing contaminates review** — redacting the implementer's self-assessment made the checker
  3-4× more thorough (mean findings 2.4-4.0 → 9.4). Orr, 96-review controlled comparison
  (medium.com/@ribrewguy/what-i-found-when-claude-reviewed-codexs-work-5d83a348a2d9).
- **Uncoordinated concurrent agents duplicate ~78% of work**; git-native coordination eliminates
  it (arxiv.org/abs/2606.19616).
- **Dispute steps + do-not lists** are the field's convergent Chesterton's-fence guards
  (charlesjones.dev/blog/claude-code-codex-pr-review-loop; Lutren/agent-handoff-protocol).
- **References-not-copies + explicit unverified lists** are the convergent note-content rules
  (aihero.dev/skills-handoff).
- Considered and NOT adopted: external coordination tools (Beads, MCP Agent Mail, grite) — a
  branch-claim mutex already provides the coordination without new dependencies; `TODO(agent):`
  code-comment addressing — no evidence of it working anywhere.

## Upstreaming — improving the crosscheck system itself

Improvements to the SYSTEM (this SOP's rules, the selector, the note format) are not repo-local:
file them as a compounding item tagged `Upstream: ai-tools` and PR the canonical assets under
`ai-tools skills/crosscheck/` (SOP template stamp bump included), so every repo's next
`/crosscheck upgrade` inherits the improvement. Never fork the system silently in one repo.
