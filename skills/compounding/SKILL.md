---
name: compounding
description: Set up, upgrade, or inspect a repository's portable compounding system, including its improvement queue, living product PRD, maintained technical-design index, shared agent instructions, and clean-closure rules. Use when initializing a repository, adding continuous improvement, upgrading an installed compounding pack, checking compounding status, or bringing an older repository up to current AI Tools conventions.
---

# Compounding

Install or reconcile one repository lifecycle shared by every supported agent. Keep the durable
workflow in portable skills and shared repository documents; use provider files only as discovery,
scheduling, permission, or connector adapters.

Choose `setup`, `upgrade`, or `status` from the request. Default to `upgrade` when
`docs/compounding/SOP.md` already exists and `setup` otherwise.

## 1. Read and detect

Read the target repository's instructions before changing it. Inspect:

- repository status, remote, default branch, and normal review workflow;
- existing shared and provider-specific agent files;
- current product, technical, decision, operations, and build-state documentation;
- stack and green-check commands;
- installed compounding version and selector, if present;
- repository-local skills and any duplicated lifecycle procedures.

Locate the canonical AI Tools checkout through the installed skill path or the stable
`~/.ai-tools` anchor. Its versioned compatibility pack currently lives at
`commands/compounding-templates/`; its portable technical-index asset lives with
`maintain-technical-design`. Do not guess paths or overwrite repository-owned documents.

## 2. Status mode

Run the target's selector from its repository root. If it is absent, run the canonical selector
against that root. Report the summary, the highest-ranked eligible items, blocked reasons, and any
stale or review-needed claims. A clean empty queue is a successful result.

Do not change queue state in status mode.

## 3. Setup mode

Work on a branch and use the repository's review path. Install the smallest complete system:

1. The queue SOP under `docs/compounding/` and selector under `scripts/`.
2. A living `docs/product/PRD.md` only when absent. Seed it from repository evidence when possible;
   never replace a filled-in PRD with a template.
3. A maintained `docs/technical/TECHNICAL_DESIGN.md` only when absent, using
   `maintain-technical-design`. Preserve and link existing topic documentation.
4. `AGENTS.md` as the canonical shared instruction surface. Preserve repository-specific rules and
   add concise standing guidance for:
   - reading and reconciling the PRD during product work;
   - reconciling technical design when implementation boundaries change;
   - running compounding status at session start and capturing actionable gaps;
   - routing repeated procedures into repository-local or canonical skills;
   - ending substantive work with docs, validation, queue, and stranded-work checks.
5. Thin provider adapters only where a client needs discovery or scheduling help. Do not duplicate
   the workflow body in each provider file. Existing provider-specific instructions remain intact.
6. Optional queue-only automation only when the repository and user authorize it. Keep scheduled
   workers read-limited, credential-free, and unable to mutate external production state.

Use the canonical template pack for stamped queue infrastructure. A template stamped as
canonical-owned is upgraded upstream and replaced as a unit; repository queue entries are never
templates.

The drain may process at most three eligible items per run, one claim and implementation at a
time. A non-operator item may declare `Ready-when` only for a machine-checkable repository or review
gate with already-firm acceptance criteria. The drain records dated evidence when that gate passes,
reruns the selector, and never treats credentials, production state, third-party state, trigger
state, or an operator decision as an autonomous readiness gate.

Do not install or refresh legacy provider command copies when the portable lifecycle skills are
available. Preserve an existing repository's legacy copies until its migration is reviewed, then
replace their standing instructions with concise pointers rather than another workflow body.

## 4. Upgrade mode

Compare installed stamps and content with the canonical version. Replace only canonical-owned
infrastructure. Never wholesale-replace:

- product content in the PRD;
- the maintained technical-design index or linked topic documents;
- repository-specific instructions;
- queue entries created by the repository;
- provider-specific guidance that is not a duplicated portable workflow.

Ensure shared lifecycle rules live once in `AGENTS.md`. Collapse duplicated provider copies to a
pointer only when doing so preserves provider behavior. Add missing portable skill references, but
do not require a particular agent runtime to execute the repository.

Record meaningful product decisions in the PRD before implementation, architecture decisions in a
decision record, and current implementation boundaries in technical design. If the upgrade exposes
drift that requires judgment, propose it and ask one focused question instead of guessing.

## 5. Verify and hand off

- Run the selector and the repository's relevant tests.
- Confirm the selector exposes any declared `Ready-when` value and that the portable drain applies
  the bounded, one-at-a-time loop.
- Validate links, scripts, and installed skill references.
- Review the diff for lost repository content, duplicate workflow bodies, credentials, and unrelated
  changes.
- Summarize installed, upgraded, preserved, skipped, and unresolved items.
- Use the normal review workflow; never push a protected default branch directly.

Scheduling remains an adapter concern. A portable setup may describe the schedule and least
privileges, but must not pretend that every client exposes the same automation API.
