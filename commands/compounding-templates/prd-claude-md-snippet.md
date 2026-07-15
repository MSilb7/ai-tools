- **Product PRD (`docs/product/PRD.md`) — the north star.** Read it first, write back to it. It holds the
  vision, non-negotiable principles, the capability list + statuses, the user-story behavioral contract, and the
  roadmap. It is **desired-state, reconciled against reality every thread**: a new behavior adds/upgrades its
  user story FIRST (⚠️-clear a genuinely new one). Once the operator confirms a product decision during discovery
  or planning, update the PRD before implementation rather than waiting for code to ship. Work that **invalidates**
  a stated preference updates the PRD in the same PR; work that **drifts** is corrected or the PRD is consciously
  updated (logged) — never a silent divergence. Drift you can't resolve now becomes a compounding item. Surface
  the vision + open roadmap at product-work start and run **`/prd-reconcile`** on a cadence.
  <!-- compounding-system: v8 — installed from claude_tools; run /compounding upgrade -->
