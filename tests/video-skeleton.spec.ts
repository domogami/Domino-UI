import { expect, test, type Locator, type Page } from "@playwright/test";

async function fixture(page: Page, options: { quiet?: boolean; aspectRatio?: number; fill?: boolean } = {}) {
  await page.goto("/#component/video-skeleton");
  await page.evaluate(async options => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const { VideoSkeleton } = await import("/src/lib/video-skeleton.tsx");
    const host = document.createElement("div");
    host.id = "video-skeleton-fixture-host";
    host.style.cssText = `position:fixed;top:30px;left:30px;width:240px;${options.fill ? "height:320px;" : ""}margin:30px auto;background:var(--dm-paper)`;
    document.body.append(host);
    const root = (client.createRoot ?? client.default.createRoot)(host);
    const props = {
      id: "video-skeleton-fixture",
      className: "consumer-video-placeholder",
      "data-consumer": "preserved",
      "aria-hidden": false,
      tabIndex: 0,
      quiet: options.quiet ?? false,
      aspectRatio: options.aspectRatio ?? 16 / 9,
      ...(options.fill ? { width: "100%", height: "100%" } : {}),
    };
    (window as any).videoSkeletonFixture = {
      update: (patch: object) => root.render(React.createElement(VideoSkeleton, { ...props, ...patch })),
      unmount: () => { root.unmount(); host.remove(); },
    };
    root.render(React.createElement(VideoSkeleton, props));
  }, options);
  const placeholder = page.locator("#video-skeleton-fixture");
  await expect(placeholder).toBeVisible();
  return placeholder;
}

async function expectStatic(placeholder: Locator) {
  await expect.poll(() => placeholder.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  const strokes = placeholder.locator(".dm-video-skeleton__stroke");
  expect(await strokes.count()).toBeGreaterThan(3);
  for (const stroke of await strokes.all()) {
    await expect(stroke).toHaveCSS("animation-name", "none");
    await expect(stroke).toHaveCSS("stroke-dashoffset", "0px");
    await expect(stroke).toHaveCSS("opacity", "1");
  }
}

test.use({ reducedMotion: "no-preference" });

test.describe("video skeleton", () => {

  test("reserves landscape and portrait frames in both themes at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/#component/video-skeleton");
    const pending = page.getByRole("region", { name: "Loading videos" });
    await expect(pending).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("status")).toHaveText("Loading videos…");
    const placeholders = pending.locator(".dm-video-skeleton");
    await expect(placeholders).toHaveCount(2);
    const colors: string[] = [];
    for (const [index, placeholder] of (await placeholders.all()).entries()) {
      await expect(placeholder).toHaveAttribute("aria-hidden", "true");
      await expect(placeholder).toHaveAttribute("inert", "");
      await expect(placeholder).toHaveCSS("pointer-events", "none");
      await expect(placeholder).toHaveCSS("background-image", "none");
      await expect(placeholder).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      for (const drawing of await placeholder.locator("svg").all()) await expect(drawing).toHaveAttribute("focusable", "false");
      await expect(placeholder.locator("img, video, audio, button, a, input, [role=button]")).toHaveCount(0);
      const shape = await placeholder.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const parent = element.parentElement!.getBoundingClientRect();
        return { ratio: bounds.width / bounds.height, color: getComputedStyle(element).color, fits: bounds.width > 0 && bounds.height > 0 && bounds.left >= parent.left && bounds.right <= parent.right + 1 };
      });
      expect(shape.fits).toBe(true);
      expect(shape.ratio).toBeCloseTo(index ? 9 / 16 : 16 / 9, 2);
      colors.push(shape.color);
    }
    expect(colors[0]).not.toBe(colors[1]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test("video marks draw, hold in finished ink, and never move the reserved frame", async ({ page }) => {
    const placeholder = await fixture(page);
    const before = await placeholder.boundingBox();
    const strokes = placeholder.locator(".dm-video-skeleton__stroke");
    expect(await strokes.count()).toBeGreaterThan(3);
    const timings = await strokes.evaluateAll(elements => elements.map(element => {
      const animation = element.getAnimations()[0];
      const timing = animation.effect!.getTiming();
      return { name: getComputedStyle(element).animationName, delay: Number(timing.delay), duration: Number(timing.duration) };
    }));
    expect(timings.every(timing => timing.name === "dm-video-skeleton-draw" && timing.duration >= 10_000)).toBe(true);
    expect(timings.some(timing => timing.delay > timings[0].delay)).toBe(true);
    await strokes.first().evaluate(element => {
      const animation = element.getAnimations()[0];
      const timing = animation.effect!.getTiming();
      animation.pause();
      animation.currentTime = Number(timing.delay) + Number(timing.duration) * .1;
    });
    const partiallyDrawn = await strokes.first().evaluate(element => parseFloat(getComputedStyle(element).strokeDashoffset));
    expect(partiallyDrawn).toBeGreaterThan(0);
    expect(partiallyDrawn).toBeLessThan(1);
    // Pause actual browser animations at their completed hold, rather than
    // waiting through an artificial loading delay.
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
    expect(await placeholder.boundingBox()).toEqual(before);
    const play = placeholder.locator(".dm-video-skeleton__stroke--play");
    await expect(play).toHaveCount(1);
    expect(await play.getAttribute("d")).toBeTruthy();
    expect(await play.evaluate(element => (element as SVGPathElement).getTotalLength())).toBeGreaterThan(20);
    // A video cue is artwork, never a fake pending playback control.
    await expect(placeholder.locator("button, [role=button], video")).toHaveCount(0);
    const geometry = await placeholder.locator("path").evaluateAll(elements => elements.map(element => element.getAttribute("d")));
    await page.evaluate(() => (window as any).videoSkeletonFixture.update({ quiet: true }));
    await expectStatic(placeholder);
    expect(await placeholder.locator("path").evaluateAll(elements => elements.map(element => element.getAttribute("d")))).toEqual(geometry);
    expect(await placeholder.boundingBox()).toEqual(before);
  });

  test("quiet drawing fills a supplied frame and cannot enter the focus order", async ({ page }) => {
    const placeholder = await fixture(page, { quiet: true, fill: true });
    await expect(placeholder).toHaveClass(/consumer-video-placeholder/);
    await expect(placeholder).toHaveAttribute("data-consumer", "preserved");
    await expect(placeholder).toHaveAttribute("aria-hidden", "true");
    await expect(placeholder).toHaveAttribute("tabindex", "-1");
    await expect(placeholder).toHaveAttribute("inert", "");
    await expect(placeholder).toHaveCSS("width", "240px");
    await expect(placeholder).toHaveCSS("height", "320px");
    await expectStatic(placeholder);
    await placeholder.evaluate(element => (element as HTMLElement).focus());
    await expect(placeholder).not.toBeFocused();
    await expect(placeholder.locator("img, video, audio, button, a, input")).toHaveCount(0);
  });

  test("reduced motion has complete static ink and invalid geometry uses the default video ratio", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const placeholder = await fixture(page, { aspectRatio: 0 });
    const size = await placeholder.boundingBox();
    expect(size!.width / size!.height).toBeCloseTo(16 / 9, 2);
    await expectStatic(placeholder);
    await page.evaluate(() => (window as any).videoSkeletonFixture.update({ aspectRatio: 9 / 16 }));
    await expect.poll(async () => {
      const bounds = await placeholder.boundingBox();
      return bounds!.width / bounds!.height;
    }).toBeCloseTo(9 / 16, 2);
    await expectStatic(placeholder);
  });
});
