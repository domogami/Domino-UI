import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveSystem,
  header,
  renderWebTokens,
  renderNativeTokens,
  renderFontFaces,
} from "./system-core.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
JSON.parse(await readFile(join(root, "tokens/schema.json"), "utf8"));
const source = JSON.parse(
  await readFile(join(root, "tokens/system.json"), "utf8"),
);
const system = resolveSystem(source);
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (pkg.version !== system.version)
  throw new Error("Package and canonical design system versions must match.");
const check = process.argv.includes("--check");
const tokensOnly = process.argv.includes("--tokens-only");
const output = new Map([
  ["src/styles/tokens.css", renderWebTokens(system)],
  [
    "src/styles/fonts.css",
    header(system) +
      renderFontFaces(source.fonts, (font) => `/fonts/${font.file}`),
  ],
  ["tokens/resolved.json", JSON.stringify(system, null, 2) + "\n"],
]);
for (const font of source.fonts) {
  if (
    basename(font.file) !== font.file ||
    basename(font.license) !== font.license
  )
    throw new Error("Font filenames must remain inside public/fonts.");
  await readFile(join(root, "public/fonts", font.file));
  await readFile(join(root, "public/fonts", font.license));
}
if (!tokensOnly) {
  const licenseNames = [...new Set(source.fonts.map((font) => font.license))];
  const notices = (
    await Promise.all(
      licenseNames.map(
        async (name) =>
          `/* ${name}\n${(await readFile(join(root, "public/fonts", name), "utf8")).replaceAll("*/", "* /")}\n*/`,
      ),
    )
  ).join("\n");
  const embeddedUrls = new Map(
    await Promise.all(
      source.fonts.map(async (font) => [
        font.file,
        `data:${font.mime};base64,${(await readFile(join(root, "public/fonts", font.file))).toString("base64")}`,
      ]),
    ),
  );
  const manifest = {
    schemaVersion: 1,
    version: system.version,
    fingerprint: system.fingerprint,
    defaultTheme: system.defaultTheme,
    status: "prepared; adoption and native-runtime validation pending",
    platforms: {},
  };
  for (const platform of ["portfolio", "quartz", "obsidian"]) {
    const adapter = await readFile(
      join(root, `src/adapters/${platform}.css`),
      "utf8",
    );
    const fontCss =
      platform === "obsidian"
        ? notices +
          "\n" +
          renderFontFaces(source.fonts, (font) => embeddedUrls.get(font.file))
        : renderFontFaces(source.fonts, (font) => `./fonts/${font.file}`);
    const file = `platforms/${platform}/domino-ui.css`;
    output.set(
      file,
      renderNativeTokens(system, platform) + "\n" + fontCss + "\n" + adapter,
    );
    manifest.platforms[platform] = {
      css: file,
      themes:
        platform === "quartz"
          ? { hybrid: "blended", light: "light", dark: "dark" }
          : platform === "obsidian"
            ? {
                hybrid: "domino-theme-hybrid",
                light: "domino-theme-light",
                dark: "domino-theme-dark",
              }
            : { hybrid: "hybrid", light: "light", dark: "dark" },
      source: `src/adapters/${platform}.css`,
    };
    if (!check && platform !== "obsidian") {
      const destination = join(root, `platforms/${platform}/fonts`);
      await mkdir(destination, { recursive: true });
      for (const name of [
        ...new Set(source.fonts.flatMap((font) => [font.file, font.license])),
      ])
        await copyFile(
          join(root, "public/fonts", name),
          join(destination, name),
        );
    }
  }
  output.set(
    "platforms/manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
let stale = [];
for (const [file, content] of output) {
  const path = join(root, file);
  if (check) {
    let existing;
    try {
      existing = await readFile(path, "utf8");
    } catch {}
    if (existing !== content) stale.push(file);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}
if (stale.length)
  throw new Error(
    `Generated files differ: ${stale.join(", ")}. Run npm run build:system.`,
  );
console.log(
  `${check ? "Verified" : "Generated"} Domino UI ${system.version} (${system.fingerprint.slice(0, 12)}): ${output.size} artifacts, Hybrid default.`,
);
