---
name: sync-ai-tools
description: Install or refresh canonical AI Tools skills across supported agent discovery directories while preserving real files and provider-specific adapters. Use when asked to sync commands or skills, install AI Tools for Claude and Codex, repair shared skill symlinks, verify both agents see the same portable workflows, or refresh compatibility wrappers after an AI Tools update.
---

# Sync AI Tools

Install one canonical skill set into every requested supported agent. Provider discovery paths may
differ; workflow bodies must continue to resolve to the same AI Tools packages.

## 1. Resolve the canonical checkout

Prefer the stable `~/.ai-tools` anchor. Otherwise locate the checkout containing this skill and
`scripts/install-skills`. Verify the checkout is the intended canonical repository and inspect its
status before updating it.

Only fetch or fast-forward the checkout when the user asked to update source. Do not discard local
changes or rewrite history to obtain a clean tree.

## 2. Preview

Run the installer in dry-run mode for all requested targets. Report links that would be created,
refreshed, left unchanged, or blocked by a real file or directory.

Never replace a real file or directory with a symlink. Resolve conflicts explicitly.

## 3. Install

When user-level changes are authorized, run the canonical installer for the requested targets. The
installer may use different discovery directories and compatibility adapters for each client, but
every portable skill link must point through the stable AI Tools anchor.

Do not copy skill bodies into provider directories. Do not turn product metadata or legacy command
wrappers into a second source of workflow logic.

## 4. Verify parity

Enumerate canonical skill packages and confirm each requested agent has a resolving link to every
package. Validate that:

- Filesystem parity is necessary but not sufficient: use each runtime's native skill list or an
  explicit invocation to confirm it actually discovers the lifecycle skills;
- Claude and Codex discover the same portable skill set;
- provider-specific command wrappers remain thin pointers;
- provider metadata contains no workflow body;
- scheduling, connectors, permissions, models, and UI actions remain explicit adapters;
- no stale local copy shadows a canonical skill.

Report canonical checkout revision, targets, created/refreshed/conflicting links, and any provider
feature that intentionally remains adapter-only.
