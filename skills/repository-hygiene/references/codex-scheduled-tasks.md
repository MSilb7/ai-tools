# Codex scheduled-tasks adapter

Use this adapter when Codex or ChatGPT Scheduled exposes project-backed scheduled tasks. The portable
`repository-hygiene` skill owns the maintenance method; the scheduled task owns cadence and execution
environment.

## Create or update

1. Select a standalone scheduled task because each hygiene run should start independently and report
   findings to Scheduled.
2. Bind the correct project. A scheduled task can target one or more projects, but prefer one task per
   repository when gates or safety boundaries differ.
3. Prefer a dedicated worktree for a run that may edit files. Use local mode only when the user wants
   the task to touch the main checkout and accepts interference with unfinished work.
4. Set the desired weekly cadence with the supported schedule controls or RRULE.
5. Prompt the task to invoke `$repository-hygiene` in `run` mode. Scheduled tasks can invoke skills,
   so keep the method in the skill rather than copying it into the prompt.
6. Choose the least-privilege local environment and permissions that can inspect the repository, run
   its documented checks, push a branch, and open a review. Do not broaden permissions for unrelated
   connectors or production systems.
7. Read the task back and verify project, environment, prompt, cadence, enabled state, and next run.

Codex scheduled tasks may run in a local project or a dedicated background worktree, and standalone
runs report findings in Scheduled. Source: OpenAI Scheduled Tasks documentation, verified 2026-07-09:
https://learn.chatgpt.com/docs/automations#manage-scheduled-tasks

## Audit

Verify project binding, local versus worktree mode, current skill invocation, schedule, enabled state,
recent findings, and least-privilege permissions. A task that needs a plugin or connector must have it
available in the scheduled environment; absence should produce a visible blocker, not a silent no-op.

Use the current automation capability exposed by the client. Do not encode private app storage paths
or hand-edit automation files when a supported automation interface is available.
