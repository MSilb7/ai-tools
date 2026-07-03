---
description: >
  Set up, upgrade, or check the compounding self-improvement system in ANY repo — the
  capture → machine-readable queue → Ready-gate → daily-auto-drain loop proven in investment-agent.
  Use when the user says "set up compounding", "improvement backlog", "self-improvement queue",
  "add the compounding system", when bootstrapping a new repo, or when a repo lacks
  docs/compounding/. Modes: setup (default) installs the full tiered system in one PR and guides the
  routine walkthrough; upgrade syncs a repo's installed files to the latest canonical templates;
  status runs the selector.
argument-hint: "[setup|upgrade|status] [repo path — default: current repo]"
---

# /compounding — the centralized, self-updating compounding system

One canonical system (this skill + its template pack) that every repo inherits: sessions **capture**
improvement ideas as structured queue items; a **selector** derives each item's state from git/PR
reality; a **Ready gate** keeps automation off half-scoped ideas; a **daily drain routine** works
one firm item per fire to a PR; **status hygiene** keeps the queue truthful without anyone asking.
Spec: `docs/superpowers/specs/2026-07-03-compounding-skill-design.md` (claude_tools).

Mode = first word of `$ARGUMENTS` (`setup` | `upgrade` | `status`; default `setup` — but if the
target repo already has `docs/compounding/SOP.md`, say so and run `upgrade` instead). Target repo =
second argument or the current repo.

## 0 — Resolve the canonical templates

```bash
SKILL_REAL=$(readlink -f ~/.claude/commands/compounding.md)
TPL=$(dirname "$SKILL_REAL")/compounding-templates
CANON_ROOT=$(cd "$(dirname "$SKILL_REAL")/.." && pwd)   # the claude_tools checkout
git -C "$CANON_ROOT" pull --ff-only 2>/dev/null || true  # best-effort freshness
cat "$TPL/VERSION"                                       # must print a number
```

If the symlink doesn't resolve (e.g. cloud session without the claude_tools checkout), fetch each
template raw from `https://raw.githubusercontent.com/MSilb7/claude_tools/main/commands/compounding-templates/<file>`
(files: `VERSION`, `SOP.md`, `compounding-status.mjs`, `compounding-status.test.mjs`,
`auto-merge-journal.yml`, `compounding-drain.md`, `claude-md-snippet.md`).

## 1 — Detect (validate, don't guess — same discipline as /add-weekly-hygiene)

Under the target repo root: `git remote get-url origin` (slug; no remote ⇒ no workflow tier, no
auto-merge — note it), default branch (`git symbolic-ref refs/remotes/origin/HEAD`), stack
(`bun.lockb`/`package.json` ⇒ bun/node; `pyproject.toml`/`requirements.txt` ⇒ python; `Cargo.toml`
⇒ rust; `go.mod` ⇒ go; none ⇒ docs-only repo), CLAUDE.md present?, `.github/workflows/` present?,
the repo's green-check commands (only gate on commands that exist), and whether
`docs/compounding/SOP.md` already exists (⇒ `upgrade`).

## 2 — SETUP mode (installs on a branch; ONE PR; never push the default branch)

Branch: `compounding/setup-v$(cat "$TPL/VERSION")`. Install (skip any piece that already exists,
and say so):

1. `docs/compounding/SOP.md` ← `$TPL/SOP.md`
2. `scripts/compounding-status.mjs` ← `$TPL/compounding-status.mjs`
   - package.json stacks: add `"compounding-status": "node scripts/compounding-status.mjs"` to
     `scripts`. Other stacks: the plain `node scripts/compounding-status.mjs` invocation is the
     documented path (node ≥18 required — check `node --version`; absent node = note it and install
     anyway, the drain routine's cloud env has node).
3. `.claude/commands/compounding-drain.md` ← `$TPL/compounding-drain.md`
4. CLAUDE.md: append the bullet from `$TPL/claude-md-snippet.md` (create CLAUDE.md containing a
   `# CLAUDE.md — <repo>` header + the bullet if the file is absent).
5. GitHub repos only: `.github/workflows/auto-merge-journal.yml` ← `$TPL/auto-merge-journal.yml`.
   State the TRUST BOUNDARY in the PR body: *"PRs touching only docs/compounding/** will squash-merge
   without review once this lands; requires Actions read/write workflow permissions."*
6. Smoke: `node scripts/compounding-status.mjs` from the repo root runs clean (`total=0` on a fresh
   queue is correct).
7. Open ONE PR titled `feat: compounding system v<VERSION> — queue, selector, drain worker`.
   Per the merge-asks standing practice: ask permission to merge; on approval, merge and confirm
   the workflow shows up under Actions.

## 3 — Guided routine walkthrough (after the PR exists)

Present the menu — what each piece does, what it costs, what it needs:

| Routine | What it does | Default |
|---|---|---|
| **Daily compounding-drain** | one `Ready: yes` item per fire → PR; status hygiene every fire | **recommended ON** — cron `0 14 * * *` UTC (stagger vs other repos' drains if the operator runs several) |
| **Weekly hygiene integration** | existing `/add-weekly-hygiene` routine for this repo gets 1 line added to its prompt: "run `/compounding upgrade`; review STALE/NEEDS-REVIEW queue items"; no hygiene routine yet → suggest `/add-weekly-hygiene` | ON if a hygiene routine exists |
| **Capture** | passive — the CLAUDE.md bullet makes every session file items | already ON via setup |
| **Domain scanners** | repo-specific opportunity scanners (see investment-agent's news scanner as the pattern) | pointer only — not auto-built |

Interactive → AskUserQuestion for which to enable. Autonomous/directed → daily drain only, note the rest.

For each enabled routine, **probe trigger capability first** (varies by surface; never assume, never
end "blocked" — degrade to a paste-ready apply pack in the PR body + file the creation step):

- **W+ (full-config trigger tool, e.g. RemoteTrigger on a claude.ai-OAuth CLI):** create with the
  **hardened recipe** — one `create` carrying the full `job_config.ccr`:
  `events[0].data.message.content` = `"Invoke the compounding-drain skill
  (.claude/commands/compounding-drain.md) and follow it exactly."` + the drain template text as a
  redundancy mirror (state: repo copy wins on divergence); `session_context.sources =
  [{git_repository: {url: "<repo https url>"}}]` (**this is what repo-binds an agent-created
  trigger**); `session_context.model` per the repo's model policy (executors pin latest Sonnet);
  standard `allowed_tools` (no broker/exchange tools); cron from the menu; push notification on.
  **THEN immediately `get` the trigger and read top-level `mcp_connections`** — creation
  auto-attaches the account's default connectors and API removal is silently ignored (UI-only). Any
  connector attached ⇒ the ONE operator ask is: *"detach <names> from the new routine at claude.ai
  (routine config → connectors)"* — page it, don't bury it. Also confirm `sources` is present in the
  returned config before calling the routine live.
- **Not W+:** write the apply pack (trigger name, cron, model, prompt, sources requirement, the
  connector-check warning) into the PR body and file the creation as the one operator/CLI step.

## 4 — UPGRADE mode

1. Resolve `$TPL` + pull (step 0). Canonical version: `cat "$TPL/VERSION"`.
2. Read the repo's installed stamps: `grep -rn "compounding-system: v" docs/compounding/SOP.md
   scripts/compounding-status.mjs .claude/commands/compounding-drain.md
   .github/workflows/auto-merge-journal.yml CLAUDE.md 2>/dev/null`.
3. For each installed file whose stamp version < canonical OR whose content differs from the
   template: replace it **wholesale** on branch `compounding/upgrade-v<VERSION>` (stamped files are
   canonical-owned — hand edits to them are lost by design; improvements belong upstream, say so in
   the PR body). Preserve the repo's own queue entries untouched (`docs/compounding/*.md` session
   files are never templates).
4. Smoke (`node scripts/compounding-status.mjs`), then PR with a per-file `current → new` table.
   Ask permission to merge per the merge-asks practice (a weekly hygiene fire instead leaves the PR
   for review).

## 5 — STATUS mode

Run the repo's selector (`compounding-status` script, or `node scripts/compounding-status.mjs`); if
the repo isn't bootstrapped, run the canonical template directly from the repo root:
`node "$TPL/compounding-status.mjs"`. Report the summary line + the top 3 ELIGIBLE (or the top
BLOCKED reasons when empty) and any STALE/NEEDS-REVIEW that need a human.

## Hard rules (all modes)

- PRs only; never push a repo's default branch; never force-push; never delete branches with
  unmerged work.
- The drain worker gets NO connectors and NO repo credentials; repos with money-moving/state-mutating
  systems keep those out of the worker's reach entirely (the template's DEV-worker limits).
- Degrade gracefully at every tier; end by naming exactly what was installed, what was skipped and
  why, and the (at most one) operator ask.
- Friction found while running THIS skill is itself a queue item — file it in the target repo tagged
  `Upstream: claude_tools` (SOP § Upstreaming). That's how the compounding system compounds.
