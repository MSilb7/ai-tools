# AGENTS.md — AI Tools

This repository is the canonical source for reusable AI-agent skills, supporting resources, and
installation tooling. Claude Code and Codex are first-class targets. Keep reusable workflows
compatible with the open Agent Skills format so other clients can adopt them with thin discovery
adapters.

## Repository layout

- `skills/<name>/SKILL.md` — canonical portable skills. New reusable workflows belong here.
- `skills/<name>/agents/openai.yaml` — required Codex UI metadata; it must not contain workflow logic.
- `skills/<name>/references/<provider>-*.md` — provider capability adapters, read only when that
  runtime is selected.
- `commands/` — thin legacy Claude Code invocation wrappers. Never put reusable workflow logic here.
- `commands/compounding-templates/` — versioned compatibility assets for repositories installed
  before lifecycle workflows became portable. New workflow logic belongs in skills.
- `scripts/install-skills` — installs the shared skills through symlinks and refreshes compatibility
  links without overwriting real files.

## Cross-agent skill rules

- Use lowercase hyphenated skill directory names and include only `name` and `description` in
  portable `SKILL.md` frontmatter.
- Describe triggers clearly in `description`; keep the body imperative, concise, and tool-neutral.
- Refer to capabilities rather than product tool names. For example, say "ask one focused question"
  instead of requiring a specific question tool.
- Put provider-specific behavior in a clearly named reference or platform adapter. Do not duplicate
  the portable workflow.
- Portability does not mean lowest-common-denominator behavior. Keep the invariant method in
  `SKILL.md`, then use native provider features through explicit adapters for scheduling, execution
  isolation, connectors, permissions, models, notifications, and UI actions.
- Keep `SKILL.md` under 500 lines. Move detailed playbooks to one-level-deep `references/`, repeatable
  deterministic work to `scripts/`, and copyable templates to `assets/`.
- Preserve legacy command paths until their replacements are installed and verified in both Claude
  Code and Codex.

## Portable repository lifecycle

The canonical lifecycle is a cooperating skill set, not a provider-specific command suite:

- `compounding` installs, upgrades, or inspects the repository system.
- `compounding-drain` works one ready improvement safely.
- `compounding-curate` keeps standing context lean and correctly routed.
- `crosscheck` runs the cross-model double-check loop: one model family files evidence-shaped
  notes (no self-assessment, runnable verification, do-not-relitigate) for the other to verify
  with validated-then-applied findings.
- `prd-reconcile` keeps confirmed product direction aligned with reality.
- `maintain-technical-design` keeps the implementation map current.
- `catch-up` establishes read-only session context.
- `capture-learning` routes discoveries to durable sources.
- `end-session-review` closes documentation, validation, queue, and review loops.
- `repository-hygiene` owns recurring maintenance, with separate automation-runtime adapters.
- `sync-ai-tools` installs and verifies the same canonical skills for every supported agent.

New repository setups must expose these behaviors through `AGENTS.md` and the shared skill layer.
`CLAUDE.md`, Codex configuration, and other provider files may import or point to the shared layer,
but must not become independently maintained copies. Claude Workflows, Codex scheduled tasks, and
other native features remain first-class adapters around portable skills.

## Continuous improvement

- Treat a confirmed product or architecture decision as a documentation event. When a repository has
  a PRD, technical design, or governing decision record, update the affected source in the same change;
  do not wait for implementation to make the decision durable.
- Fix obvious low-risk gaps inline. Route larger, uncertain, or recurring work to the compounding queue
  with evidence and acceptance criteria, and never leave a substantive follow-up only in chat prose.
- Prefer durable repository homes over memory-only notes. When a non-obvious multi-step procedure recurs,
  make it a repository-local skill; when it generalizes across repositories, use `promote-skill` to improve
  canonical AI Tools and replace duplicated standing prose with a pointer.
- Before ending substantive work, check affected product and technical docs, compounding status, validation,
  and stranded work. Every loose end must be completed, queued for an agent, or identified as a true
  operator-only action.

## Verification

`.github/workflows/ci.yml` runs the mechanical checks (steps 1-4 and 7) on every pull request, so
the portability contract is enforced automatically; still run them locally before pushing.

After changing shared skills or installation behavior:

1. Run `node scripts/validate-skills.mjs`.
2. Run `scripts/install-skills --dry-run` and inspect both Claude and Codex targets.
3. Run `node --test scripts/install-skills.test.mjs` when changing discovery or the portable
   lifecycle set.
4. Run `node --test scripts/portability.test.mjs` when changing provider adapters or workflow
   placement.
5. Confirm every top-level file under `commands/` is a thin compatibility wrapper.
6. Validate each changed skill with the available Agent Skills validator.
7. Run `node --test commands/compounding-templates/*.test.mjs` when touching the compounding system
   or repository-wide validation.
8. Check `git diff` and confirm no generated cache, credentials, or unrelated user changes are
   included.

## Compounding queue

The existing self-improvement queue remains active during this migration. When an agent encounters a
fixable error, silent output, undocumented interface, or non-obvious learning, add a scoped entry to
`docs/compounding/YYYY-MM-DD-HHMM.md` following `docs/compounding/SOP.md`. At session start, run
`node scripts/compounding-status.mjs` and surface relevant OPEN items. Update statuses in the same
change that makes them true.

The compounding templates still use the exact legacy marker `Upstream: claude_tools`. Preserve that
marker until the template pack, installed copies, and consuming repositories migrate together.
