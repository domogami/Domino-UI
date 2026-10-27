import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page, options: { quiet?: boolean; aspectRatio?: number; fill?: boolean } = {}) {
  await page.goto("/#component/photo-skeleton");
  await page.evaluate(async options => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const { PhotoSkeleton } = await import("/src/lib/photo-skeleton.tsx");
    const host = document.createElement("div");
    host.id = "photo-skeleton-fixture-host";
    host.style.cssText = `position:relative;width:240px;${options.fill ? "height:320px;" : ""}margin:30px auto;background:var(--dm-paper)`;
    document.body.append(host);
    const root = (client.createRoot ?? client.default.createRoot)(host);
    const props = {
      id: "photo-skeleton-fixture",
      className: "consumer-photo-placeholder",
      "data-consumer": "preserved",
      "aria-hidden": false,
      tabIndex: 0,
      quiet: options.quiet ?? false,
      aspectRatio: options.aspectRatio ?? 4 / 3,
      ...(options.fill ? { width: "100%", height: "100%" } : {}),
    };
    (window as any).photoSkeletonFixture = {
      update: (patch: object) => root.render(React.createElement(PhotoSkeleton, { ...props, ...patch })),
      unmount: () => { root.unmount(); host.remove(); },
    };
    root.render(React.createElement(PhotoSkeleton, props));
  }, options);
  await expect(page.locator("#photo-skeleton-fixture")).toBeVisible();
  return page.locator("#photo-skeleton-fixture");
}

test("photo skeleton reserves portrait and landscape space in both themes without shimmer or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#component/photo-skeleton");
  const pending = page.getByRole("region", { name: "Loading photographs" });
  await expect(pending).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toHaveText("Loading photographs…");
  const placeholders = pending.locator(".dm-photo-skeleton");
  await expect(placeholders).toHaveCount(2);
  const ratios: number[] = [];
  const colors: string[] = [];
  for (const placeholder of await placeholders.all()) {
    await expect(placeholder).toHaveAttribute("aria-hidden", "true");
    await expect(placeholder).toHaveAttribute("inert", "");
    await expect(placeholder).toHaveCSS("pointer-events", "none");
    await expect(placeholder).toHaveCSS("background-image", "none");
    await expect(placeholder).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    for (const drawing of await placeholder.locator("svg").all()) await expect(drawing).toHaveAttribute("focusable", "false");
    const shape = await placeholder.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const parent = element.parentElement!.getBoundingClientRect();
      return { ratio: bounds.width / bounds.height, color: getComputedStyle(element).color, fits: bounds.width > 0 && bounds.height > 0 && bounds.left >= parent.left && bounds.right <= parent.right + 1 };
    });
    expect(shape.fits).toBe(true);
    ratios.push(shape.ratio); colors.push(shape.color);
  }
  expect(ratios[0]).toBeCloseTo(4 / 3, 2);
  expect(ratios[1]).toBeCloseTo(3 / 4, 2);
  expect(colors[0]).not.toBe(colors[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("original photo strokes draw with a stagger and spend most of the cycle in finished ink", async ({ page }) => {
  const placeholder = await fixture(page);
  const strokes = placeholder.locator(".dm-photo-skeleton__stroke");
  await expect(strokes).toHaveCount(9);
  const timings = await strokes.evaluateAll(elements => elements.map(element => {
    const animation = element.getAnimations()[0];
    const timing = animation.effect!.getTiming();
    return { name: getComputedStyle(element).animationName, delay: Number(timing.delay), duration: Number(timing.duration) };
  }));
  expect(timings.every(timing => timing.name === "dm-photo-skeleton-draw" && timing.duration >= 10_000)).toBe(true);
  expect(timings[1].delay).toBeGreaterThan(timings[0].delay);
  expect(timings[timings.length - 1].delay).toBeGreaterThan(timings[1].delay);
  await strokes.evaluateAll(elements => elements.forEach(element => {
    const animation = element.getAnimations()[0];
    const timing = animation.effect!.getTiming();
    animation.pause();
    animation.currentTime = Number(timing.delay) + Number(timing.duration) * .6;
  }));
  for (const stroke of await strokes.all()) {
    await expect(stroke).toHaveCSS("stroke-dashoffset", "0px");
    await expect(stroke).toHaveCSS("opacity", "1");
  }
  const geometry = await placeholder.locator("path").evaluateAll(elements => elements.map(element => element.getAttribute("d")));
  await page.evaluate(() => (window as any).photoSkeletonFixture.update({ quiet: true }));
  await expect(strokes.first()).toHaveCSS("animation-name", "none");
  expect(await placeholder.locator("path").evaluateAll(elements => elements.map(element => element.getAttribute("d")))).toEqual(geometry);
});

test("quiet photo skeleton fills an existing frame and remains decorative despite caller focus attributes", async ({ page }) => {
  const placeholder = await fixture(page, { quiet: true, fill: true, aspectRatio: 16 / 9 });
  await expect(placeholder).toHaveClass(/consumer-photo-placeholder/);
  await expect(placeholder).toHaveAttribute("data-consumer", "preserved");
  await expect(placeholder).toHaveAttribute("aria-hidden", "true");
  await expect(placeholder).toHaveAttribute("tabindex", "-1");
  await expect(placeholder).toHaveCSS("width", "240px");
  await expect(placeholder).toHaveCSS("height", "320px");
  for (const stroke of await placeholder.locator(".dm-photo-skeleton__stroke").all()) {
    await expect(stroke).toHaveCSS("animation-name", "none");
    await expect(stroke).toHaveCSS("stroke-dashoffset", "0px");
    await expect(stroke).toHaveCSS("opacity", "1");
  }
  await placeholder.evaluate(element => (element as HTMLElement).focus());
  await expect(placeholder).not.toBeFocused();
  await expect(placeholder.locator("img, button, a, input")).toHaveCount(0);
});

test("reduced motion and invalid ratios produce a complete static drawing at the default ratio", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const placeholder = await fixture(page, { aspectRatio: 0 });
  const size = await placeholder.boundingBox();
  expect(size!.width / size!.height).toBeCloseTo(4 / 3, 2);
  for (const stroke of await placeholder.locator(".dm-photo-skeleton__stroke").all()) {
    await expect(stroke).toHaveCSS("animation-name", "none");
    await expect(stroke).toHaveCSS("stroke-dashoffset", "0px");
    await expect(stroke).toHaveCSS("opacity", "1");
  }
});
