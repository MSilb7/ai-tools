# Claude Workflows adapter

Use this adapter only when the current Claude surface exposes Workflows or the equivalent trigger
capability. The portable `repository-hygiene` skill owns the maintenance method.

## Create or update

1. List existing hygiene workflows and collect occupied schedule slots.
2. Use one workflow per repository so each can carry the correct source, gate, and risk boundary.
3. Use a staggered weekly schedule; the current convention is Sunday in the 13:00 UTC hour, off the
   hour. Translate the desired cadence into the trigger's cron format.
4. Set the repository as an explicit source. A repository-touching workflow with no repository source
   can boot into an empty environment and silently no-op.
5. Prompt the run to invoke `$repository-hygiene` in `run` mode. Include the rendered run-prompt asset
   only as a fallback when the cloud environment cannot discover shared skills.
6. Allow only repository read/write and normal validation capabilities required by the target. Do
   not attach money-moving, signing, deployment, broker, exchange, payment, or production-mutation
   tools.
7. Configure the expected branch/review outcome and notifications. Never configure auto-merge.
8. Read the created workflow back and verify source, prompt, schedule, enabled state, permissions,
   connectors, and next run.

Provider fields and model identifiers can change. Inspect the current trigger schema instead of
copying a remembered JSON payload.

## Audit

Check every repository-touching workflow, not only hygiene workflows, for a non-empty repository
source. Treat a missing source as a paging issue because the run may appear successful while doing
nothing.

Also verify default branch, stack gate, prompt version, safety surface, enabled state, last run,
schedule collision, and connector/tool exposure. Some Claude environments inject default connectors
and may ignore attempts to clear nested arrays; rely on an explicit allowed-tool boundary and report
connectors that require operator removal in the UI.

When updating nested workflow configuration, read the current schema and resend the complete object
when partial updates would drop or ignore nested fields. Confirm before mutating live workflows.
