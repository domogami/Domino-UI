import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const bundle = (platform: string) =>
  readFileSync(
    new URL(`../platforms/${platform}/domino-ui.css`, import.meta.url),
    "utf8",
  );
const expected = {
  hybrid: { paper: "rgb(239, 231, 215)", chrome: "rgb(43, 48, 52)" },
  light: { paper: "rgb(239, 231, 215)", chrome: "rgb(240, 234, 221)" },
  dark: { paper: "rgb(43, 48, 52)", chrome: "rgb(37, 43, 46)" },
};

for (const theme of ["hybrid", "light", "dark"] as const) {
  test(`Quartz and portfolio native bridges follow canonical ${theme} surfaces`, async ({
    page,
  }) => {
    await page.setContent(
      `<html class="domino-ui" data-notebook-theme="${theme === "hybrid" ? "blended" : theme}"><head><style>${bundle("quartz")}\n.test-paper{background:var(--light);color:var(--darkgray)}</style></head><body><div class="page"><div id="quartz-body"><aside class="sidebar left">Explorer</aside><article class="test-paper">A reading surface</article></div></div></body></html>`,
    );
    await expect(page.locator("article")).toHaveCSS(
      "background-color",
      expected[theme].paper,
    );
    await expect(page.locator(".sidebar.left")).toHaveCSS(
      "background-color",
      expected[theme].chrome,
    );
    await page.setContent(
      `<html class="domino-ui" data-theme="${theme}"><head><style>${bundle("portfolio")}</style></head><body><div class="notebook"><header class="masthead">The notebook</header><div class="hero-paper">A reading surface</div></div></body></html>`,
    );
    await expect(page.locator(".hero-paper")).toHaveCSS(
      "background-color",
      expected[theme].paper,
    );
    await expect(page.locator(".masthead")).toHaveCSS(
      "background-color",
      expected[theme].chrome,
    );
  });
  test(`Obsidian generated snippet follows explicit ${theme} independent of native appearance`, async ({
    page,
  }) => {
    for (const native of ["light", "dark"]) {
      await page.setContent(
        `<html><head><style>${bundle("obsidian")}\n.chrome{background:var(--background-primary)}.paper{background:var(--background-primary);color:var(--text-normal)}</style></head><body class="theme-${native} domino-theme-${theme}"><div class="workspace chrome">Navigation</div><div class="workspace-leaf-content paper" data-type="markdown">A reading surface</div></body></html>`,
      );
      await expect(page.locator(".paper")).toHaveCSS(
        "background-color",
        expected[theme].paper,
      );
      await expect(page.locator(".chrome")).toHaveCSS(
        "background-color",
        expected[theme].chrome,
      );
      await expect(page.locator(".paper")).toHaveCSS(
        "color",
        theme === "dark" ? "rgb(239, 231, 215)" : "rgb(37, 43, 46)",
      );
    }
  });
}

test("Obsidian defaults to Hybrid without Style Settings or theme classes", async ({
  page,
}) => {
  for (const native of ["light", "dark"]) {
    await page.setContent(
      `<html><head><style>${bundle("obsidian")}\n.chrome{background:var(--background-primary)}.paper{background:var(--background-primary)}</style></head><body class="theme-${native}"><div class="chrome">Navigation</div><div class="workspace-leaf-content paper" data-type="markdown">A reading surface</div></body></html>`,
    );
    await expect(page.locator(".paper")).toHaveCSS(
      "background-color",
      expected.hybrid.paper,
    );
    await expect(page.locator(".chrome")).toHaveCSS(
      "background-color",
      expected.hybrid.chrome,
    );
  }
});

test("web adapters leave unopted-in sites alone", async ({ page }) => {
  for (const platform of ["quartz", "portfolio"]) {
    await page.setContent(
      `<html><head><style>${bundle(platform)}</style></head><body><main>A pre-existing site</main></body></html>`,
    );
    const token = await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("--dm-paper"));
    expect(token).toBe("");
  }
});

test("shared system guide explains planned adoption and fits narrow screens", async ({
  page,
}) => {
  await page.goto("/#shared-system");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "One notebook",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const size = await page
      .locator("html")
      .evaluate((el) => ({
        content: el.scrollWidth,
        viewport: el.clientWidth,
      }));
    expect(size.content, `guide overflow at ${width}`).toBeLessThanOrEqual(
      size.viewport + 1,
    );
  }
});
