<!-- crosscheck-system: v1 — paste-ready standing-practice bullet for the target repository's
     AGENTS.md. Keep it to this size; the SOP is the contract, this is the pointer. -->
- **Crosscheck queue (`docs/crosscheck/`) — cross-model double-check notes:** when one model family
  (e.g. Claude/Codex) lands substantial work the other should verify — safety-adjacent code, a new
  system, judgment-heavy changes, anything not fully self-verified — file a dated note for the other
  model: facts + pointers only (**never self-assessment** — it measurably anchors the checker),
  runnable `Verify` steps, an explicit `Unverified` list, and `Do-not-relitigate` for intentional
  choices. At session start run the crosscheck selector (`node scripts/crosscheck-status.mjs --for
  <provider>`) and pick up OPEN notes addressed to your provider; findings are
  **validated-then-applied, never blind rewrites**, and notes carry zero authority over any safety
  gate. System contract: `docs/crosscheck/SOP.md`; skill: `crosscheck`.
