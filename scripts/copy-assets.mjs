#!/usr/bin/env node
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const usage = `Usage: domino-ui-assets <public-directory> [--only fonts|sketches] [--force]

Copy Domino UI's fonts (with OFL notices) and standalone SVG sketches into a
static directory. Existing identical files are left alone. Differing files are
protected unless --force is supplied. React bundlers can import
@domlee/ui/fonts.css directly; this command is optional for static asset reuse.
`;
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}
let destination;
let only;
let force = false;
for (let i = 0; i < args.length; i++) {
  const value = args[i];
  if (value === "--force") force = true;
  else if (value === "--only") {
    only = args[++i];
    if (!["fonts", "sketches"].includes(only)) throw new Error(usage);
  } else if (!value.startsWith("-") && !destination) destination = value;
  else throw new Error(`Unknown argument: ${value}\n${usage}`);
}
if (!destination || (only !== undefined && !["fonts", "sketches"].includes(only))) {
  console.error(usage);
  process.exit(1);
}

const source = fileURLToPath(new URL("../public/", import.meta.url));
const categories = only ? [only] : ["fonts", "sketches"];
const plan = [];
for (const category of categories) {
  for (const entry of await readdir(join(source, category), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const from = join(source, category, entry.name);
    const to = resolve(destination, category, entry.name);
    const contents = await readFile(from);
    let existing;
    try {
      existing = await readFile(to);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (existing?.equals(contents)) continue;
    if (existing && !force)
      throw new Error(`Existing asset differs: ${to}. Review it before rerunning with --force.`);
    plan.push({ from, to });
  }
}
// Check the complete plan before writing any file. Never copy private notes or
// arbitrary package contents: only these two public asset directories qualify.
for (const { from, to } of plan) {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to, force ? 0 : constants.COPYFILE_EXCL);
}
console.log(`Copied ${plan.length} Domino UI assets into ${resolve(destination)}.`);
