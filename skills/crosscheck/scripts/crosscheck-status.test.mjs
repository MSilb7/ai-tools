// Fixtures + assertions ported from the reference implementation
// (investment-agent src/server/engine/crosscheck/__tests__/queue.test.ts) —
// the two selectors must stay behaviorally identical.
import test from "node:test";
import assert from "node:assert/strict";
import {
  claimBranch,
  classifyNotes,
  datestampFromFileName,
  notesFor,
  parseCrosscheckFile,
} from "./crosscheck-status.mjs";

const SAMPLE = `# Crosscheck notes — 2026-07-12

### [X-ENGINE1] Verify the sell-gate refactor
- **From:** claude
- **To:** codex
- **Work:** PR #201 · branch claude/sell-gate-refactor · src/server/engine/guardrails.ts
- **Status:** OPEN

**What was done:** extracted the hold check into a shared helper.

**Verify:**
- [ ] targeted tests pass on the branch
- [ ] risky sells still HOLD when the alert-only flag is engaged

**Unverified:** behavior under a wind-down allocation-zero row.

**Do-not-relitigate:** the split stays in the planner (not the executor) — decision record ordering.

### X2 Second note, bare id, to anyone
- **From:** codex
- **To:** any
- **Status:** OPEN

### [X-DONE1] Already checked
- **From:** claude
- **To:** codex
- **Status:** **DONE** (codex, 2026-07-12, no findings)
`;

test("datestampFromFileName strips date dashes, keeps time separator", () => {
  assert.equal(datestampFromFileName("2026-07-12-1906.md"), "20260712-1906");
});

test("parses all notes with globally unique keys", () => {
  const notes = parseCrosscheckFile("2026-07-12-1906.md", SAMPLE);
  assert.deepEqual(
    notes.map((n) => n.key),
    ["20260712-1906-X-ENGINE1", "20260712-1906-X2", "20260712-1906-X-DONE1"],
  );
});

test("extracts fields", () => {
  const [n] = parseCrosscheckFile("2026-07-12-1906.md", SAMPLE);
  assert.equal(n.from, "claude");
  assert.equal(n.to, "codex");
  assert.ok(n.work.includes("PR #201"));
  assert.equal(n.title, "Verify the sell-gate refactor");
  assert.equal(n.verifyCount, 2);
  assert.equal(n.done, false);
});

test("normalizes `any` audience and bare ids; bolded DONE is terminal", () => {
  const notes = parseCrosscheckFile("2026-07-12-1906.md", SAMPLE);
  assert.equal(notes[1].to, "any");
  assert.equal(notes[1].id, "X2");
  assert.equal(notes[2].done, true);
});

test("does not match compounding C- headers", () => {
  const none = parseCrosscheckFile(
    "2026-07-12-0000.md",
    "### [C-FOO1] A compounding item\n- **Status:** OPEN\n",
  );
  assert.equal(none.length, 0);
});

test("claim branch derives CLAIMED; done stays DONE", () => {
  const notes = parseCrosscheckFile("2026-07-12-1906.md", SAMPLE);
  const classified = classifyNotes(notes, [claimBranch("20260712-1906-X-ENGINE1")]);
  assert.equal(classified[0].state, "CLAIMED");
  assert.equal(classified[1].state, "OPEN");
  assert.equal(classified[2].state, "DONE");
});

test("notesFor filters by audience including `any`, oldest first", () => {
  const notes = parseCrosscheckFile("2026-07-12-1906.md", SAMPLE);
  const classified = classifyNotes(notes, []);
  assert.deepEqual(notesFor(classified, "codex").map((n) => n.id), ["X-ENGINE1", "X2"]);
  assert.deepEqual(notesFor(classified, "claude").map((n) => n.id), ["X2"]);
});
