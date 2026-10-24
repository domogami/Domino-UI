import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "domino-consumer-"));
const npm = process.env.npm_execpath;
assert(npm, "Run this check with npm run test:package.");
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const gitIndex = process.argv.indexOf("--git");
const gitDependency = gitIndex === -1 ? undefined : process.argv[gitIndex + 1];
if (gitIndex !== -1) assert(gitDependency?.startsWith("git+"), "Pass a pinned git+https://…#<commit> or git+file://…#<commit> dependency after --git.");
const offline = process.argv.includes("--offline");

function run(command, args, cwd = temporary, shouldSucceed = true) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if ((result.status === 0) !== shouldSucceed) {
    throw new Error(`${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}
function npmRun(args, cwd = temporary) {
  return run(process.execPath, [npm, ...args], cwd);
}
async function put(file, contents) {
  await mkdir(dirname(join(temporary, file)), { recursive: true });
  await writeFile(join(temporary, file), contents);
}
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

try {
  console.log("Packing Domino UI with the normal prepare lifecycle…");
  const packed = npmRun(["pack", "--json", "--pack-destination", temporary], root);
  const metadata = JSON.parse(packed.slice(packed.lastIndexOf("\n[") + 1))[0];
  const dependencies = {
    "@domlee/ui": gitDependency ?? `file:${join(temporary, metadata.filename)}`,
    react: pkg.devDependencies.react,
    "react-dom": pkg.devDependencies["react-dom"],
  };
  const devDependencies = Object.fromEntries(
    ["typescript", "vite", "@types/react", "@types/react-dom"].map(name => [name, pkg.devDependencies[name]]),
  );
  await put("package.json", JSON.stringify({ private: true, type: "module", dependencies, devDependencies }, null, 2));
  console.log(`Installing ${gitDependency ? "the pinned Git source" : "the tarball"} in an isolated consumer${offline ? " (offline mode)" : ""}…`);
  npmRun(["install", ...(offline ? ["--offline"] : []), "--no-audit", "--no-fund"]);

  const installed = join(temporary, "node_modules/@domlee/ui");
  for (const target of Object.values(pkg.exports)) {
    if (typeof target === "string" && !target.includes("*")) await readFile(resolve(installed, target));
    else if (typeof target === "object") for (const file of Object.values(target)) await readFile(resolve(installed, file));
  }
  for (const file of ["public/fonts/caveat-OFL.txt", "public/fonts/poppins-OFL.txt", "docs/licenses/hairline-MIT.txt", "public/sketches/notebook-hybrid.svg", "scripts/copy-assets.mjs"]) {
    await readFile(join(installed, file));
  }
  const fontCss = await readFile(join(installed, "lib/fonts.css"), "utf8");
  assert(!fontCss.includes('url("/fonts/'), "Package font URLs must support app base paths.");
  for (const [, font] of fontCss.matchAll(/url\("([^"\n]+)"\)/g)) await readFile(resolve(installed, "lib", font));

  await put("src/main.tsx", `import { createRoot } from "react-dom/client";
import { Button, Card, Chevron, HairlineSketch, NotebookSketch, Skeleton, TaskCheckbox, ThemeProvider, ThemeToggle, TouchFeedbackProvider } from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";
function App() {
  return <ThemeProvider><TouchFeedbackProvider><ThemeToggle /><Card title="A shared notebook"><Button trailingIcon={<Chevron />}>Keep going</Button><TaskCheckbox label="A little progress" /><NotebookSketch variant="flight" replayOnClick /><HairlineSketch variant="branches" /><Skeleton width="70%" /></Card></TouchFeedbackProvider></ThemeProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
`);
  await put("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: false, noEmit: true, types: ["vite/client"] }, include: ["src"] }, null, 2));
  await put("index.html", '<!doctype html><html data-theme="hybrid"><div id="root"></div><script type="module" src="/src/main.tsx"></script></html>');
  npmRun(["exec", "--no", "--", "tsc", "--project", "tsconfig.json"]);
  npmRun(["exec", "--no", "--", "vite", "build", "--base", "/nested/"]);
  const files = await walk(join(temporary, "dist"));
  const css = (await Promise.all(files.filter(file => file.endsWith(".css")).map(file => readFile(file, "utf8")))).join("\n");
  for (const rule of [".dm-button", ".dm-skeleton", ".dm-task-checkbox", ".dm-menu-toggle", ".dm-notebook-sketch", ".dm-hairline", "@font-face", "--dm-accent"]) assert(css.includes(rule), `Consumer CSS is missing ${rule}`);
  assert(files.some(file => /Caveat.*\.woff2$/.test(file)), "Consumer build must self-host Caveat.");
  assert(!css.includes('url(/fonts/'), "Consumer must not depend on a root /fonts directory.");
  for (const [, url] of css.matchAll(/url\((?:["']?)(\/nested\/[^)"']+)/g)) await readFile(join(temporary, "dist", url.slice("/nested/".length)));

  await put("ssr.mjs", `import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { Card, Chevron, HairlineSketch, NotebookSketch, Skeleton, TaskCheckbox, ThemeProvider } from "@domlee/ui";
const html = renderToString(h(ThemeProvider, {}, h(Card, {title: "A shared notebook"}, h(TaskCheckbox, {label:"A little progress"}), h(NotebookSketch, {variant:"notebook", quiet:true}), h(HairlineSketch, {variant:"riffle", quiet:true}), h(Skeleton, {width:"70%"}), h(Chevron))));
assert(html.includes("A shared notebook"));
assert(html.includes("dm-notebook-sketch"));
assert(html.includes("dm-skeleton"));
`);
  run(process.execPath, ["ssr.mjs"]);

  const cli = join(installed, "scripts/copy-assets.mjs");
  npmRun(["exec", "--no", "--", "domino-ui-assets", "public"]);
  run(process.execPath, [cli, "public"]);
  await readFile(join(temporary, "public/fonts/Caveat.woff2"));
  await readFile(join(temporary, "public/fonts/caveat-OFL.txt"));
  await readFile(join(temporary, "public/sketches/notebook-hybrid.svg"));
  await put("public/fonts/Caveat.woff2", "Consumer-owned font");
  run(process.execPath, [cli, "public"], temporary, false);
  assert.equal(await readFile(join(temporary, "public/fonts/Caveat.woff2"), "utf8"), "Consumer-owned font");
  run(process.execPath, [cli, "public", "--force"]);
  assert((await readFile(join(temporary, "public/fonts/Caveat.woff2"))).length > 1000);
  run(process.execPath, [cli, "--help"]);
  run(process.execPath, [cli, "public", "--only"], temporary, false);
  console.log(`Passed: ${gitDependency ? "Git prepare install" : "tarball install"}, packaged exports and licenses, strict consumer types, React SSR, Vite at /nested/, bundled fonts, and safe asset copying (${metadata.files.length} package files).`);
} finally {
  if (process.env.DOMINO_KEEP_CONSUMER === "1") console.log(`Consumer fixture retained: ${temporary}`);
  else await rm(temporary, { recursive: true, force: true });
}
