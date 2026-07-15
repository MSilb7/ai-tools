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

test("installer exposes every portable skill and prunes retired Claude commands", () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-tools-install-"));
  const anchor = path.join(tempHome, ".ai-tools");
  const claudeSkills = path.join(tempHome, ".claude", "skills");
  const claudeCommands = path.join(tempHome, ".claude", "commands");
  const codexSkills = path.join(tempHome, ".agents", "skills");

  // Pre-seed stale state a rename/removal would leave behind, plus entries the installer
  // must never touch: a dangling link pointing outside the anchor, and a real file.
  fs.mkdirSync(claudeSkills, { recursive: true });
  fs.mkdirSync(claudeCommands, { recursive: true });
  fs.mkdirSync(codexSkills, { recursive: true });
  const staleClaudeLink = path.join(claudeSkills, "renamed-away-skill");
  const staleCodexLink = path.join(codexSkills, "renamed-away-skill");
  const foreignDanglingLink = path.join(claudeSkills, "someone-elses-link");
  const realFile = path.join(claudeSkills, "not-a-symlink.md");
  const retiredCommandLink = path.join(claudeCommands, "compounding.md");
  fs.symlinkSync(path.join(anchor, "skills", "renamed-away-skill"), staleClaudeLink);
  fs.symlinkSync(path.join(anchor, "skills", "renamed-away-skill"), staleCodexLink);
  fs.symlinkSync(path.join(tempHome, "does-not-exist"), foreignDanglingLink);
  fs.writeFileSync(realFile, "keep me\n");
  fs.symlinkSync(path.join(anchor, "commands", "compounding.md"), retiredCommandLink);

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

    // Dangling anchor links are pruned in every target; everything else is preserved.
    assert.equal(fs.lstatSync(staleClaudeLink, { throwIfNoEntry: false }), undefined);
    assert.equal(fs.lstatSync(staleCodexLink, { throwIfNoEntry: false }), undefined);
    assert.ok(fs.lstatSync(foreignDanglingLink).isSymbolicLink(), "non-anchor link must survive prune");
    assert.equal(fs.readFileSync(realFile, "utf8"), "keep me\n");
    assert.equal(fs.lstatSync(retiredCommandLink, { throwIfNoEntry: false }), undefined);
    assert.deepEqual(fs.readdirSync(claudeCommands), []);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});
