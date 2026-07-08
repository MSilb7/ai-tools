- **Product PRD (`docs/product/PRD.md`) — the north star.** Read it first, write back to it. It holds the
  vision, non-negotiable principles, the capability list + statuses, the user-story behavioral contract, and the
  roadmap. It is **desired-state, reconciled against reality every thread**: a new behavior adds/upgrades its
  user story FIRST (⚠️-clear a genuinely new one); work that **invalidates** a stated preference updates the PRD
  in the same PR; work that **drifts** is corrected or the PRD is consciously updated (logged) — never a silent
  divergence; drift you can't resolve now is filed as a compounding item routing the PRD update forward. Surface
  it at session start (vision + open roadmap); run **`/prd-reconcile`** on a cadence to reconcile desired-vs-reality.
  <!-- compounding-system: v5 — installed from claude_tools; run /compounding upgrade -->
