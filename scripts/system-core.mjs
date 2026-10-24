import { createHash } from "node:crypto";

export const themes = ["hybrid", "light", "dark"];
export function resolveSystem(source) {
  if (source.schemaVersion !== 1 || source.defaultTheme !== "hybrid")
    throw new Error("Expected schema v1 and Hybrid as the default.");
  if (!/^\d+\.\d+\.\d+$/.test(source.version))
    throw new Error("Invalid system version.");
  const value = (input) => {
    if (typeof input !== "string") throw new Error("Tokens must be strings.");
    return input.replace(/\{palette\.([\w-]+)\}/g, (_, name) => {
      if (!Object.hasOwn(source.palette, name))
        throw new Error(`Unknown palette value: ${name}`);
      return source.palette[name];
    });
  };
  const resolveValues = (object) =>
    Object.fromEntries(
      Object.entries(object).map(([key, val]) => {
        if (!/^[a-z][a-z0-9-]*$/.test(key))
          throw new Error(`Invalid token name: ${key}`);
        const result = value(val);
        if (/[{};]/.test(result))
          throw new Error(`Invalid token value: ${key}`);
        return [key, result];
      }),
    );
  const resolved = {};
  function resolveTheme(name, visiting = []) {
    if (resolved[name]) return resolved[name];
    if (visiting.includes(name))
      throw new Error(`Circular theme inheritance: ${name}`);
    const definition = source.themes[name];
    if (!definition) throw new Error(`Unknown theme: ${name}`);
    const parent = definition.extends
      ? resolveTheme(definition.extends, [...visiting, name])
      : {};
    return (resolved[name] = {
      ...parent,
      ...resolveValues(definition.tokens),
    });
  }
  for (const name of themes) resolveTheme(name);
  const keys = Object.keys(resolved.light).sort().join();
  for (const name of themes)
    if (Object.keys(resolved[name]).sort().join() !== keys)
      throw new Error(`Theme roles differ: ${name}`);
  const shared = resolveValues(source.shared);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(source))
    .digest("hex");
  return {
    schemaVersion: 1,
    name: source.name,
    version: source.version,
    defaultTheme: source.defaultTheme,
    fingerprint,
    shared,
    themes: Object.fromEntries(
      themes.map((name) => [name, { ...shared, ...resolved[name] }]),
    ),
  };
}
export function header(system) {
  return `/* GENERATED from tokens/system.json — Domino UI ${system.version}.\n   Source SHA-256: ${system.fingerprint}\n   Edit the canonical source, then run npm run build:system. */\n`;
}
export function cssBlock(selector, values, theme) {
  return `${selector} {\n${Object.entries(values)
    .map(([key, value]) => `  --dm-${key}: ${value};`)
    .join("\n")}\n  color-scheme: ${theme === "dark" ? "dark" : "light"};\n}\n`;
}
export function renderWebTokens(system) {
  return (
    header(system) +
    cssBlock(":root", system.themes.hybrid, "hybrid") +
    themes
      .map((name) =>
        cssBlock(`[data-theme="${name}"]`, system.themes[name], name),
      )
      .join("")
  );
}
export function renderNativeTokens(system, platform) {
  if (platform === "quartz")
    return (
      header(system) +
      cssBlock("html.domino-ui", system.themes.hybrid, "hybrid") +
      themes
        .map((name) =>
          cssBlock(
            `html.domino-ui[data-notebook-theme="${name === "hybrid" ? "blended" : name}"]`,
            system.themes[name],
            name,
          ),
        )
        .join("")
    );
  if (platform === "obsidian")
    return (
      header(system) +
      cssBlock("body", system.themes.hybrid, "hybrid") +
      ["light", "dark"]
        .map((name) =>
          cssBlock(`body.theme-${name}`, system.themes[name], name),
        )
        .join("") +
      cssBlock(
        "body:not(.domino-theme-light):not(.domino-theme-dark),\nbody.domino-theme-hybrid",
        system.themes.hybrid,
        "hybrid",
      ) +
      ["light", "dark"]
        .map((name) =>
          cssBlock(`body.domino-theme-${name}`, system.themes[name], name),
        )
        .join("")
    );
  if (platform === "portfolio")
    return (
      header(system) +
      cssBlock("html.domino-ui", system.themes.hybrid, "hybrid") +
      themes
        .map((name) =>
          cssBlock(
            `html.domino-ui[data-theme="${name}"]`,
            system.themes[name],
            name,
          ),
        )
        .join("")
    );
  throw new Error(`Unknown platform: ${platform}`);
}
export function renderFontFaces(fonts, getUrl) {
  return fonts
    .map(
      (font) =>
        `@font-face {\n  font-family: ${JSON.stringify(font.family)};\n  font-style: normal;\n  font-weight: ${font.weight};\n  font-display: swap;\n  src: url(${JSON.stringify(getUrl(font))}) format(${JSON.stringify(font.format)});\n}\n`,
    )
    .join("");
}
