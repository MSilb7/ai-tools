// Fixtures + assertions ported from the reference implementation
// (investment-agent src/server/engine/compounding/__tests__/queue.test.ts) —
// the two selectors must stay behaviorally identical.
import test from "node:test";
import assert from "node:assert/strict";
import {
  claimBranch,
  classifyQueue,
  datestampFromFileName,
  parseCompoundingFile,
  rankEligible,
} from "./compounding-status.mjs";

const BRACKETED = `# Compounding — 2026-07-02 15:00Z

### [C-LEDGER1] Re-recording a buy fill re-inflates a lot
- **Severity:** high
- **Effort:** medium
- **Pickup:** active-agent
- **Ready:** yes
- **Status:** OPEN

**Background:** stuff happened

**Goal:** buy fills are idempotent

**Acceptance criteria:**
- [ ] re-record is a no-op
- [ ] test added

### [C-CAPS1] Per-day cap totals over-count
- **Severity:** low
- **Effort:** low
- **Pickup:** cleanup-routine
- **Status:** DONE (PR #64) — fixed
`;

const LEGACY = `# Compounding — 2026-07-02 13:30Z

## C-SIG1 — \`signals\` table is too sparse

- **Status:** OPEN
- **Severity / effort:** MED / MED
- **Pickup:** active-agent
- **Goal:** every live cycle persists signals

## C-TW1 — ~~stranded digests~~ CLOSED-INVALID (stale-base misread)

- **Status:** CLOSED-INVALID (2026-07-02, same session) — the premise was wrong
`;

const BARE_HEADER = `### C1 News-scanner cloud runs leave orphaned branches
- **Severity:** medium
- **Effort:** low
- **Pickup:** cleanup-routine / next W+ session
- **Status:** OPEN — in-repo half DONE 2026-07-02; remaining: apply prompt edits

**Goal:** runs stop accumulating orphaned branches
`;

test("datestampFromFileName strips extension and date dashes", () => {
  assert.equal(datestampFromFileName("2026-07-02-1500.md"), "20260702-1500");
});

test("parses bracketed h3 items with all fields", () => {
  const items = parseCompoundingFile("2026-07-02-1500.md", BRACKETED);
  assert.equal(items.length, 2);
  const [a, b] = items;
  assert.equal(a.id, "C-LEDGER1");
  assert.equal(a.key, "20260702-1500-C-LEDGER1");
  assert.equal(a.title, "Re-recording a buy fill re-inflates a lot");
  assert.equal(a.severity, "high");
  assert.equal(a.effort, "medium");
  assert.equal(a.pickup, "active-agent");
  assert.equal(a.ready, true);
  assert.equal(a.done, false);
  assert.equal(a.goal, "buy fills are idempotent");
  assert.equal(a.acCount, 2);
  assert.equal(b.id, "C-CAPS1");
  assert.equal(b.done, true);
  assert.equal(b.ready, false); // absent Ready ⇒ false
});

test("parses legacy h2 em-dash headers and combined severity/effort", () => {
  const items = parseCompoundingFile("2026-07-02-1330.md", LEGACY);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, "C-SIG1");
  assert.equal(items[0].key, "20260702-1330-C-SIG1");
  assert.equal(items[0].severity, "medium"); // MED normalized
  assert.equal(items[0].effort, "medium");
  assert.equal(items[0].done, false);
  assert.equal(items[1].id, "C-TW1");
  assert.equal(items[1].done, true); // CLOSED-INVALID counts as done
});

test("a bolded/emphasized status keyword still registers as done (**DONE**, _RESOLVED_)", () => {
  const md = [
    "### [C-BOLD1] bold done",
    "- **Status:** **DONE (2026-07-08)** — implemented",
    "**Goal:** x",
    "",
    "### [C-EMPH1] underscore resolved",
    "- **Status:** _RESOLVED_ — done",
    "**Goal:** y",
    "",
    '### [C-QUOTE1] quoted closed',
    '- **Status:** "CLOSED-INVALID" — wrong premise',
    "**Goal:** z",
  ].join("\n");
  const items = parseCompoundingFile("2026-07-08-0000.md", md);
  assert.deepEqual(items.map((i) => i.done), [true, true, true]);
});

test("parses bare headers, suffixed pickup, OPEN-with-annotation status", () => {
  const items = parseCompoundingFile("2026-06-30-2030.md", BARE_HEADER);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, "C1");
  assert.equal(items[0].key, "20260630-2030-C1");
  assert.equal(items[0].pickup, "cleanup-routine");
  assert.equal(items[0].done, false); // "OPEN — …" is still open
});

test("same local id in two files yields distinct keys", () => {
  const a = parseCompoundingFile("2026-06-29-1340.md", BARE_HEADER);
  const b = parseCompoundingFile("2026-06-30-2030.md", BARE_HEADER);
  assert.equal(a[0].id, b[0].id);
  assert.notEqual(a[0].key, b[0].key);
});

test("nonstandard pickup maps to unknown", () => {
  const items = parseCompoundingFile(
    "2026-07-02-1500.md",
    "### [C-STORY1] Review\n- **Pickup:** operator+agent (a working session)\n- **Status:** OPEN\n",
  );
  assert.equal(items[0].pickup, "unknown");
});

test("skips SOP-style files with no item headers", () => {
  assert.deepEqual(parseCompoundingFile("SOP.md", "# SOP\n\nprose only\n"), []);
});

function item(over) {
  return {
    key: "20260701-0306-C-X1", id: "C-X1", title: "t", file: "2026-07-01-0306.md",
    severity: "medium", effort: "low", pickup: "active-agent", ready: true,
    statusRaw: "OPEN", done: false, goal: "g", acCount: 1, ...over,
  };
}
const NOW = new Date("2026-07-02T20:00:00Z");
function refs(over) {
  return { branches: [], prs: [], now: NOW, ...over };
}

test("done beats everything", () => {
  const [c] = classifyQueue([item({ done: true, statusRaw: "DONE (PR #9)" })], refs({}));
  assert.equal(c.state, "DONE");
});

test("open fresh PR ⇒ IN-PROGRESS", () => {
  const [c] = classifyQueue([item({})], refs({
    branches: ["compounding/20260701-0306-C-X1"],
    prs: [{ headRef: "compounding/20260701-0306-C-X1", title: "chore(compounding): 20260701-0306-C-X1 — t", state: "open", updatedAt: "2026-07-02T10:00:00Z" }],
  }));
  assert.equal(c.state, "IN-PROGRESS");
});

test("open PR older than staleDays ⇒ STALE", () => {
  const [c] = classifyQueue([item({})], refs({
    prs: [{ headRef: "compounding/20260701-0306-C-X1", title: "x", state: "open", updatedAt: "2026-06-20T10:00:00Z" }],
  }));
  assert.equal(c.state, "STALE");
});

test("closed-unmerged PR on a still-OPEN item ⇒ NEEDS-REVIEW", () => {
  const [c] = classifyQueue([item({})], refs({
    prs: [{ headRef: "compounding/20260701-0306-C-X1", title: "x", state: "closed", updatedAt: "2026-07-01T10:00:00Z" }],
  }));
  assert.equal(c.state, "NEEDS-REVIEW");
});

test("degraded mode: branch exists + prs null ⇒ CLAIMED", () => {
  const [c] = classifyQueue([item({})], refs({ branches: ["compounding/20260701-0306-C-X1"], prs: null }));
  assert.equal(c.state, "CLAIMED");
});

test("orphan claim branch with PR data present ⇒ STALE", () => {
  const [c] = classifyQueue([item({})], refs({ branches: ["compounding/20260701-0306-C-X1"], prs: [] }));
  assert.equal(c.state, "STALE");
});

test("blocked: operator-action / unknown pickup / not ready / effort over ceiling / unknown effort", () => {
  const rs = refs({});
  for (const it of [
    item({ pickup: "operator-action" }),
    item({ pickup: "unknown" }),
    item({ ready: false }),
    item({ effort: "medium" }),          // ceiling defaults to low
    item({ effort: "unknown" }),
  ]) {
    assert.equal(classifyQueue([it], rs)[0].state, "BLOCKED");
  }
});

test("effort ceiling is adjustable", () => {
  const [c] = classifyQueue([item({ effort: "medium" })], refs({}), "medium");
  assert.equal(c.state, "ELIGIBLE");
});

test("clean ready low-effort item ⇒ ELIGIBLE", () => {
  const [c] = classifyQueue([item({})], refs({}));
  assert.equal(c.state, "ELIGIBLE");
});

test("bare-id C1 in one file does not lock C1 in another (key-scoped)", () => {
  const a = item({ key: "20260629-1340-C1", id: "C1" });
  const b = item({ key: "20260630-2030-C1", id: "C1" });
  const rs = refs({ branches: ["compounding/20260629-1340-C1"], prs: [] });
  const out = classifyQueue([a, b], rs);
  assert.equal(out[0].state, "STALE");     // claimed (orphan)
  assert.equal(out[1].state, "ELIGIBLE");  // untouched sibling id
});

test("rankEligible: severity desc, then effort asc, then oldest key", () => {
  const out = rankEligible(classifyQueue([
    item({ key: "20260702-1500-C-A1", id: "C-A1", severity: "low",  effort: "low" }),
    item({ key: "20260701-0306-C-B1", id: "C-B1", severity: "high", effort: "low" }),
    item({ key: "20260629-1340-C-C1", id: "C-C1", severity: "low",  effort: "low" }),
  ], refs({})));
  assert.deepEqual(out.map((i) => i.id), ["C-B1", "C-C1", "C-A1"]);
});

test("claimBranch is deterministic", () => {
  assert.equal(claimBranch("20260702-1500-C-LEDGER1"), "compounding/20260702-1500-C-LEDGER1");
});
