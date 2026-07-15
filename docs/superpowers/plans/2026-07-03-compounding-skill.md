# /compounding Skill Implementation Plan

> **Status: COMPLETED.** This plan shipped as the `/compounding` skill + template pack (originally v1,
> now v6) and was later superseded by the portable-skills migration — the live system is the
> `compounding`, `compounding-drain`, `compounding-curate`, `prd-reconcile`, and
> `maintain-technical-design` skills under `skills/`, backed by `commands/compounding-templates/` and
> this repo's own self-hosted `docs/compounding/`. Kept as a historical record; the checkboxes below
> reflect the plan as originally scoped and are not live-tracked.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/compounding` skill + template pack in claude_tools per `docs/superpowers/specs/2026-07-03-compounding-skill-design.md`, integrate with add-weekly-hygiene, migrate investment-agent to the canonical system, and live-validate by bootstrapping a second repo.

**Architecture:** One lean skill (`commands/compounding.md`, symlinked globally) resolves a sibling template pack at runtime (readlink → claude_tools; GitHub-raw fallback). The portable selector is a zero-dep single-file `.mjs` behaviorally identical to investment-agent's `queue.ts` (the reference), tested with `node --test`. Setup/upgrade/status modes; per-repo installs are version-stamped; upstreaming flows through `Upstream: claude_tools` queue items.

**Tech Stack:** Plain Node ≥18 ESM (also runs under bun), `node --test`, markdown skills. No packages.

## Global Constraints

- Zero dependencies in templates; the selector shells out only to `git` and (optionally) `gh`.
- Lock key = `<file-datestamp>-<localid>`; claim branch `compounding/<key>`; states DONE / IN-PROGRESS / CLAIMED / NEEDS-REVIEW / STALE / BLOCKED / ELIGIBLE; ranking severity desc → effort asc → oldest key. `--json` contract: `{generatedAt, degraded, maxEffort, items, eligible}`. `COMPOUNDING_MAX_EFFORT` default `low`.
- Branch existence is the load-bearing lock; PR data optional (degraded mode safe).
- Every installed template carries the stamp line `compounding-system: v1 — installed from claude_tools; do not hand-edit; run /compounding upgrade` (yml/mjs: in a comment; md: in an HTML comment).
- Reference implementation for behavior: investment-agent `src/server/engine/compounding/queue.ts`, `scripts/compounding-status.ts`, `docs/compounding/SOP.md`, `.claude/commands/compounding-drain.md`, `.github/workflows/auto-merge-journal.yml` (all on `main`; local checkout at `/Users/michaelsilberling/Documents Local/GitHub/investment-agent`).
- Never push to a repo's main; PRs only. Trigger creation uses the C-CONN1-hardened recipe (create with `sources`+model in the full `ccr` body → `get` → check `mcp_connections` → operator detach is UI-only).
- Commit trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure (claude_tools)

- `commands/compounding.md` — the skill: mode dispatch + detect + install + guided routines + upgrade + status
- `commands/compounding-templates/VERSION` — `1`
- `commands/compounding-templates/compounding-status.mjs` — parser+classifier+ranking+CLI in one portable file
- `commands/compounding-templates/compounding-status.test.mjs` — node --test fixtures
- `commands/compounding-templates/SOP.md` — canonical SOP (generalized)
- `commands/compounding-templates/auto-merge-journal.yml` — path-guard workflow template
- `commands/compounding-templates/compounding-drain.md` — drain worker template
- `commands/compounding-templates/claude-md-snippet.md` — per-repo CLAUDE.md bullet
- Modify: `commands/add-weekly-hygiene.md` (AUDIT coverage check), `README.md`

---

### Task 1: Portable selector `compounding-status.mjs` + tests (TDD)

**Files:**
- Create: `commands/compounding-templates/compounding-status.mjs`
- Test: `commands/compounding-templates/compounding-status.test.mjs`

**Interfaces:**
- Produces (exported for tests, CLI runs when executed directly): `datestampFromFileName(fileName)`, `parseCompoundingFile(fileName, content)`, `claimBranch(key)`, `classifyQueue(items, refs, maxEffort="low")`, `rankEligible(classified)`. `refs = {branches: string[], prs: PrInfo[]|null, now: Date, staleDays?: number}`; `PrInfo = {headRef, title, state: "open"|"closed"|"merged", updatedAt: string|null}`.

- [ ] **Step 1: Write the failing test file** — port ALL cases from investment-agent `src/server/engine/compounding/__tests__/queue.test.ts` (read it; it is the behavioral contract) to `node:test`/`node:assert` syntax. Same fixtures verbatim (BRACKETED, LEGACY, BARE_HEADER), same assertions: parser fields, MED normalization, CLOSED-INVALID⇒done, C1-collision distinct keys, unknown pickup, SOP skip; classifier DONE / IN-PROGRESS / STALE(idle>7d) / NEEDS-REVIEW / CLAIMED(degraded) / orphan-branch STALE / all five BLOCKED causes / ceiling adjustable / ELIGIBLE / key-scoped C1 lock; ranking order; claimBranch. Import style: `import {parseCompoundingFile, …} from "./compounding-status.mjs";` and `import test from "node:test"; import assert from "node:assert/strict";` (use `assert.equal`/`assert.deepEqual`).

- [ ] **Step 2: Run to verify failure**

Run: `cd "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" && node --test commands/compounding-templates/ 2>&1 | tail -3`
Expected: FAIL — cannot find module `compounding-status.mjs`.

- [ ] **Step 3: Implement the selector** — direct port of investment-agent `queue.ts` (parser+classifier+ranking, read it and translate types away) plus the CLI main from `scripts/compounding-status.ts` with these deltas:
  - Header comment: `// compounding-system: v1 — installed from claude_tools; do not hand-edit; run /compounding upgrade` + one-paragraph doc.
  - Pure ESM JS, exported functions as in Interfaces.
  - CLI (runs only when `import.meta.url === pathToFileURL(process.argv[1]).href`): reads `docs/compounding/*.md` matching `/^\d{4}-\d{2}-\d{2}-\d{4}\.md$/`; `remoteClaimBranches()` via `spawnSync("git", ["ls-remote","origin","refs/heads/compounding/*"])` (null exit → warn to stderr, return []); `listPrs()` via `gh pr list --state all --limit 200 --json headRefName,title,state,updatedAt,mergedAt` (failure → null = degraded); grouped stderr report in state order ELIGIBLE, IN-PROGRESS, CLAIMED, NEEDS-REVIEW, STALE, BLOCKED, DONE; stdout = summary line, or full JSON with `--json`. Use `node:child_process.spawnSync` and `node:fs` — no Bun APIs.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" && node --test commands/compounding-templates/ 2>&1 | tail -4`
Expected: all tests pass (≥19 subtests), 0 fail.

- [ ] **Step 5: Cross-validate against the reference repo** (behavioral identity check)

Run: `cd "/Users/michaelsilberling/Documents Local/GitHub/investment-agent" && node "/Users/michaelsilberling/Documents Local/GitHub/claude_tools/commands/compounding-templates/compounding-status.mjs" 2>/dev/null`
Expected: summary line with the same `eligible/blocked/done/total` counts as `bun run compounding-status` in that repo.

- [ ] **Step 6: Commit**

```bash
git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" add commands/compounding-templates/ && git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" commit -m "feat(compounding): portable zero-dep selector + node --test fixtures

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Template pack (SOP, workflow, drain skill, CLAUDE.md snippet, VERSION)

**Files:**
- Create: `commands/compounding-templates/VERSION` (content: `1`)
- Create: `commands/compounding-templates/SOP.md`
- Create: `commands/compounding-templates/auto-merge-journal.yml`
- Create: `commands/compounding-templates/compounding-drain.md`
- Create: `commands/compounding-templates/claude-md-snippet.md`

**Interfaces:**
- Produces: the exact files `setup` copies into target repos (Task 3 references them by these names).

- [ ] **Step 1: SOP.md** — copy investment-agent `docs/compounding/SOP.md` (main) and apply: (a) stamp comment at top; (b) generalize repo-specifics: "investment-agent"→"this repo"; `bun run compounding-status` → `node scripts/compounding-status.mjs` presented as the canonical invocation with a note "repos with a package.json get a `compounding-status` script alias; the reference implementation (investment-agent) uses a native TS module — behavior is identical"; drop references to that repo's routines/BUILD_LOG, keep every rule (Ready gate, lock key, derived states, auto-drain protocol, status-currency-is-continuous). (c) ADD the upstream rule under a new `## Upstreaming — compounding the compounding system` section: any improvement to the SYSTEM itself (SOP wording, selector behavior, drain protocol, workflow) is filed as a queue item tagged `Upstream: claude_tools` on its own line after `Pickup:`; executing it means PRing `github.com/MSilb7/claude_tools` (templates + VERSION bump), after which every repo's next `/compounding upgrade` inherits it.
- [ ] **Step 2: auto-merge-journal.yml** — copy investment-agent `.github/workflows/auto-merge-journal.yml`, stamp comment at top, ALLOWED paths = `docs/compounding/` only (the news-journal path is investment-agent-specific; note in a comment: "add repo-specific append-only journal paths here deliberately — every added path widens what merges without review").
- [ ] **Step 3: compounding-drain.md** — copy investment-agent `.claude/commands/compounding-drain.md` (main, incl. STEP 1.5), stamp; replace `bun run compounding-status --json` with `node scripts/compounding-status.mjs --json` + note "(or the repo's `compounding-status` package script)"; replace investment-agent runbook pointers with "see docs/compounding/SOP.md"; keep hard limits, add "no repo-specific credentials/secrets ever" to the DEV-worker limits line (generalizing the no-Turso rule).
- [ ] **Step 4: claude-md-snippet.md** — the per-repo bullet, verbatim:

```markdown
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
```

- [ ] **Step 5: Verify + commit** — re-read each template checking: no investment-agent-only references remain (grep `-i "investment-agent\|turso\|robinhood\|sleeve"` — allowed ONLY in the SOP's reference-implementation note), every file stamped.

```bash
git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" add commands/compounding-templates/ && git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" commit -m "feat(compounding): template pack v1 — SOP, workflow, drain worker, CLAUDE.md snippet

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: The skill — `commands/compounding.md`

**Files:**
- Create: `commands/compounding.md`

**Interfaces:**
- Consumes: template filenames from Task 2; selector contract from Task 1.

- [ ] **Step 1: Write the skill.** Frontmatter description (triggering): "Set up, upgrade, or check the compounding self-improvement system in ANY repo — the capture→queue→Ready-gate→daily-auto-drain loop proven in investment-agent. Use when the user says 'set up compounding', 'improvement backlog', 'self-improvement queue', 'add the compounding system', when bootstrapping a new repo, or when a repo lacks docs/compounding/. Modes: setup (default) installs the full tiered system in one PR and guides routine creation; upgrade syncs a repo's installed files to the latest canonical templates; status runs the selector." `argument-hint: "[setup|upgrade|status] [repo path — default: current repo]"`.

  Body sections (write them fully, following add-weekly-hygiene's voice):
  1. **Resolve templates**: `TPL=$(dirname "$(readlink -f ~/.claude/commands/compounding.md)")/compounding-templates` ; verify `$TPL/VERSION` exists; ALSO `git -C "$(dirname "$TPL")/.." pull --ff-only` best-effort so the canonical copy is fresh; fallback if unresolved: fetch each template raw from `https://raw.githubusercontent.com/MSilb7/claude_tools/main/commands/compounding-templates/<file>`.
  2. **Detect (validate, don't guess)**: repo root, `git remote get-url origin`, default branch, stack (bun.lockb / package.json / pyproject.toml / Cargo.toml / go.mod / none), CLAUDE.md present?, `.github/workflows/` present?, existing `docs/compounding/` (→ suggest `upgrade` instead of setup).
  3. **SETUP mode**: branch `compounding/setup-v<VERSION>`; copy templates → `docs/compounding/SOP.md`, `scripts/compounding-status.mjs`, `.claude/commands/compounding-drain.md`; package.json stacks: add `"compounding-status": "node scripts/compounding-status.mjs"` script; GitHub repos: copy `auto-merge-journal.yml` → `.github/workflows/` and state the trust boundary in the PR body (docs/compounding/** merges without review); CLAUDE.md: append the snippet (create the file with just the bullet if absent); smoke: `node scripts/compounding-status.mjs` runs clean (empty queue OK); open ONE PR, never push main.
  4. **Guided routine walkthrough** (after the PR): present the menu — (a) daily compounding-drain (recommended; cron `0 14 * * *` or staggered per repo), (b) weekly hygiene integration (existing add-weekly-hygiene routine → add "run `/compounding upgrade`; review STALE/NEEDS-REVIEW" to its prompt; none → suggest `/add-weekly-hygiene`), (c) capture = passive via the CLAUDE.md bullet (nothing to create), (d) domain scanners = pointer only. Interactive → AskUserQuestion; autonomous → default (a) only. For each enabled: **probe trigger capability first** (never assume; never end "blocked"); W+ → create via the hardened recipe: full body incl. `job_config.ccr` with `events[0]` prompt = "Invoke the compounding-drain skill (.claude/commands/compounding-drain.md) and follow it exactly." + the drain template text as mirror (repo copy wins), `session_context.sources=[{git_repository:{url:<repo url>}}]`, model per the repo's policy (executors pin latest Sonnet), THEN `get` and check `mcp_connections` — **creation auto-attaches account-default connectors; removal is UI-only** → if any attached, the ONE operator ask is the detach (page it, don't bury it); confirm `sources` in the returned config before reporting live. Not W+ → paste-ready apply pack in the PR body + file the creation step.
  5. **UPGRADE mode**: read installed stamps (`grep -r "compounding-system: v"` over the 5 install paths); compare to `$TPL/VERSION` + content diff; replace stale stamped files wholesale on a branch → PR (hand edits to stamped files are lost by design — improvements belong upstream; say so in the PR body); report per-file current→new.
  6. **STATUS mode**: run the repo's selector (fallback `node $TPL/compounding-status.mjs` from the repo root when not yet bootstrapped); report the grouped summary + eligible top-3.
  7. **Hard rules**: PRs only; no secrets; drain routines get no connectors and no repo credentials; degrade gracefully per tier and end by naming what was installed / skipped / the (≤1) operator ask.

- [ ] **Step 2: Self-consistency check** — every file the skill copies exists in Task 2's pack with that exact name; selector invocations match Task 1's CLI; the routine recipe matches the C-CONN1 lessons in the SOP template.

- [ ] **Step 3: Commit**

```bash
git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" add commands/compounding.md && git -C "/Users/michaelsilberling/Documents Local/GitHub/claude_tools" commit -m "feat(skill): /compounding — setup/upgrade/status with guided routine walkthrough

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Integrations — add-weekly-hygiene coverage check, README, symlink, ship

**Files:**
- Modify: `commands/add-weekly-hygiene.md` (AUDIT MODE section)
- Modify: `README.md`

- [ ] **Step 1: add-weekly-hygiene AUDIT** — in AUDIT MODE's checks, add: `- **Compounding coverage:** repo has no docs/compounding/SOP.md → propose running /compounding setup for it (the self-improvement queue + daily drain system; see commands/compounding.md). A repo WITH the system: check its stamps are at the current templates VERSION — stale → propose /compounding upgrade.`
- [ ] **Step 2: README** — add a line to the commands list: `- **/compounding** — set up / upgrade / check the compounding self-improvement system (queue + Ready gate + daily auto-drain) in any repo; canonical templates in commands/compounding-templates/ (VERSION-stamped; improvements arrive as Upstream: claude_tools queue items).`
- [ ] **Step 3: Symlink + verify** — run the sync (per `commands/sync-commands.md`: symlink `commands/*.md` into `~/.claude/commands/`); verify: `readlink ~/.claude/commands/compounding.md` resolves into claude_tools and `$TPL/VERSION` reads `1` through the resolved path.
- [ ] **Step 4: Ship claude_tools** — final `node --test` green → push `feat/compounding-skill` → `gh pr create` → merge (operator pre-authorized this build) → verify main; delete branch.

---

### Task 5: Self-host + investment-agent migration

- [ ] **Step 1: Self-host claude_tools** — run `/compounding setup` semantics on claude_tools itself (it is a GitHub repo, stack=none): install `docs/compounding/SOP.md` + `scripts/compounding-status.mjs` + CLAUDE.md bullet + workflow; SKIP the drain routine (queue starts empty; note it as available). Fold into a small PR → merge. Smoke: `node scripts/compounding-status.mjs` → `total=0`.
- [ ] **Step 2: investment-agent migration PR** — branch off fresh `origin/main`: (a) SOP.md top gets: `<!-- compounding-system: v1 (reference implementation) — canonical skill: github.com/MSilb7/claude_tools commands/compounding.md; this repo keeps its native TS selector (src/server/engine/compounding/queue.ts); behavior contract is shared -->`; (b) add the same `## Upstreaming` section as the SOP template; (c) CLAUDE.md compounding bullet gets one sentence: `System-level improvements are tagged Upstream: claude_tools and PR'd to the canonical skill (SOP.md § Upstreaming).` Run `bun run compounding-status` + `bun test src/server/engine/compounding/` green → PR → merge.

---

### Task 6: Live validation — bootstrap a second repo

- [ ] **Step 1:** Target = personal-finance (operator may redirect). Locate the local checkout (`ls ~/Documents\ Local/GitHub/`); `git fetch` + branch from its default.
- [ ] **Step 2:** Execute the skill's SETUP mode against it for real: detect stack, install all applicable tiers, open the PR (leave for operator review — do NOT merge another repo's PR unprompted), run its selector to prove `total=0` clean.
- [ ] **Step 3:** Guided-routine phase at whatever capability the session has: W+ → offer/create the daily drain per the hardened recipe with the connector check; report the operator ask if connectors auto-attach.
- [ ] **Step 4:** Report: PR link, selector output, routine state, any operator steps — and file any friction found during setup as the first `Upstream: claude_tools` item (eating our own dog food).

## Self-Review Notes

- Spec coverage: §3 layout (T1–T3), §4 modes+walkthrough (T3), §5 selector+tests (T1), §6 both update directions (T2 SOP upstream section, T3 upgrade, T5), §7 integrations+migration (T4, T5), §8 acceptance 1–5 (T1 step 4–5, T4 step 3, T6, T5, merges in T4/T5), §9 risks each mapped (stamps/upgrade T3.5, fixtures both sides T1.5, C-CONN1 recipe T3.4, raw fallback T3.1, pull-first T3.1, trust boundary T3.3).
- Type consistency: selector export names/`refs`/`PrInfo` identical across T1 interfaces, T3 invocations; template filenames identical across T2/T3.
- No placeholders: porting steps name exact source files + exact deltas; new content is specified verbatim or by complete section list.
