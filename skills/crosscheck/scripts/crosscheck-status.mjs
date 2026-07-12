// crosscheck-system: v1 — installed from ai-tools; do not hand-edit; run /crosscheck upgrade
//
// Machine-readable crosscheck-queue status. Parses docs/crosscheck/*.md notes and derives each
// note's coordination state from git branch refs: git ls-remote on crosscheck/* claim branches is
// the load-bearing lock (works everywhere git works). No other tooling required.
//
// Zero dependencies; runs under node >=18 or bun. Behavior contract shared with the reference
// implementation (investment-agent src/server/engine/crosscheck/queue.ts) — improvements to either
// are Upstream: ai-tools items (see the crosscheck SOP § Upstreaming).
//
// Usage:
//   node scripts/crosscheck-status.mjs                 # human report (stderr) + summary (stdout)
//   node scripts/crosscheck-status.mjs --json          # {generatedAt, actor, notes, openTotal}
//   node scripts/crosscheck-status.mjs --for codex     # OPEN notes addressed to codex (or `any`)

import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const DIR = "docs/crosscheck";

/** "2026-07-12-1906.md" → "20260712-1906" (date loses its dashes; the time keeps its separator). */
export function datestampFromFileName(fileName) {
  const base = fileName.replace(/\.md$/, "");
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return base.replace(/-/g, "");
  return `${m[1]}${m[2]}${m[3]}-${m[4]}`;
}

/** `### [X-ENGINE1] Title`, `### X1 Title`, `## X-BAR2 — Title` — h2/h3, optional brackets/em-dash.
 *  The X- prefix keeps crosscheck notes disjoint from compounding C- items by construction. */
const HEADER_RE = /^#{2,3}\s+\[?(X[-A-Z0-9]*\d[A-Z0-9]*)\]?\s*(?:[—–-]\s*)?(.*)$/;

function normActor(raw) {
  const v = raw.trim().toLowerCase();
  if (v.startsWith("claude")) return "claude";
  if (v.startsWith("codex")) return "codex";
  if (v.startsWith("any")) return "any";
  return "unknown";
}

export function parseCrosscheckFile(fileName, content) {
  const stamp = datestampFromFileName(fileName);
  const lines = content.split("\n");
  const notes = [];
  let cur = null;

  const field = (line, name) => {
    const m = line.match(new RegExp(`^\\s*-\\s+\\*\\*${name}:\\*\\*\\s*(.+)$`, "i"));
    return m ? m[1].trim() : null;
  };

  for (const line of lines) {
    const h = line.match(HEADER_RE);
    if (h) {
      cur = {
        key: `${stamp}-${h[1]}`,
        id: h[1],
        title: h[2].replace(/~~/g, "").trim(),
        file: fileName,
        from: "unknown",
        to: "unknown",
        work: "",
        statusRaw: "",
        done: false,
        verifyCount: 0,
      };
      notes.push(cur);
      continue;
    }
    if (!cur) continue;

    const from = field(line, "From");
    if (from !== null) { cur.from = normActor(from); continue; }
    const to = field(line, "To");
    if (to !== null) { cur.to = normActor(to); continue; }
    const work = field(line, "Work");
    if (work !== null) { cur.work = work; continue; }
    const status = field(line, "Status");
    if (status !== null) {
      cur.statusRaw = status;
      // Tolerate leading emphasis ("**DONE**") — a bolded status keyword is still terminal.
      cur.done = /^[\s*_"'`]*(DONE|RESOLVED|CLOSED)/i.test(status.trim());
      continue;
    }
    if (/^\s*-\s+\[[ x]\]/i.test(line)) cur.verifyCount++;
  }
  return notes;
}

export function claimBranch(key) {
  return `crosscheck/${key}`;
}

/** Derive each note's state from the remote claim-branch list (branch push = atomic mutex). */
export function classifyNotes(notes, branches) {
  return notes.map((n) => {
    if (n.done) return { ...n, state: "DONE", reason: n.statusRaw };
    if (branches.includes(claimBranch(n.key))) {
      return { ...n, state: "CLAIMED", reason: "claim branch exists — a checker is on it" };
    }
    return { ...n, state: "OPEN", reason: `awaiting check by ${n.to}` };
  });
}

/** OPEN notes addressed to `actor` (or to `any`), oldest first — the pickup work-list. */
export function notesFor(classified, actor) {
  return classified
    .filter((n) => n.state === "OPEN" && (n.to === actor || n.to === "any"))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function remoteClaimBranches() {
  try {
    const p = spawnSync("git", ["ls-remote", "origin", "refs/heads/crosscheck/*"], {
      encoding: "utf8",
    });
    if (p.status !== 0) throw new Error("ls-remote failed");
    return p.stdout
      .split("\n")
      .map((l) => l.split("\t")[1])
      .filter(Boolean)
      .map((ref) => ref.replace("refs/heads/", ""));
  } catch {
    console.error("  ⚠ git ls-remote failed — claim info UNAVAILABLE; treating nothing as claimed.");
    return [];
  }
}

function main() {
  const json = process.argv.includes("--json");
  const forIdx = process.argv.indexOf("--for");
  const actor = forIdx >= 0 ? process.argv[forIdx + 1] : null;
  if (actor && actor !== "claude" && actor !== "codex") {
    console.error(`unknown actor "${actor}" — expected claude | codex`);
    process.exit(1);
  }

  let files;
  try {
    files = readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(f));
  } catch {
    console.error(`  ⚠ ${DIR}/ not found — run from the repo root (or bootstrap with /crosscheck setup).`);
    process.exit(1);
  }
  const notes = files.flatMap((f) => parseCrosscheckFile(f, readFileSync(join(DIR, f), "utf8")));
  const classified = classifyNotes(notes, remoteClaimBranches());
  const shown = actor ? notesFor(classified, actor) : classified;

  for (const state of ["OPEN", "CLAIMED", "DONE"]) {
    const group = shown.filter((n) => n.state === state);
    if (!group.length) continue;
    console.error(`  ${state} (${group.length}):`);
    for (const n of group) console.error(`    ${n.key} [${n.from} → ${n.to}] ${n.title} — ${n.reason}`);
  }

  const open = classified.filter((n) => n.state === "OPEN");
  if (json) {
    console.log(JSON.stringify(
      { generatedAt: new Date().toISOString(), actor, notes: shown, openTotal: open.length },
      null,
      2,
    ));
  } else {
    console.log(
      `open=${open.length}` +
      ` (claude:${notesFor(classified, "claude").length} codex:${notesFor(classified, "codex").length})` +
      ` claimed=${classified.filter((n) => n.state === "CLAIMED").length}` +
      ` done=${classified.filter((n) => n.state === "DONE").length}` +
      ` total=${classified.length}`,
    );
  }
}

// Direct-execution check must survive symlinked installs (node resolves import.meta.url to the
// realpath, but argv[1] stays the symlink) — compare realpaths on both sides.
const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();
if (isDirectRun) main();
