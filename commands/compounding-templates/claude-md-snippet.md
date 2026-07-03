- **Compounding queue (`docs/compounding/`):** any session that encounters something fixable — an
  error worked around, silent output, an undocumented interface, or a non-obvious learning — writes a
  `docs/compounding/YYYY-MM-DD-HHMM.md` entry with a **Goal** + **Acceptance criteria**
  (format: `docs/compounding/SOP.md`). At session start run `node scripts/compounding-status.mjs`
  (fallback `ls docs/compounding/`) and surface OPEN items. Items are born `Ready: no`; flipping to
  `yes` is the deliberate "AC are firm" act; a daily `compounding-drain` routine works one
  `Ready: yes` item per fire to a PR (SOP.md § Auto-drain). Statuses update continuously — flip them
  in the same PR as the change, never park them for a wrap-up. Improvements to the compounding
  system itself get `Upstream: claude_tools` (SOP.md § Upstreaming).
  <!-- compounding-system: v1 — installed from claude_tools; run /compounding upgrade -->
