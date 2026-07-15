<!-- prd: canonical product north-star. Installed by `/compounding setup` (only if docs/product/PRD.md is
     absent — an existing PRD is NEVER overwritten). Fill this in for THIS product, then KEEP IT CURRENT:
     it is desired-state, reconciled against reality every thread (see § 7). One canonical home; no forks.
     compounding-system: v7 — the PRD skeleton is versioned; your filled-in content is yours (not overwritten
     by /compounding upgrade). -->
# PRD — <product name> (the product north star)

**What this is:** the single living description of *what this product is, how it works, what's built, and where
it's going*. Read from and written back to every thread — not a write-once spec. It sits at **functionality
altitude** (capabilities, principles, user stories, roadmap). `docs/technical/TECHNICAL_DESIGN.md` owns the
implementation map, decision records own technical rationale, and executable/generated sources own exact detail.

**Status legend:** **BUILT** (code + tests exist) · **PARTIAL** (works with caveats / manual steps) ·
**UNBUILT** (roadmap) · **DECLINED** (a dated, reopenable "no").

**Keep it current:** this doc is *desired-state*; the running system is *reality*. When a thread's work diverges,
either the work drifts back or the doc is consciously updated — see **§7**. One canonical home; no parallel copies.

---

## 1 — Vision
**One-liner:** *<one sentence: what the product does for its user, and the core "unit" it operates on>.*

<Who it's for; the core framing / mental model; what "good" looks like. Then **Non-goals** — what this product
deliberately is NOT (mark any that are v1-only constraints vs permanent).>

## 2 — Principles (non-negotiable invariants)
<The axioms every thread is held to. Each should ideally trace to a decision record. Mark v1-only constraints as
such (they're current-phase, not eternal). Keep operator *working preferences* — how the agent reports/behaves —
in CLAUDE.md, not here.>
- **<principle>** — <the rule, terse>.

## 3 — Capabilities (what it does today)
<Grouped by domain. Each line = a capability + status. This is the readable "how it works".>
### <domain>
- <capability> — **BUILT / PARTIAL / UNBUILT**

## 4 — User stories (the behavioral contract)
<Every change should be checkable against a story here; add/upgrade the story BEFORE building a new behavior
(⚠️-mark a genuinely new one until the operator reviews it). ID · one-line statement · status.>
- **US-1.1 · <title>** — <as the user, I can …> — **BUILT/PARTIAL/UNBUILT**

## 5 — Roadmap (where it's going)
<Near-term + longer-term; each item names its tied user story so a future thread picks it up cold.>
- **<item>** — <what + why> — **UNBUILT**

## 6 — Live state (pointers, not prose)
<Any state that is authoritative elsewhere (a DB, a generated report) — reference how to render it fresh; do NOT
inline values that will rot. Delete this section if the product has no such state.>

## 7 — How this document stays current (the reconciliation protocol)
The PRD is **desired-state**; the running system + each thread's work is **reality**. Keeping them in sync is a
first-class loop:
- **Read at thread start.** `catch-up` (or session start) reads this PRD first — the vision + open roadmap — so a
  continuation thread lands on the pre-established stories.
- **Check during work.** A confirmed product decision during discovery or planning updates this document before
  implementation. New behavior → add/upgrade its **user story (§4) first**. **Invalidation** (work makes a stated
  preference/story wrong) → update the PRD in the same PR. **Drift** (work strays from a still-valid rule) →
  correct the work, or consciously update the PRD and say why. Can't resolve now → file a **compounding item**
  routing the PRD update forward.
- **Reconcile on a cadence.** **`/prd-reconcile`** runs the desired-vs-reality pass; the end-of-session review
  carries a PRD-drift check. Use `maintain-technical-design` for implementation design and cross-document
  `PRD-TECH-MISMATCH` findings.
- **One canonical home.** Vision/spec/stories/roadmap live here; other docs point in, never fork.
