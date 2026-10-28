import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

for (const aspectRatio of [4 / 3, 3 / 4]) {
  test(`a ${aspectRatio > 1 ? "landscape" : "portrait"} print keeps its full width while a delayed image loads under caller button alignment`, async ({ page }) => {
    let releaseImage!: () => void;
    const heldImage = new Promise<void>(resolve => { releaseImage = resolve; });
    let requested = false;
    await page.route("**/__polaroid-loading-fixture.svg", async route => {
      requested = true;
      await heldImage;
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="#0e7c79"/><path d="M0 90L50 42L95 83L130 57L160 90" fill="none" stroke="#efe7d7" stroke-width="4"/></svg>',
      });
    });
    try {
      await page.goto("/#component/polaroid-stack");
      // Consumer apps commonly center their button content. This must not make
      // the grid's implicit column depend on the pending image's intrinsic size.
      await page.addStyleTag({ content: "button { display:inline-flex; align-items:center; justify-content:center; gap:7px; }" });
      await page.evaluate(async aspectRatio => {
        const reactModule = await import("/node_modules/.vite/deps/react.js");
        const React = reactModule.default ?? reactModule;
        const client = await import("/node_modules/.vite/deps/react-dom_client.js");
        const { PolaroidStack } = await import("/src/lib/polaroid-stack.tsx");
        const host = document.createElement("div");
        host.id = "polaroid-loading-fixture";
        host.style.cssText = "position:fixed;top:30px;left:30px;width:257px;background:var(--dm-paper)";
        document.body.append(host);
        const root = (client.createRoot ?? client.default.createRoot)(host);
        root.render(React.createElement(PolaroidStack, {
          photos: [{ id: "delayed-print", src: "/__polaroid-loading-fixture.svg", alt: "A generated preview", caption: "An afternoon" }],
          label: "A delayed generated preview",
          aspectRatio,
        }));
      }, aspectRatio);
      const picture = page.locator("#polaroid-loading-fixture .dm-polaroid-stack__photo > img");
      await expect(picture).toBeVisible();
      await expect.poll(() => requested).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const geometry = () => picture.evaluate(element => {
        const image = element as HTMLImageElement;
        const figure = image.parentElement!;
        const surface = figure.parentElement!;
        return {
          width: image.clientWidth,
          height: image.clientHeight,
          figureWidth: figure.clientWidth,
          surfaceWidth: surface.clientWidth,
          naturalWidth: image.naturalWidth,
          justify: getComputedStyle(surface).justifyContent,
        };
      });
      const before = await geometry();
      expect(before.naturalWidth).toBe(0);
      expect(before.justify).toBe("center");
      // The card border explains the two-pixel difference in client widths.
      expect(Math.abs(before.figureWidth + 2 - before.surfaceWidth)).toBeLessThanOrEqual(1);
      expect(before.width / before.height).toBeCloseTo(aspectRatio, 1);
      releaseImage();
      await expect.poll(() => picture.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 160)).toBe(true);
      await picture.evaluate((image: HTMLImageElement) => image.decode());
      const after = await geometry();
      expect(after.surfaceWidth).toBe(before.surfaceWidth);
      expect(after.figureWidth).toBe(before.figureWidth);
      expect(after.width).toBe(before.width);
      expect(after.height).toBe(before.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { releaseImage(); }
  });
}
