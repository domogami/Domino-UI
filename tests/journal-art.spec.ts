import { expect, test, type Locator } from "@playwright/test";

async function finishedInk(art: Locator) {
  await art.locator(".dm-journal-art-line").evaluateAll((paths) => {
    paths.forEach((path) =>
      path.getAnimations().forEach((animation) => {
        animation.finish();
      }),
    );
  });
}

test("three ribbon faces keep real wrapped labels inside their painted paper", async ({
  page,
}) => {
  await page.goto("/#component/triple-banner");
  const banner = page.locator(".playground-canvas .dm-triple-banner");
  await expect(banner).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(banner.locator(".dm-triple-banner__band")).toHaveCount(3);
  await expect(banner.locator(".dm-triple-banner__fold")).toHaveCount(2);
  await expect(banner.locator("svg text")).toHaveCount(0);
  const measurements = await banner.evaluate((source) => {
    const fixture = document.createElement("div");
    fixture.style.cssText =
      "position:absolute;left:0;top:0;display:grid;justify-items:start";
    document.body.append(fixture);
    const results = [];
    for (const width of [900, 320, 180, 96]) {
      fixture.style.width = `${width}px`;
      for (const copy of [
        "Paper & patience",
        "A notebook full of small thoughts and a little room to grow",
        "AnUnusuallyLongUnbrokenNotebookHeadingThatStillNeedsToFit",
      ]) {
        const clone = source.cloneNode(true) as HTMLElement;
        clone.dataset.animate = "false";
        // Mixed intrinsic heights catch the WebKit case where short neighboring
        // bands kept a fixed minimum despite wrapping their labels onto two lines.
        clone.querySelector(".dm-triple-banner__label")!.textContent = copy;
        fixture.append(clone);
        for (const band of clone.querySelectorAll(".dm-triple-banner__band")) {
          const rect = band.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(
            band.querySelector(".dm-triple-banner__label")!,
          );
          results.push({
            width,
            copy,
            bannerWidth: clone.getBoundingClientRect().width,
            bandHeight: rect.height,
            lines: Array.from(range.getClientRects()).map((line) => ({
              left: line.left - rect.left,
              right: line.right - rect.left,
              top: line.top - rect.top,
              bottom: line.bottom - rect.top,
            })),
          });
        }
        clone.remove();
      }
    }
    fixture.remove();
    return results;
  });
  for (const result of measurements) {
    expect(
      result.bannerWidth,
      `${result.width}px: ${result.copy}`,
    ).toBeLessThanOrEqual(result.width + 1);
    for (const line of result.lines) {
      expect(line.left).toBeGreaterThan((result.bannerWidth * 63) / 600);
      expect(line.right).toBeLessThan((result.bannerWidth * 537) / 600);
      expect(line.top).toBeGreaterThan(0);
      expect(line.bottom).toBeLessThan(result.bandHeight);
    }
  }
  const short = measurements.find((item) => item.width === 900)!;
  const wrapped = measurements.find(
    (item) => item.width === 180 && item.copy === short.copy,
  )!;
  expect(wrapped.bandHeight).toBeGreaterThan(short.bandHeight);
  expect(wrapped.lines.length).toBeGreaterThan(short.lines.length);
});

test("journal art retains fine ink, distinct folds, and shared theme roles", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const banner = page.locator(".sketchbook-journal .dm-triple-banner");
  const bookmarks = page.locator(".sketchbook-journal .dm-bookmark-drawing");
  await expect(banner).toHaveCount(1);
  await expect(bookmarks).toHaveCount(2);
  const colors = [];
  for (const theme of ["Hybrid", "Light", "Dark"]) {
    await page
      .locator(".topbar")
      .getByRole("button", { name: `${theme} theme`, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.toLowerCase(),
    );
    const styles = await banner.evaluate((element) => ({
      label: getComputedStyle(
        element.querySelector(".dm-triple-banner__label")!,
      ).color,
      face: getComputedStyle(element.querySelector(".dm-triple-banner__face")!)
        .fill,
      reverse: getComputedStyle(
        element.querySelector(".dm-triple-banner__fold")!,
      ).fill,
    }));
    colors.push(styles);
    expect(styles.face).not.toEqual(styles.reverse);
    if (theme === "Hybrid") expect(styles.label).toBe("rgb(14, 124, 121)");
    for (const drawing of [banner, ...(await bookmarks.all())]) {
      const strokes = await drawing
        .locator(".dm-journal-art-line")
        .evaluateAll((paths) =>
          paths.map((path) => {
            const css = getComputedStyle(path);
            return {
              width: Number.parseFloat(css.strokeWidth),
              cap: css.strokeLinecap,
              vector: css.vectorEffect,
              stroke: css.stroke,
            };
          }),
        );
      expect(strokes.length).toBeGreaterThan(3);
      expect(
        strokes.every(
          (stroke) =>
            stroke.width > 0 &&
            stroke.width <= 1.2 &&
            stroke.cap === "round" &&
            stroke.vector === "non-scaling-stroke" &&
            stroke.stroke !== "none",
        ),
      ).toBe(true);
    }
  }
  expect(colors[0].face).not.toEqual(colors[2].face);
});

for (const route of ["triple-banner", "bookmark-drawing"]) {
  test(`${route} redraws on click, Enter and Space without replacing its button`, async ({
    page,
  }) => {
    await page.goto(`/#component/${route}`);
    const art = page
      .locator(
        route === "triple-banner"
          ? ".playground-canvas .dm-triple-banner"
          : ".playground-canvas .dm-bookmark-drawing",
      )
      .first();
    const button = page
      .locator(".playground-canvas button.dm-sketch-replay")
      .first();
    await expect(button).toBeEnabled();
    // Leave a generous sampling window when this suite shares a busy build host.
    await art.evaluate((element) =>
      (element as HTMLElement).style.setProperty(
        "--dm-sketch-duration",
        "6000ms",
      ),
    );
    const originalButton = await button.elementHandle();
    for (const key of ["click", "Enter", "Space"]) {
      await finishedInk(art);
      const before = await art.getAttribute("data-replay");
      if (key === "click") await button.click();
      else await button.press(key);
      await expect(art).not.toHaveAttribute("data-replay", before!);
      await expect(button).toBeFocused();
      expect(
        await originalButton!.evaluate(
          (element) => element === document.activeElement,
        ),
      ).toBe(true);
      const first = art.locator(".dm-journal-art-line").first();
      await expect(first).toHaveCSS("animation-name", "dm-journal-art-draw");
      const elapsed = await first.evaluate((element) =>
        Number(element.getAnimations()[0]?.currentTime ?? 0),
      );
      await expect
        .poll(() =>
          first.evaluate((element) =>
            Number(element.getAnimations()[0]?.currentTime ?? 0),
          ),
        )
        .toBeGreaterThan(elapsed + 70);
    }
  });

  test(`${route} stays complete in quiet and reduced motion, including mobile`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`/#component/${route}`);
    const art = page.locator(
      route === "triple-banner"
        ? ".playground-canvas .dm-triple-banner"
        : ".playground-canvas .dm-bookmark-drawing",
    );
    const quiet = page.getByRole("switch", {
      name: "Quiet motion",
      exact: true,
    });
    await expect(art.first()).toBeVisible();
    await quiet.locator("..").click();
    await expect(quiet).toBeChecked();
    await expect(art.first()).toHaveAttribute("data-quiet", "true");
    await quiet.locator("..").click();
    await expect(quiet).not.toBeChecked();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const drawing of await art.all()) {
      await expect(drawing).toHaveAttribute("data-animate", "false");
      expect(
        await drawing.locator(".dm-journal-art-line").evaluateAll((paths) =>
          paths.every((path) => {
            const css = getComputedStyle(path);
            return (
              css.animationName === "none" &&
              Number.parseFloat(css.strokeDashoffset) === 0
            );
          }),
        ),
      ).toBe(true);
    }
    const buttons = page.locator(".playground-canvas button.dm-sketch-replay");
    for (const button of await buttons.all())
      await expect(button).toBeDisabled();
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".playground-canvas")
      .evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page
      .locator(".playground-canvas")
      .screenshot({ path: info.outputPath(`${route}-mobile.png`) });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  });
}
