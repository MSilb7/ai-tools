---
description: Create a weekly repo-hygiene cloud routine (claude.ai code trigger) for a repo — detects its stack, picks the right test/typecheck gate and safety constraints, and registers a per-repo Sunday routine that opens a hygiene PR (never merges). Use when the user says "create the weekly checker / hygiene routine for <repo>", or when bootstrapping a new repo.
argument-hint: "[repo: a local path, an owner/repo slug, or omit for the current repo]"
---

Create a **per-repo weekly repo-hygiene cloud routine** via the `RemoteTrigger` tool. Each routine clones ONE repo on Sunday, scans it across five dimensions, auto-applies only obvious fixes on a branch, runs a stack-appropriate gate, and opens a PR for review (NEVER merges). This skill is the repeatable recipe behind that family of routines.

Target repo = `$ARGUMENTS` (a local checkout path, a GitHub `owner/repo` slug, or — if empty — the current repo / cwd).

**Modes:** if `$ARGUMENTS` is `reconcile`, do RECONCILE MODE (coverage: repos missing a routine). If `$ARGUMENTS` is `audit`, do AUDIT MODE (the checker-of-the-checker: coverage + correctness/drift of existing routines) — this is the recommended weekly run and subsumes reconcile. Both modes are at the bottom of this file. Otherwise create/refresh a single routine for the target repo.

## Step 1 — Gather facts (do NOT guess; validate against the repo)

If you have a local checkout, run these under the repo root; otherwise inspect via `gh`:
- **Slug + default branch:** `git remote get-url origin` → `owner/repo`; `git symbolic-ref refs/remotes/origin/HEAD` (usually `main`).
- **Stack** — look for: `bun.lockb`/`package.json` (bun), `pnpm-workspace.yaml`/`pnpm-lock.yaml` (pnpm workspace), `pyproject.toml`/`requirements.txt` (Python), `Cargo.toml` (Rust), `go.mod` (Go).
- **Test/typecheck scripts that actually exist** — read `package.json` scripts, or `pyproject.toml` `[tool.pytest]`/`[tool.ruff]`, etc. Only gate on commands that exist.
- **Docs present** — any of `CLAUDE.md`, `AGENTS.md`, `README`, `docs/BUILD_LOG.md`, `docs/decisions`, `docs/repo-hygiene-loop.md`.
- **Risk surface** — does it move money / sign transactions / place orders? Look for trading SDKs, wallet/signer/private-key handling, `.env*`, `ssh/`, `data/*.db`, `:execute`-style scripts.
- **Focus dirs** — where the meaningful code lives (e.g. `src/`, packages, the engine dir).

## Step 2 — Map stack → gate

| Stack | Install | Gate (only the parts that exist) |
|---|---|---|
| bun | `bun install` | `bun test` (or a focused subset) + `bun run typecheck` |
| pnpm workspace | `pnpm install --frozen-lockfile` | `pnpm -r run test` + `pnpm -r run typecheck` |
| Python | venv + `pip install -e '.[dev]'` (fallback `-e .` then `pip install pytest ruff`) | `.venv/bin/pytest -q` + `.venv/bin/ruff check .` |
| Rust | — | `cargo test` + `cargo clippy -- -D warnings` |
| Go | — | `go test ./...` + `go vet ./...` |
| none runnable | — | skip the gate, say so in the PR, auto-apply only doc/text fixes |

## Step 3 — Map risk surface → HARD CONSTRAINTS

Always include: no history rewrite; `git add` exact paths only (never `git add -A`); on a committed secret/key/seed, flag LOUDLY in the PR body and STOP; minimal, reversible changes. Then add the repo-specific block:
- **Trading/brokerage repo:** do NOT touch live trading, broker MCPs/connectors, kill switches, `ENGINE_LIVE`/real-money config, DB credentials, or `data/*.db`; never alter order/decision logic.
- **On-chain/wallet repo:** do NOT touch private keys / seed phrases / signer config / RPC keys / `.env*`; NEVER run any `:execute` or tx-signing/broadcasting script; never alter on-chain tx logic.
- **Generic repo:** do NOT touch `.env*`, credentials, or `data/`; hygiene only.

## Step 4 — Pick a free cron slot

The convention is **Sundays in the 13:00 UTC hour, staggered, off the :00 mark** (`M 13 * * 0`). Call `RemoteTrigger` `list`, collect minutes already used by existing `Weekly repo-hygiene — *` routines (currently :07 PF, :17 investment-agent, :27 onchain-bots, :37 polymarket), and pick the next unused (e.g. :47, :53). If the 13:00 hour fills up, roll to `M 14 * * 0`.

## Step 5 — Compose the prompt

Fill this template (single repo). Keep the dimensions, the [OBVIOUS-FIX]/[PROPOSE] tagging, the gate, and the "open a PR even if zero fixes; never merge" rule:

```
You are the weekly repo-hygiene agent for <REPO> (github.com/<SLUG>)<ROLE_NOTE>. Headless cloud, zero prior context. Trunk is `<BRANCH>`.

GOAL: sweep this ONE repo for cleanup + improvements, auto-apply only safe/obvious fixes on a new branch, and open ONE PR with the full punch-list for human review. NEVER merge.

STEPS:
0. ENV CHECK — if `git rev-parse --is-inside-work-tree` fails or `<SLUG>`'s expected paths are absent, this environment has NO repo attached: do NOT probe the filesystem or search for credentials (it trips credential classifiers); STOP and alert the operator "Environment misconfigured — attach <SLUG> as this routine's repository source at claude.ai; cannot run until then." (This routine sets `session_context.sources` at create so this should never fire — if it does, the env lost its source and the run would otherwise silently no-op.)
1. `git fetch origin && git checkout <BRANCH> && git pull --ff-only`. <DOCS_NOTE>
2. SCAN across five dimensions; prioritized punch-list, each item tagged [OBVIOUS-FIX] (low-risk, mechanical) or [PROPOSE] (judgment/risky/bigger) with file:line + effort S/M/L. Focus: <FOCUS>.
   (a) Dead code / duplication / simplification.
   (b) DOC DRIFT — compare <DOCS> against the merged code; flag inaccurate/missing/contradictory. HIGHEST SEVERITY: <DRIFT_SEV>.
   (c) Test gaps on critical paths — <CRIT_PATHS>; skipped tests; mock-only assertions.
   (d) Artifact / secret / .gitignore hygiene — committed artifacts, `.gitignore` gaps, TODO/FIXME triage, a LOUD secrets check.
   (e) SIMPLIFICATION SWEEP — the same knowledge duplicated in N places (report the copies + which single home should be canonical, the rest becoming pointers — duplication is how copies go stale); procedures/docs that have accreted steps no longer paying rent; legacy dual-formats past their deprecation window; guards stacked where the underlying thing could just be made simple — prefer making the thing simple over adding another guard on top of it. Rank by rent paid: duplication in always-loaded files (CLAUDE.md, AGENTS.md, skills) costs every session. Small+safe ⇒ [OBVIOUS-FIX]; bigger ⇒ [PROPOSE].
3. Create branch `chore/weekly-hygiene-$(date +%Y%m%d)`. AUTO-APPLY only [OBVIOUS-FIX] items. Then run the gate: <GATE> — must pass. If an applied fix breaks the gate, revert THAT fix and move it to [PROPOSE].
4. `gh pr create --base <BRANCH>` titled `chore(repo): weekly hygiene <YYYY-MM-DD>`, body = full punch-list + gate result. DO NOT MERGE. Zero obvious fixes → still open a PR/issue.
5. FINAL REPORT: PR link, # obvious fixes applied, gate pass/fail, # [PROPOSE] items, any LOUD secret finding.

HARD CONSTRAINTS: <CONSTRAINTS>. Do NOT rewrite git history. `git add` exact paths only (never `git add -A`). On a committed secret/key/seed, flag LOUDLY in the PR body and STOP. Keep changes minimal and reversible.
```

## Step 6 — Confirm, then create

Show the user the resolved slug, stack, gate, cron slot, and a one-line summary of the constraints. On confirmation, call `RemoteTrigger` `create` with this body (one source + one outcome; an explicit branch name like `claude/weekly-hygiene-<repo>`):

```json
{
  "name": "Weekly repo-hygiene — <REPO>",
  "cron_expression": "<MINUTE> 13 * * 0",
  "enabled": true,
  "notifications": { "channel": { "push": true, "email": false, "slack": false } },
  "job_config": { "ccr": {
    "environment_id": "env_01J2E9PNdQ5NB67jJyswnQT8",
    "events": [{ "data": { "message": { "role": "user", "content": "<COMPOSED PROMPT>", "type": "user", "uuid": "<repo>-weekly-hygiene-0001" }, "parent_tool_use_id": null, "session_id": "", "type": "user" } }],
    "session_context": {
      "allowed_tools": ["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
      "autofix_on_pr_create": false,
      "model": "claude-sonnet-4-6",
      "outcomes": [{ "git_repository": { "git_info": { "branches": ["claude/weekly-hygiene-<repo>"], "repo": "<SLUG>" } } }],
      "sources": [{ "git_repository": { "url": "https://github.com/<SLUG>" } }]
    }
  }}
}
```

Report the new trigger id and `next_run_at`.

## Reconcile mode (`/add-weekly-hygiene reconcile`)

Find repos that should have a weekly hygiene routine but don't, and offer to create them. Must run in a LOCAL session (RemoteTrigger needs the session OAuth; a headless cloud routine can't create triggers).

1. **Existing routines:** `RemoteTrigger` `list` → collect names matching `Weekly repo-hygiene — *` and the repo slug in each `sources[].git_repository.url`. Also note used Sunday cron minutes.
2. **Candidate repos:** the user's *active personal* repos — NOT every repo. Default candidates = the ones with a routine today plus any the user names. Optionally `gh repo list MSilb7 --no-archived --source -L 100` to enumerate, but DO NOT assume all of them want a routine (forks, work/`op-*`, archives, scratch repos usually don't). Treat the list as a menu, not a mandate.
3. **Gap:** candidates with no routine. Present them to the user as a short checklist with each repo's detected stack, and ask which to add (offer "all", "none", or a subset). NEVER bulk-create without confirmation.
4. For each chosen repo, run Steps 1–6 above (assigning the next free cron slot per repo). Report the new routine ids.

This is the web-UI safety net: there's no creation hook, so reconcile is how coverage stays complete. Consider running it at the start of any repo-hygiene session, or on a periodic local `/loop`.

## Audit mode (`/add-weekly-hygiene audit`) — the checker-of-the-checker

Periodically verify the existing weekly-hygiene routines are still CORRECT, not just present. Run locally (needs RemoteTrigger). Recommended weekly. For each routine from `RemoteTrigger` `list` whose name matches `Weekly repo-hygiene — *`, check its prompt/config against the repo's current reality and flag drift:

1. **Branch drift** — the prompt hardcodes the trunk (`git checkout <BRANCH>`). Confirm the repo's default branch (`gh repo view <slug> --json defaultBranchRef`) still matches. Mismatch → routine will fail.
2. **Stack/gate drift** — re-detect the stack (Step 1). If it changed (e.g. bun→pnpm, a new `typecheck` script, Python test runner change), the embedded gate command is now wrong → update it.
3. **Template drift** — compare the routine's prompt to the current template in this skill (Step 5). If the skill's template has improved since the routine was created, the routine is stale → re-render and update.
4. **Safety-surface drift** — re-assess the risk surface (Step 1/3). If the repo gained a live/signing/order-placement seam not covered by the routine's HARD CONSTRAINTS, that's the highest-severity finding → tighten the constraints.
5. **Health** — `enabled` true? `last_fired_at` recent (fired on schedule)? cron sane and not colliding with another routine's minute? inert env MCP connectors present (known, low priority — see gotchas)? **Repo-bound?** — `session_context.sources[].git_repository.url` present and non-empty; a repo-touching routine with empty `sources` boots into an empty home behind a 403 git proxy and **silently no-ops** — **highest severity, page the operator immediately** to attach the repo at claude.ai.
6. **Coverage** — also run RECONCILE MODE (new repos missing a routine).
7. **Compounding coverage** — a repo with no `docs/compounding/SOP.md` → propose `/compounding setup`
   for it (the self-improvement queue + Ready gate + daily auto-drain system; see
   `commands/compounding.md`). A repo WITH the system: check its installed stamps against the current
   `commands/compounding-templates/VERSION` — stale → propose `/compounding upgrade`.

8. **Fleet repo-less scan (ALL routines, not just hygiene).** From the same `RemoteTrigger list`, check
   EVERY routine whose prompt reads/writes a repo — trader, scanner, thesis-watch, hygiene, etc. — for a
   non-empty `session_context.sources[].git_repository.url`. Any repo-touching routine with empty `sources`
   is booting repo-less and **silently failing**; page the operator to attach its repo at claude.ai. This is
   the global backstop for routines created from the desktop/web app (which cannot set `sources`) — run it
   after any non-CLI routine creation, not just on the weekly sweep. (Skip pure broker/API-read probes that
   legitimately touch no repo.)

Output a short punch-list per routine: OK, or the specific drift + the fix. For any routine needing a prompt/gate/branch/constraint change, apply it with `RemoteTrigger` `update` resending the **full** `job_config` (partial updates drop nested fields — see gotchas). Confirm with the user before applying changes to live routines. End with a one-line "N routines OK, M updated, K repos missing coverage, R repo-less (PAGE)."

## Gotchas (verified 2026-06-28)

- **MCP connectors are env-injected and inert.** `create` injects the environment's default connectors (Blockscout, Robinhood) into `mcp_connections`. You CANNOT clear them via `update` — both `[]` and `null` are no-ops — and `RemoteTrigger` has no delete action. They're harmless here because `allowed_tools` lists no MCP tools and each connector's `permitted_tools` is `[]`, so the agent cannot call them. Leave them; don't claim you removed them.
- **`update` is partial; empty/null array fields are ignored.** Scalar fields (`enabled`, `cron_expression`) update fine. To change `sources`/`outcomes`/prompt, resend the full `job_config`.
- **One routine per repo > one routine with many sources.** A multi-source routine keeps a single shared prompt; per-repo routines let each carry its own stack gate and risk-specific constraints. Prefer per-repo.
