import { expect, test } from "@playwright/test";

test("folded ribbon grows with its label and keeps wrapped text inside the painted face", async ({
  page,
}) => {
  await page.goto("/#component/brand-banner");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator(".playground-canvas .dm-brand-banner"),
  ).toBeVisible();

  const measurements = await page.evaluate(() => {
    const source = document.querySelector(
      ".playground-canvas .dm-brand-banner",
    )!;
    const fixture = document.createElement("div");
    fixture.style.cssText =
      "position:absolute;left:0;top:0;display:grid;justify-items:start";
    document.body.append(fixture);
    const results = [];
    for (const width of [900, 320, 180, 96]) {
      fixture.style.width = `${width}px`;
      for (const text of [
        "Paper, patience & curiosity",
        "A little room to grow, a few good thoughts to keep, and a notebook full of possibilities",
        "AnUnusuallyLongUnbrokenNotebookHeadingThatStillNeedsToFit",
      ]) {
        const banner = source.cloneNode(true) as HTMLElement;
        banner.dataset.animate = "false";
        const label = banner.querySelector(".dm-brand-banner-label")!;
        label.textContent = text;
        fixture.append(banner);
        // The completed SVG geometry is intentionally unchanged: the face's
        // safe rectangle lies at x=57..263 and y=8..52 in its 320 x 80 viewBox.
        const bounds = banner.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(label);
        const lines = Array.from(range.getClientRects()).map((line) => ({
          left: line.left - bounds.left,
          right: line.right - bounds.left,
          top: line.top - bounds.top,
          bottom: line.bottom - bounds.top,
        }));
        results.push({
          width,
          text,
          bannerWidth: bounds.width,
          height: bounds.height,
          lines,
        });
        banner.remove();
      }
    }
    fixture.remove();
    return results;
  });

  for (const result of measurements) {
    expect(
      result.bannerWidth,
      `${result.width}px: ${result.text}`,
    ).toBeLessThanOrEqual(result.width + 1);
    for (const line of result.lines) {
      expect(line.left).toBeGreaterThanOrEqual(
        result.bannerWidth * (57 / 320) + 5,
      );
      expect(line.right).toBeLessThanOrEqual(
        result.bannerWidth * (263 / 320) - 5,
      );
      expect(line.top).toBeGreaterThanOrEqual(result.height * (8 / 80));
      expect(line.bottom).toBeLessThanOrEqual(result.height * (52 / 80));
    }
  }
  const desktop = measurements.find((result) => result.width === 900)!;
  const mobile = measurements.find((result) => result.width === 180)!;
  expect(desktop.lines).toHaveLength(1);
  expect(mobile.lines.length).toBeGreaterThan(1);
  expect(desktop.bannerWidth).toBeGreaterThan(350);
  expect(mobile.height).toBeGreaterThan(desktop.height);
});

test("ribbon reflows after a late font change without a measurement pass", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/#component/brand-banner");
  await expect(
    page.locator(".playground-canvas .dm-brand-banner"),
  ).toBeVisible();
  const result = await page.evaluate(async () => {
    const banner = document.querySelector(
      ".playground-canvas .dm-brand-banner",
    ) as HTMLElement;
    banner.dataset.animate = "false";
    const label = banner.querySelector(".dm-brand-banner-label")!;
    banner.style.fontFamily = "serif";
    await document.fonts.ready;
    banner.style.fontFamily = '"Kalam", cursive';
    await document.fonts.load('700 22px "Kalam"');
    const bounds = banner.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    return {
      width: bounds.width,
      height: bounds.height,
      lines: Array.from(range.getClientRects()).map((line) => ({
        left: line.left - bounds.left,
        right: line.right - bounds.left,
        top: line.top - bounds.top,
        bottom: line.bottom - bounds.top,
      })),
    };
  });
  for (const line of result.lines) {
    expect(line.left).toBeGreaterThanOrEqual(result.width * (57 / 320) + 5);
    expect(line.right).toBeLessThanOrEqual(result.width * (263 / 320) - 5);
    expect(line.top).toBeGreaterThanOrEqual(result.height * (8 / 80));
    expect(line.bottom).toBeLessThanOrEqual(result.height * (52 / 80));
  }
});

test("generic folded and notched banners contain long labels in narrow parents", async ({
  page,
}) => {
  await page.goto("/#component/banner");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator(".playground-canvas .dm-banner").first(),
  ).toBeVisible();
  const measurements = await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.cssText =
      "position:absolute;left:0;top:0;display:grid;justify-items:start";
    document.body.append(fixture);
    const results = [];
    for (const width of [900, 320, 180, 96]) {
      fixture.style.width = `${width}px`;
      for (const variant of ["folded", "notched"]) {
        const source = document.querySelector(
          `.playground-canvas .dm-banner--${variant}`,
        )!;
        for (const text of [
          "Paper, patience & curiosity",
          "A little room to grow, a few good thoughts to keep, and a notebook full of possibilities",
          "AnUnusuallyLongUnbrokenNotebookHeadingThatStillNeedsToFit",
        ]) {
          const banner = source.cloneNode(true) as HTMLElement;
          const face = banner.querySelector(".dm-banner__face")!;
          face.textContent = text;
          fixture.append(banner);
          const bounds = banner.getBoundingClientRect();
          const painted = face.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(face);
          results.push({
            width,
            variant,
            text,
            bannerWidth: bounds.width,
            faceWidth: painted.width,
            faceHeight: painted.height,
            lines: Array.from(range.getClientRects()).map((line) => ({
              left: line.left - painted.left,
              right: line.right - painted.left,
              top: line.top - painted.top,
              bottom: line.bottom - painted.top,
            })),
          });
          banner.remove();
        }
      }
    }
    fixture.remove();
    return results;
  });
  for (const result of measurements) {
    expect(
      result.bannerWidth,
      `${result.variant} at ${result.width}px: ${result.text}`,
    ).toBeLessThanOrEqual(result.width + 1);
    for (const line of result.lines) {
      expect(line.left).toBeGreaterThanOrEqual(12);
      expect(line.right).toBeLessThanOrEqual(result.faceWidth - 12);
      expect(line.top).toBeGreaterThanOrEqual(0);
      expect(line.bottom).toBeLessThanOrEqual(result.faceHeight);
    }
  }
});
