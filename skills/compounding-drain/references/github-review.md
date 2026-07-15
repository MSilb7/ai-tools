# GitHub review adapter

Use this adapter only when the repository review host is GitHub.

## Preserve Markdown exactly

Prefer a structured provider connector for creating and editing pull requests. Supply the body as a
multiline string with real newline characters.

When a command-line fallback is necessary, write the Markdown to a temporary file through the
normal safe file-edit path and use `gh pr create --body-file <path>` or
`gh pr edit --body-file <path>`. Do not encode line breaks as literal `\n` text in a plain `--body`
argument. Do not pass Markdown containing dollar signs, backticks, command substitutions, or other
shell syntax through an interpolated shell string.

After every create or edit, read back the stored title and body through the provider or
`gh pr view --json title,body`. Treat literal `\n` sequences, missing expected symbols, or collapsed
headings as a failed write and repair the body before reporting the review ready.

## Verify stacked review landing

Record the target base when opening a stacked pull request. After its parent lands, retarget the
dependent review to the default branch before the operator merges it. Immediately before treating a
review as landed, verify both that its base branch is the default branch and that its head change is
reachable from the refreshed default branch.

A GitHub `MERGED` label on a review whose base was another feature branch proves only that the change
reached that feature branch. Create a default-branch landing review when necessary, and keep the
queue item unresolved until that landing is verifiable.
