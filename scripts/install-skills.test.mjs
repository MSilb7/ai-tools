import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const installer = path.join(scriptDir, "install-skills");
const skillsRoot = path.join(repoRoot, "skills");

test("installer exposes every portable skill to Claude and Codex", () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-tools-install-"));
  const anchor = path.join(tempHome, ".ai-tools");
  const claudeSkills = path.join(tempHome, ".claude", "skills");
  const claudeCommands = path.join(tempHome, ".claude", "commands");
  const codexSkills = path.join(tempHome, ".agents", "skills");

  try {
    execFileSync(installer, ["--target", "all"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: tempHome,
        AI_TOOLS_HOME: anchor,
        CLAUDE_SKILLS_DIR: claudeSkills,
        CLAUDE_COMMANDS_DIR: claudeCommands,
        CODEX_SKILLS_DIR: codexSkills,
      },
      stdio: "pipe",
    });

    const skillNames = fs
      .readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, "SKILL.md")))
      .map((entry) => entry.name)
      .sort();

    assert.ok(skillNames.includes("compounding"));
    assert.ok(skillNames.includes("end-session-review"));
    assert.ok(skillNames.includes("repository-hygiene"));
    assert.ok(skillNames.includes("sync-ai-tools"));

    for (const skillName of skillNames) {
      const expected = path.join(anchor, "skills", skillName);
      for (const targetRoot of [claudeSkills, codexSkills]) {
        const installed = path.join(targetRoot, skillName);
        assert.ok(fs.lstatSync(installed).isSymbolicLink(), `${installed} should be a symlink`);
        assert.equal(fs.readlinkSync(installed), expected);
      }
    }

    const legacyCompounding = path.join(claudeCommands, "compounding.md");
    assert.ok(fs.lstatSync(legacyCompounding).isSymbolicLink());
    assert.equal(fs.readlinkSync(legacyCompounding), path.join(anchor, "commands", "compounding.md"));

    for (const commandName of ["add-weekly-hygiene.md", "sync-commands.md"]) {
      const installed = path.join(claudeCommands, commandName);
      assert.ok(fs.lstatSync(installed).isSymbolicLink());
      assert.equal(fs.readlinkSync(installed), path.join(anchor, "commands", commandName));
    }
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});
