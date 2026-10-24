import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  resolveSystem,
  renderNativeTokens,
  renderWebTokens,
} from "../scripts/system-core.mjs";
const source = JSON.parse(
  await readFile(new URL("../tokens/system.json", import.meta.url), "utf8"),
);
const system = resolveSystem(source);

test("all consumers resolve the same complete three-theme contract with Hybrid as default", () => {
  assert.equal(system.defaultTheme, "hybrid");
  assert.equal(system.themes.hybrid.paper, "#efe7d7");
  assert.equal(system.themes.hybrid.sidebar, "#2b3034");
  assert.equal(system.themes.dark.paper, "#2b3034");
  assert.equal(system.themes.light.sidebar, "#f0eadd");
  assert.equal(system.themes.dark.accent, "#b6cf8e");
  const keys = Object.keys(system.themes.light).sort();
  for (const name of ["light", "dark", "hybrid"]) {
    assert.deepEqual(Object.keys(system.themes[name]).sort(), keys);
    assert.equal(system.themes[name]["grid-size"], "32px");
    assert.equal(system.themes[name]["name-fill-delay"], "1320ms");
    assert.equal(system.themes[name]["font-hand"], '"Caveat", cursive');
    assert.ok(
      Object.values(system.themes[name]).every((v) => !v.includes("{palette.")),
    );
  }
});

test("invalid inheritance, missing palette references, and invalid CSS fail before generation", () => {
  const cycle = structuredClone(source);
  cycle.themes.light.extends = "dark";
  assert.throws(() => resolveSystem(cycle), /Circular theme inheritance/);
  const missing = structuredClone(source);
  missing.themes.light.tokens.paper = "{palette.missing}";
  assert.throws(() => resolveSystem(missing), /Unknown palette/);
  const invalid = structuredClone(source);
  invalid.shared["font-body"] = "Lexend; color: red";
  assert.throws(() => resolveSystem(invalid), /Invalid token value/);
  const fallback = structuredClone(source);
  fallback.defaultTheme = "dark";
  assert.throws(() => resolveSystem(fallback), /Hybrid as the default/);
});

test("generated CSS translates native theme names without coupling consumers to React", () => {
  const quartz = renderNativeTokens(system, "quartz");
  assert.match(quartz, /html\.domino-ui\[data-notebook-theme="blended"\]/);
  assert.doesNotMatch(quartz, /saved-theme="blended"/);
  const obsidian = renderNativeTokens(system, "obsidian");
  assert.match(
    obsidian,
    /body:not\(\.domino-theme-light\):not\(\.domino-theme-dark\)/,
  );
  assert.match(obsidian, /body\.domino-theme-dark/);
  assert.match(renderWebTokens(system), /:root \{/);
  for (const css of [quartz, obsidian]) {
    assert.ok(css.includes(system.fingerprint));
    assert.doesNotMatch(css, /react|node_modules|@import/);
  }
});

test("platform bundles carry one version and offline Obsidian includes fonts with licenses", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../platforms/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.fingerprint, system.fingerprint);
  assert.equal(manifest.version, system.version);
  assert.equal(manifest.defaultTheme, "hybrid");
  const families = new Set(source.fonts.map((font) => font.family));
  assert.equal(families.size, 5);
  for (const platform of ["portfolio", "quartz", "obsidian"]) {
    const css = await readFile(
      new URL(`../platforms/${platform}/domino-ui.css`, import.meta.url),
      "utf8",
    );
    assert.ok(css.includes(system.fingerprint));
    assert.equal((css.match(/@font-face/g) || []).length, source.fonts.length);
    if (platform === "obsidian") {
      assert.match(css, /data:font\/(woff2|ttf);base64,/);
      assert.doesNotMatch(css, /url\(["']?(https?:|\.\/fonts|\/fonts)/);
      for (const license of new Set(source.fonts.map((font) => font.license)))
        assert.ok(css.includes(license));
      assert.match(css, /default: domino-theme-hybrid/);
    } else
      for (const font of source.fonts)
        await readFile(
          new URL(
            `../platforms/${platform}/fonts/${font.file}`,
            import.meta.url,
          ),
        );
  }
});
