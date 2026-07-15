# AI Tools

A canonical home for reusable AI-agent skills, scripts, references, and compatibility adapters.
Claude Code and Codex are first-class targets; other clients can consume the same Agent Skills
packages when they support `SKILL.md` or expose a compatible discovery directory.

The canonical GitHub repository is `MSilb7/ai-tools`. The stable `~/.ai-tools` anchor decouples
agent discovery from the checkout's local folder name.

## Portable skills

- `interview` — clarify requirements, constraints, priorities, and success criteria before acting.
- `pretty-print` — design consistent, readable terminal and CLI output.
- `codebase-review` — audit a repository for gaps, duplication, simplification, and product issues.
- `data-science` — plan, execute, validate, and communicate rigorous reproducible analysis.
- `migrate-agent-config` — audit and generalize an existing repository's AI-agent setup.
- `promote-skill` — move a proven project-local workflow into the canonical skill repository.
- `compounding` — set up, upgrade, or inspect the repository improvement system.
- `compounding-drain` — work one ready queue item through proof and review.
- `compounding-curate` — keep standing agent context concise and correctly routed.
- `crosscheck` — set up and run cross-model double-check notes between agent families.
- `prd-reconcile` — align confirmed product direction and shipped reality.
- `maintain-technical-design` — maintain the repository's concise implementation map.
- `catch-up` — build a read-only current-state briefing.
- `capture-learning` — route a discovery into the correct durable source.
- `end-session-review` — reconcile docs, validation, queue, and review state at close.
- `repository-hygiene` — run or schedule recurring maintenance through native runtime adapters.
- `sync-ai-tools` — install and verify the same canonical skills for supported agents.

Each canonical skill lives at `skills/<name>/SKILL.md`. Provider-specific behavior belongs in a
reference or adapter, not in a duplicate copy of the workflow.

## Install

Preview every link without changing the machine:

```bash
scripts/install-skills --dry-run
```

Install for both Claude Code and Codex:

```bash
scripts/install-skills
```

Or install one target:

```bash
scripts/install-skills --target claude
scripts/install-skills --target codex
```

The installer creates a stable `~/.ai-tools` link to this checkout, then links skill directories
into `~/.claude/skills/` and `~/.agents/skills/`. During migration it also refreshes the existing
`~/.claude/commands/` links. It updates symlinks but never overwrites real files or directories.

Codex user-scope discovery at `~/.agents/skills/` was verified on 2026-07-14 with Codex CLI
0.133.0 in a Codex Desktop session: the native skill catalog listed the installed lifecycle skills,
including `$catch-up`, after `scripts/install-skills --target codex`. This matches the current
[Codex skill-location documentation](https://learn.chatgpt.com/docs/build-skills.md#where-to-save-skills).

After moving or renaming the checkout, rerun the installer from its new location. The platform links
continue to point through `~/.ai-tools`, so only the stable anchor needs to change.

## Provider capability adapters

Every reusable method lives in a portable skill. Native features remain available through explicit,
progressively loaded adapters; for example, `repository-hygiene` has separate references for Claude
Workflows and Codex scheduled tasks. This preserves each runtime's repository binding, execution
isolation, connector, permission, scheduling, notification, and UI capabilities without duplicating
the maintenance workflow.

Thin files under `commands/` remain only so existing Claude invocations resolve to canonical skills.
Codex metadata under `agents/openai.yaml` is discovery metadata only. Neither surface owns workflow
logic.

## Reorient an existing repository

Do not mass-rewrite an existing repository's agent configuration. Start with a read-only audit of
its instruction files, project skills, symlinks, scheduled workflows, and hard-coded repository
references. A useful first prompt is:

```text
Audit this repository's AI-agent setup for the AI Tools migration. Inspect AGENTS.md, CLAUDE.md,
.claude/, .agents/, symlinks, scheduled workflows, and references to claude_tools (the former
repository name). Classify each
item as portable workflow, Claude-specific integration, Codex-specific integration, historical
documentation, or stale configuration. Propose the smallest behavior-preserving migration; do not
change files until the plan is reviewed.
```

Repository-specific workflows should stay local. Shared workflows should point to the canonical
skill packages. Historical build logs should remain historical unless they are still operational
documentation.

## Authoring rules

- Put new shared workflows in `skills/<name>/SKILL.md` using lowercase hyphenated names.
- Use only `name` and `description` in portable frontmatter.
- Keep tool names and model names out of the portable core.
- Put detailed reference material in `references/`, deterministic helpers in `scripts/`, and
  copyable templates in `assets/`.
- Put native scheduling, connector, permission, model, environment, and UI behavior in a clearly
  named provider reference. Keep the invariant method in `SKILL.md`.
- Run the skill validator, `scripts/install-skills --dry-run`, the cross-client installer test, and
  relevant workflow tests before committing.

## Compounding system

The portable lifecycle is implemented by `compounding`, `compounding-drain`,
`compounding-curate`, `prd-reconcile`, `maintain-technical-design`, `catch-up`,
`capture-learning`, and `end-session-review`. The existing versioned template pack remains under
`commands/compounding-templates/` as compatibility infrastructure for repositories installed before
this migration. Do not add new workflow logic there or rename its legacy
`Upstream: claude_tools` marker piecemeal.

Compounding v6 installs three maintained pillars: the improvement queue, the product PRD, and a
concise technical-design index backed by the portable `maintain-technical-design` skill. New setups
make `AGENTS.md` the shared instruction surface, keep provider files such as `CLAUDE.md` as adapters,
and include standing rules for clean closure and promoting repeated workflows into skills.

New setup and upgrade work makes `AGENTS.md` the one shared repository instruction surface. Provider
files import or point to it and may retain only provider-specific discovery, scheduling, connector,
permission, or UI behavior.
