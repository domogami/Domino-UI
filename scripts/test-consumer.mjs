import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
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
if (gitIndex !== -1)
  assert(
    gitDependency?.startsWith("git+"),
    "Pass a pinned git+https://…#<commit> or git+file://…#<commit> dependency after --git.",
  );
const offline = process.argv.includes("--offline");

function run(command, args, cwd = temporary, shouldSucceed = true) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if ((result.status === 0) !== shouldSucceed) {
    throw new Error(
      `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
    );
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
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else result.push(path);
  }
  return result;
}

try {
  console.log("Packing Domino UI with the normal prepare lifecycle…");
  const packed = npmRun(
    ["pack", "--json", "--pack-destination", temporary],
    root,
  );
  const metadata = JSON.parse(packed.slice(packed.lastIndexOf("\n[") + 1))[0];
  const dependencies = {
    "@domlee/ui": gitDependency ?? `file:${join(temporary, metadata.filename)}`,
    react: pkg.devDependencies.react,
    "react-dom": pkg.devDependencies["react-dom"],
  };
  const devDependencies = Object.fromEntries(
    ["typescript", "vite", "@types/react", "@types/react-dom"].map((name) => [
      name,
      pkg.devDependencies[name],
    ]),
  );
  await put(
    "package.json",
    JSON.stringify(
      { private: true, type: "module", dependencies, devDependencies },
      null,
      2,
    ),
  );
  console.log(
    `Installing ${gitDependency ? "the pinned Git source" : "the tarball"} in an isolated consumer${offline ? " (offline mode)" : ""}…`,
  );
  npmRun([
    "install",
    ...(offline ? ["--offline"] : []),
    "--no-audit",
    "--no-fund",
  ]);

  const installed = join(temporary, "node_modules/@domlee/ui");
  for (const target of Object.values(pkg.exports)) {
    if (typeof target === "string" && !target.includes("*"))
      await readFile(resolve(installed, target));
    else if (typeof target === "object")
      for (const file of Object.values(target))
        await readFile(resolve(installed, file));
  }
  for (const file of [
    "public/fonts/caveat-OFL.txt",
    "public/fonts/poppins-OFL.txt",
    "docs/licenses/hairline-MIT.txt",
    "public/sketches/notebook-hybrid.svg",
    "scripts/copy-assets.mjs",
  ]) {
    await readFile(join(installed, file));
  }
  const fontCss = await readFile(join(installed, "lib/fonts.css"), "utf8");
  assert(
    !fontCss.includes('url("/fonts/'),
    "Package font URLs must support app base paths.",
  );
  for (const [, font] of fontCss.matchAll(/url\("([^"\n]+)"\)/g))
    await readFile(resolve(installed, "lib", font));

  await put(
    "src/main.tsx",
    `import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { BookmarkDrawing, Button, Card, Chevron, Dialog, HairlineSketch, NotebookSketch, NotificationCard, Popover, Skeleton, TaskCheckbox, ThemeProvider, ThemeToggle, TouchFeedbackProvider, TripleBanner, createPageTransition, type DrawingProps } from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";
function App() {
  const [open, setOpen] = useState(false);
  const [heading, setHeading] = useState("A shared notebook");
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const drawing: DrawingProps = { animate: true, quiet: false, speed: 1, replayKey: 0 };
  const pageTransition = useMemo(() => createPageTransition(), []);
  return <ThemeProvider><TouchFeedbackProvider><ThemeToggle /><Card title={heading} className="dm-page-transition"><Button ref={returnFocusRef} trailingIcon={<Chevron />} onClick={() => setOpen(true)}>Keep going</Button><Button variant="secondary" onClick={() => { void pageTransition.run(() => flushSync(() => setHeading("A new notebook page"))); }}>Turn page</Button><TaskCheckbox label="A little progress" /><NotebookSketch variant="flight" replayOnClick /><HairlineSketch variant="branches" /><Skeleton width="70%" />
    <TripleBanner {...drawing} lines={["One good thought", "room to let it grow", "a few good pieces"]} tone="sage" replayOnClick label="Three thoughts on one ribbon" />
    <BookmarkDrawing {...drawing} variant="notched" replayOnClick label="A place kept for later" /><BookmarkDrawing {...drawing} variant="pointed" quiet label="A pointed bookmark" />
    <Popover title="A thought in the margin" eyebrow="A closer look" trigger={<Button variant="secondary">Show context</Button>} footer={<Button size="sm">Keep this thought</Button>}><p>Supporting context stays close to its source.</p></Popover>
    <NotificationCard source="Notebook" title="A thought, saved" count={3} surface="ink" time="Just now" icon={<Chevron />} actions={<Button size="sm">Open note</Button>}><p>Ready when you come back.</p></NotificationCard>
    <Dialog motion="fold" open={open} onClose={() => setOpen(false)} returnFocusRef={returnFocusRef} title="A thought worth keeping" eyebrow="Your notebook" icon={<Chevron />} surface="ink" footer={<Button onClick={() => setOpen(false)}>Done</Button>}><p>One focused decision, on its own sheet of paper.</p></Dialog>
  </Card></TouchFeedbackProvider></ThemeProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
`,
  );
  await put(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          types: ["vite/client"],
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  await put(
    "index.html",
    '<!doctype html><html data-theme="hybrid"><div id="root"></div><script type="module" src="/src/main.tsx"></script></html>',
  );
  npmRun(["exec", "--no", "--", "tsc", "--project", "tsconfig.json"]);
  npmRun(["exec", "--no", "--", "vite", "build", "--base", "/nested/"]);
  const files = await walk(join(temporary, "dist"));
  const css = (
    await Promise.all(
      files
        .filter((file) => file.endsWith(".css"))
        .map((file) => readFile(file, "utf8")),
    )
  ).join("\n");
  for (const rule of [
    ".dm-button",
    ".dm-skeleton",
    ".dm-task-checkbox",
    ".dm-menu-toggle",
    ".dm-notebook-sketch",
    ".dm-hairline",
    ".dm-popover",
    ".dm-popover__body",
    ".dm-notification-card__count",
    ".dm-triple-banner",
    ".dm-triple-banner__band",
    ".dm-bookmark-drawing",
    ".dm-journal-art-line",
    ".dm-dialog--fold",
    ".dm-notification-card__actions",
    ".dm-dialog--ink",
    ".dm-dialog::backdrop",
    ".dm-dialog__eyebrow",
    ".dm-page-transition",
    "::view-transition-new(dm-page-content)",
    "@font-face",
    "--dm-accent",
    "--dm-layer-duration",
    "--dm-layer-exit-duration",
    "--dm-layer-easing",
    "--dm-dialog-duration",
    "--dm-dialog-exit-duration",
    "--dm-shadow-layer",
  ])
    assert(css.includes(rule), `Consumer CSS is missing ${rule}`);
  assert(
    !css.includes("dm-notification-card__papers"),
    "Notifications must not ship duplicate backing sheets.",
  );
  assert(
    !css.includes("dm-notification-card--stacked"),
    "Notifications use a readable queue badge on one sheet.",
  );
  assert(
    files.some((file) => /Caveat.*\.woff2$/.test(file)),
    "Consumer build must self-host Caveat.",
  );
  assert(
    !css.includes("url(/fonts/"),
    "Consumer must not depend on a root /fonts directory.",
  );
  for (const [, url] of css.matchAll(/url\((?:["']?)(\/nested\/[^)"']+)/g))
    await readFile(join(temporary, "dist", url.slice("/nested/".length)));

  await put(
    "ssr.mjs",
    `import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { BookmarkDrawing, Button, Card, Chevron, Dialog, HairlineSketch, NotebookSketch, NotificationCard, Popover, Skeleton, TaskCheckbox, ThemeProvider, TripleBanner, createPageTransition } from "@domlee/ui";
assert.equal(typeof document, "undefined");
const pageTransition = createPageTransition();
let committed = false;
const navigation = pageTransition.run(() => { committed = true; });
assert.equal(committed, true, "SSR navigation must commit synchronously without DOM APIs.");
await navigation;
pageTransition.skip();
pageTransition.cancel();
const html = renderToString(h(ThemeProvider, {}, h(Card, {title: "A shared notebook"},
  h(TaskCheckbox, {label:"A little progress"}), h(NotebookSketch, {variant:"notebook", quiet:true}), h(HairlineSketch, {variant:"riffle", quiet:true}), h(Skeleton, {width:"70%"}), h(Chevron),
  h(TripleBanner, {lines:["One good thought", "room to let it grow", "a few good pieces"], animate:true, replayOnClick:true, label:"Three thoughts on one ribbon"}),
  h(BookmarkDrawing, {variant:"notched", replayOnClick:true, label:"A place kept for later"}), h(BookmarkDrawing, {variant:"pointed", quiet:true, label:"A pointed bookmark"}),
  h(Popover, {title:"A thought in the margin", trigger:h(Button, {}, "Show context")}, h("p", {}, "Supporting context stays close to its source.")),
  h(Popover, {title:"An initially open margin", defaultOpen:true, trigger:h(Button, {}, "Open by default")}, h("p", {}, "Initial open state can render without a browser.")),
  h(NotificationCard, {source:"Notebook", title:"A thought, saved", count:3, surface:"ink", time:"Just now", actions:h(Button, {}, "Open note")}, h("p", {}, "Ready when you come back.")),
  h(Dialog, {open:false, onClose:()=>{}, title:"A thought worth keeping", eyebrow:"Your notebook", icon:h(Chevron), surface:"ink", footer:h(Button, {}, "Done")}, h("p", {}, "One focused decision."))
)));
assert(html.includes("A shared notebook"));
assert(html.includes("dm-notebook-sketch"));
assert(html.includes("dm-skeleton"));
assert(html.includes("dm-popover"));
assert(html.includes('aria-haspopup="dialog"'));
assert(html.includes('aria-expanded="false"'));
assert(html.includes('aria-expanded="true"'));
assert(html.includes("An initially open margin"));
assert(html.includes("dm-notification-card--queued"));
assert(!html.includes("dm-notification-card__papers"));
assert(!html.includes("dm-notification-card--stacked"));
assert.equal((html.match(/class="dm-triple-banner__band"/g) ?? []).length, 3);
assert(html.includes("One good thought"));
assert(html.includes("dm-bookmark-drawing"));
assert(html.includes('data-variant="notched"'));
assert(html.includes('data-variant="pointed"'));
assert(html.includes("dm-dialog--fold"));
assert(html.replace(/<[^>]*>/g, "").includes("3 in queue"));
assert(html.includes("dm-notification-card__actions"));
assert(html.includes("dm-dialog--ink"));
assert(html.includes("dm-dialog__eyebrow"));
assert(html.includes("A thought worth keeping"));
`,
  );
  run(process.execPath, ["ssr.mjs"]);

  const cli = join(installed, "scripts/copy-assets.mjs");
  npmRun(["exec", "--no", "--", "domino-ui-assets", "public"]);
  run(process.execPath, [cli, "public"]);
  await readFile(join(temporary, "public/fonts/Caveat.woff2"));
  await readFile(join(temporary, "public/fonts/caveat-OFL.txt"));
  await readFile(join(temporary, "public/sketches/notebook-hybrid.svg"));
  await put("public/fonts/Caveat.woff2", "Consumer-owned font");
  run(process.execPath, [cli, "public"], temporary, false);
  assert.equal(
    await readFile(join(temporary, "public/fonts/Caveat.woff2"), "utf8"),
    "Consumer-owned font",
  );
  run(process.execPath, [cli, "public", "--force"]);
  assert(
    (await readFile(join(temporary, "public/fonts/Caveat.woff2"))).length >
      1000,
  );
  run(process.execPath, [cli, "--help"]);
  run(process.execPath, [cli, "public", "--only"], temporary, false);
  console.log(
    `Passed: ${gitDependency ? "Git prepare install" : "tarball install"}, packaged exports and licenses, strict consumer types, React SSR, Vite at /nested/, bundled fonts, and safe asset copying (${metadata.files.length} package files).`,
  );
} finally {
  if (process.env.DOMINO_KEEP_CONSUMER === "1")
    console.log(`Consumer fixture retained: ${temporary}`);
  else await rm(temporary, { recursive: true, force: true });
}
