#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const skillsRoot = path.join(repoRoot, "skills");
const commandsRoot = path.join(repoRoot, "commands");
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const portableCorePatterns = [
  ["Claude-only question tool", /AskUserQuestion/],
  ["Claude-only argument placeholder", /\$ARGUMENTS/],
  ["Claude cloud trigger tool", /RemoteTrigger/],
  ["legacy Claude command path", /(?:~\/)?\.claude\/commands/],
  ["legacy repository name", /claude_tools/],
  ["pinned Claude model", /claude-(?:sonnet|opus|haiku)/i],
  ["undeclared Superpowers dependency", /superpowers:/],
  ["skill scaffold placeholder", /\[TODO:/],
];

function fail(errors, skillName, message) {
  errors.push(`${skillName}: ${message}`);
}

if (!fs.existsSync(skillsRoot)) {
  console.error(`validate-skills: missing ${skillsRoot}`);
  process.exit(1);
}

const skillNames = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const errors = [];

for (const skillName of skillNames) {
  const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    fail(errors, skillName, "missing SKILL.md");
    continue;
  }

  const content = fs.readFileSync(skillPath, "utf8");
  const lines = content.split(/\r?\n/);
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!namePattern.test(skillName)) {
    fail(errors, skillName, "directory name must use lowercase letters, digits, and single hyphens");
  }
  if (!frontmatterMatch) {
    fail(errors, skillName, "missing YAML frontmatter");
    continue;
  }

  const frontmatter = frontmatterMatch[1];
  const topLevelKeys = [...frontmatter.matchAll(/^([a-z][a-z0-9-]*):/gm)].map((match) => match[1]);
  const unexpectedKeys = topLevelKeys.filter((key) => !["name", "description"].includes(key));
  const declaredName = frontmatter.match(/^name:\s*([^\s]+)\s*$/m)?.[1];

  if (declaredName !== skillName) {
    fail(errors, skillName, `frontmatter name must equal directory name (found ${declaredName ?? "none"})`);
  }
  if (!topLevelKeys.includes("description")) {
    fail(errors, skillName, "frontmatter must include description");
  }
  if (unexpectedKeys.length > 0) {
    fail(errors, skillName, `portable frontmatter has unsupported keys: ${unexpectedKeys.join(", ")}`);
  }
  if (lines.length > 500) {
    fail(errors, skillName, `SKILL.md is ${lines.length} lines; keep it under 500`);
  }

  for (const [label, pattern] of portableCorePatterns) {
    if (pattern.test(content)) {
      fail(errors, skillName, `contains ${label}`);
    }
  }

  const metadataPath = path.join(skillsRoot, skillName, "agents", "openai.yaml");
  if (!fs.existsSync(metadataPath)) {
    fail(errors, skillName, "missing required agents/openai.yaml metadata");
  } else {
    const metadata = fs.readFileSync(metadataPath, "utf8");
    const shortDescription = metadata.match(/^\s*short_description:\s*"([^"]+)"\s*$/m)?.[1];
    if (!shortDescription || shortDescription.length < 25 || shortDescription.length > 64) {
      fail(errors, skillName, "agents/openai.yaml short_description must be a quoted 25-64 character string");
    }
    if (!metadata.includes(`$${skillName}`)) {
      fail(errors, skillName, "agents/openai.yaml default_prompt must mention the skill explicitly");
    }
  }

  console.log(`checked  ${skillName} (${lines.length} lines)`);
}

if (fs.existsSync(commandsRoot)) {
  const commandFiles = fs
    .readdirSync(commandsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  for (const commandFile of commandFiles) {
    const command = fs.readFileSync(path.join(commandsRoot, commandFile), "utf8");
    const lineCount = command.split(/\r?\n/).length;
    if (!/Legacy Claude command wrapper for the portable/.test(command)) {
      fail(errors, `commands/${commandFile}`, "top-level Claude commands must be portable-skill wrappers");
    }
    if (!/~\/\.ai-tools\/skills\/[a-z0-9-]+\/SKILL\.md/.test(command)) {
      fail(errors, `commands/${commandFile}`, "wrapper must point to a canonical portable skill");
    }
    if (lineCount > 12) {
      fail(errors, `commands/${commandFile}`, `wrapper is ${lineCount} lines; workflow logic belongs in skills`);
    }
    console.log(`checked  commands/${commandFile} (${lineCount} lines)`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`error    ${error}`);
  console.error(`validate-skills: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`validate-skills: ${skillNames.length} skill(s) valid`);
