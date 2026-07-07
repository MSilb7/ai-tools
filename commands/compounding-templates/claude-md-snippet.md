- **Compounding queue (`docs/compounding/`):** any session that encounters something fixable — an
  error worked around, silent output, an undocumented interface, or a non-obvious learning — writes a
  `docs/compounding/YYYY-MM-DD-HHMM.md` entry with a **Goal** + **Acceptance criteria**
  (format: `docs/compounding/SOP.md`). At session start run `node scripts/compounding-status.mjs`
  (fallback `ls docs/compounding/`) and surface OPEN items. Items are born `Ready: no`; flipping to
  `yes` is the deliberate "AC are firm" act; a daily `compounding-drain` routine works one
  `Ready: yes` item per fire to a PR (SOP.md § Auto-drain). A drained fix is validated **held-in** (a
  bug ships a fails-before/passes-after test) **and held-out** (full gate green), and may never reach
  green by weakening the grader that judges it (SOP § Validating a fix). Statuses update continuously —
  flip them in the same PR as the change, never park them for a wrap-up. The system's skills are all
  namespaced `compounding-*`: **`/compounding-drain`** (work an item), **`/compounding-curate`** (keep
  the always-on context lean — run periodically), **`compounding-status`** (state), **`/compounding`**
  (setup/upgrade). Full surface + naming rule: SOP § The system's skills. Improvements to the system
  itself get `Upstream: claude_tools` (SOP.md § Upstreaming).
  <!-- compounding-system: v3 — installed from claude_tools; run /compounding upgrade -->
