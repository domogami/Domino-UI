import { expect, test } from "@playwright/test";

test("handwritten skeletons reserve content space and share one readable status", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#component/skeleton");

  const loading = page.getByRole("region", {
    name: "Loading a journal entry",
  });
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toHaveText("A page taking shape…");
  const ring = loading.locator(".dm-skeleton--circle");
  await expect(ring).toHaveClass(/dm-skeleton--handwritten/);
  await expect(ring).toHaveCSS("width", "42px");
  await expect(ring).toHaveCSS("height", "42px");

  const sketches = loading.locator(".dm-skeleton--handwritten");
  for (const sketch of await sketches.all()) {
    await expect(sketch).toHaveAttribute("aria-hidden", "true");
    await expect(sketch.locator("svg")).toHaveAttribute("focusable", "false");
    await expect(sketch).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const fits = await sketch.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement!.getBoundingClientRect();
      return (
        rect.width > 0 && rect.height > 0 && rect.width <= parent.width + 1
      );
    });
    expect(fits).toBe(true);
  }
  await expect(
    sketches.first().locator(".dm-skeleton__ink path").first(),
  ).toHaveCSS("animation-name", "dm-skeleton-write");
  await expect(page.locator(".dm-skeleton--block")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("reduced motion shows finished ink and a static block placeholder", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/skeleton");
  const paths = page.locator(".dm-skeleton__ink path");
  expect(await paths.count()).toBeGreaterThan(0);
  for (const path of await paths.all()) {
    await expect(path).toHaveCSS("animation-name", "none");
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
    await expect(path).toHaveCSS("opacity", "1");
  }
  await expect(page.locator(".dm-skeleton--block")).toHaveCSS(
    "animation-name",
    "none",
  );
});
