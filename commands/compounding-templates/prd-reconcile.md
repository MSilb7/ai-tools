---
description: >
  Reconcile the product PRD (docs/product/PRD.md) against reality — the desired-vs-actual pass that keeps the
  north-star document from going stale as the product grows. Reads the PRD, sweeps what changed since it was last
  reconciled (merged PRs, the build log / changelog, new decision records, open compounding items) and classifies
  each divergence: PRD stale → update it; work drifted → flag to correct or consciously update; new
  capability/story not yet in the PRD → add it. Proposes a diff; meaning-bearing changes are operator-approved;
  lands as a PR. Use on a cadence (weekly hygiene) or on demand ("reconcile the PRD", "is the product doc current?").
argument-hint: "[since <git-ref or date> — default: the PRD's last-reconciled marker]"
---

<!-- compounding-system: v8 — installed from claude_tools; do not hand-edit; run /compounding upgrade -->

# /prd-reconcile — keep the product north star current (desired-state vs reality)

`docs/product/PRD.md` is **desired-state**; the running system + merged work is **reality**. This is the GitOps
pass that reconciles them (the same discipline as the compounding system's own hygiene, applied to the product
spec). It **proposes before it changes**; a divergence that changes a *rule's meaning* is operator-approved.
Changes land as a PR. If the repo has no `docs/product/PRD.md`, say so and offer `/compounding setup` (which
installs the skeleton) — do not invent one silently.

## STEP 0 — read the desired state
Read `docs/product/PRD.md` end to end: vision, principles/invariants, the capability list + statuses, the user
stories + statuses, and the roadmap. Note the last-reconciled marker (`git log -1 -- docs/product/PRD.md`).

## STEP 1 — gather reality since last reconcile
`git fetch origin <default-branch>` first (never reconcile off a stale base), then sweep what changed since the
marker:
- **Merged PRs** since the marker (titles/bodies for shipped capabilities, new preferences, edge-cases-that-
  became-rules).
- **Confirmed operator decisions in the current discovery or planning thread** that change the outcome,
  priorities, scope, non-goals, or success criteria even when implementation has not started.
- **Build log / changelog** entries since the marker (what's built / in-flight / decided).
- **New or changed decision records** (`docs/decisions/` or the repo's equivalent) — a new binding invariant
  belongs in the principles section.
- **Technical-design changes** (`docs/technical/TECHNICAL_DESIGN.md` or equivalent) that reveal a product
  capability, constraint, or roadmap status no longer represented at product altitude. Leave implementation
  detail in the technical document.
- **Open compounding items** that represent a capability/gap the PRD should name, or that are tagged for the PRD.
- **Live status drift** — a capability/story marked PARTIAL/UNBUILT that has since shipped (or regressed).

## STEP 2 — classify each divergence
- **PRD-STALE** — reality shipped/changed and the doc didn't → update the PRD (a status flip, a new capability
  line, a new invariant, a roadmap item now done). *Safe to apply.*
- **DRIFT** — the work strays from a still-valid PRD preference/story → the PRD is right; surface it (correct the
  work, or the operator consciously changes the PRD — a logged decision). *Do not silently rewrite the rule.*
- **NEW-UNCAPTURED** — a capability/behavior with no story/capability line → add it; if a genuinely new *kind* of
  behavior, mark it ⚠️ needs-operator-review.
- **ROADMAP-MOVE** — a roadmap item started/finished, or a new one emerged → update the roadmap + tied stories.
- **PRD-TECH-MISMATCH** — product intent and the technical design no longer trace or agree → surface both
  sources and route the implementation-side change through `maintain-technical-design`; do not copy technical
  detail into the PRD.

## STEP 3 — propose
A table: divergence → tag → the one-line PRD edit (before→after / new line / status flip). Batch the safe
PRD-STALE + status flips; surface DRIFT and ⚠️ NEW-UNCAPTURED as explicit operator decisions (this pass changes
whether/where the doc matches reality, not what the rules *should* be — a rule's meaning is the operator's call).
Anything unresolved → file a compounding item routing the PRD update forward.

## STEP 4 — apply (safe / approved items) → PR
Apply the safe status flips + capability/roadmap updates and any operator-approved rule changes. Refresh the
dated last-reconciled marker. Open a PR (docs-only → the compounding auto-merge path can land it; a rule change →
describe it and ask to merge). Report before→after: statuses flipped, capabilities added, drifts flagged.

## Hard rules
- **Proposes before it rewrites.** The operator owns every meaning-bearing change to a principle or story.
- **Never delete a story or invariant to "tidy"** — a retired one is marked retired with a date + why, not
  removed. (Trim/compress prose with `/compounding-curate`, not here.)
- **One canonical home.** If reality contradicts the PRD, the PRD changes (or the work does) — the two never
  coexist in disagreement. A second copy of vision/stories elsewhere → collapse it to a pointer.
- **Keep distinct altitudes.** The PRD owns what/for whom/why; technical documentation owns how; decision
  records own architectural rationale; executable/generated sources own exact detail.
- **Reconciliation is itself compounding:** if the same drift recurs (a capability that keeps shipping without a
  story), file a queue item to fix the source.
