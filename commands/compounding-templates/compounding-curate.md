---
description: >
  Curate the always-on context so the self-improvement loop doesn't rot it. A periodic pass over a
  repo's shared AGENTS.md practices, the compounding SOP, and any "current state" doc, with the technical
  index as an optional curation surface: measure weight, then dedup, compress, promote stable
  practices into skills, and retire stale/duplicated entries. Use on a cadence (weekly hygiene) or on
  demand when always-on context has grown heavy. Proposes before it cuts; meaning-bearing changes need
  operator sign-off; changes land as a PR.
argument-hint: "[repo path — default: current repo]"
---

<!-- compounding-system: v8 — installed from claude_tools; do not hand-edit; run /compounding upgrade -->

# /compounding-curate — keep the hot context lean (context lifecycle)

The compounding loop only ever **adds** knowledge — that is its job — but nothing **subtracts**. So the
always-on context (AGENTS.md standing practices, this SOP, a "Current State" / BUILD_LOG head) grows
unbounded and eventually **collapses**: too long to reason over, internally duplicated, self-
contradicting, with stale rules sitting next to live ones. This command is the subtractive half of the
loop — the context-lifecycle pass that keeps the itemized playbook itemized.

It is **read-only until it proposes**: analyze → propose a diff → operator approves the meaning-bearing
moves → PR. It never silently rewrites judgment-bearing prose; it changes *where* and *how tersely*
knowledge lives, not *what the rules are*.

## STEP 0 — scope
Target repo = first argument or the current repo. Read the always-on surfaces — the context every
session pays for before it does any work:
- **AGENTS.md** — the canonical shared standing practices. Inspect provider files such as CLAUDE.md only
  for provider-specific guidance or duplicated shared rules.
- **docs/compounding/SOP.md**.
- Any single-source-of-truth **"current state"** doc the repo loads first (e.g. a `BUILD_LOG.md`
  "Current State" block, a `STATE.md`).

Also locate `docs/technical/TECHNICAL_DESIGN.md` as a possible curation surface. It is an on-demand index,
not automatically hot context: inspect its headings and links first, then open only sections or linked topic
documents implicated by duplication, staleness, or excessive size. Never load the full technical tree by default.

## STEP 1 — measure (name the cost)
Report the weight of each always-on block: line count + bullet count. Flag any over a soft budget —
rule of thumb: a standing-practices block **> ~60 lines / ~15 bullets**, or a "current state"
**> ~40 lines**, is a curation candidate. Naming the cost is half the value; a block nobody measures
grows forever. Report technical-index weight separately from always-on cost; flag it when it stops behaving as a
map (for example, exact schemas, generated API detail, or volatile runtime inventories have been copied inline).

## STEP 2 — find the rot (four moves)
1. **Duplication** — the same rule/fact stated in N places (AGENTS.md + a provider adapter + a skill + a technical topic +
   an ADR + a routine prompt). Collapse to ONE canonical home + pointers. Duplication is *how* copies go stale.
2. **Staleness** — a practice tied to a since-changed state, a "temporary/for now" note past its
   window, or a dated preference already absorbed into a skill or a guard/test. Retire it (move the
   rationale to an ADR/changelog if it carries a decision; don't just delete a "why").
3. **Mechanism-vs-content bleed** — a *procedure* (how to do X, a multi-step recipe) sitting inline in
   always-on prose belongs in a **skill** the model invokes on demand, NOT in every session's context.
   Promote repository-specific procedures locally; when the workflow generalizes across repositories,
   use `promote-skill` to improve canonical AI Tools. Leave a one-line pointer in standing context.
4. **Compression** — a 6-line bullet that says what 2 lines could. Tighten: keep the numbers, the
   load-bearing clause, and the "why"; drop the narrative retelling.

## STEP 3 — propose (operator owns meaning)
Present a table: each candidate → move (`dedup` / `retire` / `promote` / `compress`) → the one-line
before→after, or the destination it moves to. **Nothing that changes a rule's MEANING happens without
operator sign-off** — this pass changes location and terseness, not the rules. Any "is this still
true?" item is surfaced as a **question**, never auto-retired. Pure compressions and dedup-to-pointer
of a verbatim duplicate are safe to batch; a retirement or a promotion is an explicit approve.

## STEP 4 — apply (approved items only) → PR
Apply the approved moves. Where a practice is promoted, create/extend the skill and replace the inline
prose with a one-line pointer. Open a PR (docs-heavy; if the repo has the compounding auto-merge
workflow and the diff is docs-only it can auto-merge, else human review). Report before→after weight
(the whole point: the block got smaller without losing a rule).

## Hard rules
- **Proposes before it cuts.** The operator owns every meaning-bearing deletion.
- **Never drop a safety invariant, a dated decision's rationale, or a fact-ledger entry to "save
  space"** — those move to their canonical home, they don't disappear.
- **Do not collapse distinct truth altitudes.** Product behavior stays in the PRD; implementation design stays
  in the technical index/topics; decision rationale stays in ADRs; exact details stay in executable or generated
  sources. Curate duplication into pointers across those boundaries.
- **Curation is itself compounding:** if the SAME rot pattern recurs (e.g. a skill that keeps
  appending lines to AGENTS.md), file a queue item to fix the *source*, tagged `Upstream: claude_tools`
  if it's a system-level habit.
