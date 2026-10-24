import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Runtime CSS is published as styles.css. Declarations must not depend on
// source-only side-effect imports that do not exist in the built package.
async function finalize(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await finalize(path);
    else if (entry.name.endsWith(".d.ts")) {
      const source = await readFile(path, "utf8");
      await writeFile(
        path,
        source.replace(/^import\s+["'][^"']+\.css["'];?\r?\n/gm, ""),
      );
    }
  }
}
await finalize(fileURLToPath(new URL("../lib/", import.meta.url)));

// Published font URLs are relative to this package so bundlers can fingerprint
// and self-host the binaries, including when an app lives below a URL prefix.
const fonts = await readFile(new URL("../src/styles/fonts.css", import.meta.url), "utf8");
await writeFile(
  new URL("../lib/fonts.css", import.meta.url),
  fonts.replaceAll('url("/fonts/', 'url("../public/fonts/'),
);
