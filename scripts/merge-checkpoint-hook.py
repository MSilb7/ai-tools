#!/usr/bin/env python3
"""PostToolUse hook: a PR merge is an auto-detected natural stopping point.

The compounding problem this solves (2026-07-22): sessions reach natural stopping
points — a PR merging is the clearest one — without running the compounding
checkpoint, so learnings get captured only when the operator explicitly asks.
Instead of a heuristic "am I done?" classifier, use the deterministic event: when
the Bash tool runs a `gh pr merge`, inject a one-line checkpoint prompt. The
model supplies the judgment; the hook supplies the trigger.

Registered in .claude/settings.json under PostToolUse (matcher "Bash"). Reads the
hook payload on stdin; emits `additionalContext` JSON only when the command was a
PR merge, and stays silent (exit 0, no output) otherwise. Provider note: this is
a Claude Code adapter — the portable rule lives in the end-session-review skill
("Merge checkpoint"); other providers enforce it behaviorally.
"""

import json
import re
import sys


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return  # malformed payload: never block the session over a reminder

    command = (payload.get("tool_input") or {}).get("command", "")
    # Match `gh pr merge` only at a command position (line start, or after ; && || | $( ),
    # NOT anywhere in the string — a commit message or PR body that merely *mentions*
    # "gh pr merge" must not fire the checkpoint (first-day false positive, 2026-07-22).
    if not re.search(r"(?:^|[;&|]\s*|\$\(\s*)gh\s+pr\s+merge\b", command, re.MULTILINE):
        return

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": (
                        "MERGE CHECKPOINT (auto-injected — a PR merge just ran, which is a "
                        "natural stopping point). Before moving on, sweep the conversation "
                        "since the last checkpoint and answer in ONE line of your next "
                        "reply: any loose ends to file, any learnings to capture "
                        "(end-session-review § 5b / capture-learning), any doc the merge "
                        "just made stale? If none, say exactly: 'merge checkpoint: nothing "
                        "new to file or compound.' If the session is wrapping here, run the "
                        "full end-session-review instead."
                    ),
                }
            }
        )
    )


if __name__ == "__main__":
    main()
