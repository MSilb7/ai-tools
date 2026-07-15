# ADR 0003: Portable cores with provider capability adapters

- **Status:** Accepted
- **Date:** 2026-07-09

## Context

ADR 0002 made the repository lifecycle portable, but AI Tools still contained two reusable
procedures only as Claude commands. Portability does not mean reducing every client to identical
features: Claude Workflows and Codex scheduled tasks have different scheduling, repository binding,
execution isolation, permission, and reporting capabilities.

## Decision

Every reusable AI Tools workflow has one provider-neutral `SKILL.md` core. A provider-specific
feature may have an adapter in that skill's `references/` directory when it translates the core into
native discovery, scheduling, connector, permission, model, environment, or UI behavior.

Provider adapters may name native tools and configuration. They must not redefine or duplicate the
invariant method. Temporary provider invocation wrappers may exist only for a versioned migration;
AI Tools' top-level Claude wrappers were retired after native lifecycle-skill discovery was verified
in both daily-driver runtimes. Codex UI metadata remains descriptive only.

`repository-hygiene` now owns the portable maintenance method, with separate Claude Workflows and
Codex scheduled-task adapters. `sync-ai-tools` owns cross-client installation and parity checks.

Versioned compounding templates predating this boundary remain compatibility artifacts, not the home
for new workflow behavior. They can be retired only through a versioned consumer migration.

## Consequences

- All live reusable AI Tools workflows are discoverable as portable skills.
- Each client can use its stronger native features without contaminating the shared core.
- Validation rejects reintroduced top-level command files and missing Codex metadata.
- Provider adapters need separate verification whenever their native runtime changes.
