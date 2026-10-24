import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NotebookSketch } from "../lib/domino-ui.js";

// Static native-platform companions to the React art, from the same geometry.
// Run after build:lib; no separate hand-maintained drawing paths.
const root = new URL("../", import.meta.url);
const read = (path, encoding) => readFile(new URL(path, root), encoding);
const [tokens, css, font, fontLicense] = await Promise.all([
  read("tokens/resolved.json", "utf8").then(JSON.parse),
  read("src/lib/sketch.css", "utf8"),
  read("public/fonts/Caveat.woff2"),
  read("public/fonts/caveat-OFL.txt", "utf8"),
]);
const destination = new URL("public/sketches/", root);
await mkdir(destination, { recursive: true });
const xml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const labels = {
  notebook: "An open bullet journal with little checkboxes and a pen",
  flight: "A folded paper plane with a loose looping flight trail",
  garden: "A small leafy idea growing out of a stack of notebook pages",
  camera: "A little camera beside two keepsake photographs",
  keyboard: "A mechanical keyboard with a curly cable and a few teal keys",
  compass: "An open compass resting on a folded map with a wandering trail",
};
for (const theme of ["hybrid", "light", "dark"]) {
  const properties = Object.entries(tokens.themes[theme])
    .map(([key, value]) => `--dm-${key}:${value};`)
    .join("");
  for (const [variant, label] of Object.entries(labels)) {
    const markup = renderToStaticMarkup(
      createElement(NotebookSketch, {
        variant,
        label,
        quiet: true,
        interactive: false,
      }),
    );
    const style = `@font-face{font-family:Caveat;src:url(data:font/woff2;base64,${font.toString("base64")}) format('woff2');font-weight:400 700;}svg{${properties}}${css}`;
    const svg = markup
      .replace(
        "<svg ",
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" ',
      )
      .replace(
        "><title",
        `><metadata>${xml(`Original Domino UI notebook artwork. Embedded Caveat font:\n${fontLicense}`)}</metadata><style>${style}</style><title`,
      );
    await writeFile(new URL(`${variant}-${theme}.svg`, destination), svg);
  }
}
console.log(
  `Exported ${Object.keys(labels).length * 3} completed notebook SVGs to ${fileURLToPath(destination)}`,
);
