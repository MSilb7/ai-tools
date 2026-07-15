import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("repository hygiene keeps one portable core and explicit runtime adapters", () => {
  const core = read("skills/repository-hygiene/SKILL.md");
  const claude = read("skills/repository-hygiene/references/claude-workflows.md");
  const codex = read("skills/repository-hygiene/references/codex-scheduled-tasks.md");
  const command = read("commands/add-weekly-hygiene.md");

  assert.match(core, /Skills define the work;[\s\S]*provider features define when, where/);
  assert.match(core, /references\/claude-workflows\.md/);
  assert.match(core, /references\/codex-scheduled-tasks\.md/);
  assert.doesNotMatch(core, /RemoteTrigger|claude-sonnet|job_config/);

  assert.match(claude, /repository as an explicit source/i);
  assert.match(claude, /allowed-tool boundary/i);
  assert.match(codex, /dedicated worktree/i);
  assert.match(codex, /Scheduled/);
  assert.match(command, /Legacy Claude command wrapper/);
  assert.ok(command.split(/\r?\n/).length <= 12);
});

test("sync workflow verifies shared skills while preserving provider discovery", () => {
  const core = read("skills/sync-ai-tools/SKILL.md");
  const command = read("commands/sync-commands.md");

  assert.match(core, /every portable skill link must point through the stable AI Tools anchor/);
  assert.match(core, /Filesystem parity is necessary but not sufficient/);
  assert.match(core, /native skill list or an\s+explicit invocation/);
  assert.match(core, /Claude and Codex discover the same portable skill set/);
  assert.match(core, /scheduling, connectors, permissions, models, and UI actions remain explicit adapters/);
  assert.match(command, /skills\/sync-ai-tools\/SKILL\.md/);
  assert.ok(command.split(/\r?\n/).length <= 8);
});
