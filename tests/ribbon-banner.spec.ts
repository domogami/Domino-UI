import { expect, test, type Locator, type Page } from "@playwright/test";

async function mountRibbon(page: Page, options: Record<string, unknown> = {}) {
  await page.goto("/#component/triple-banner");
  await page.evaluate(async (options) => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const { RibbonBanner } = await import("/src/lib/journal-art.tsx");
    const host = document.createElement("section");
    host.id = "ribbon-fixture-host";
    host.style.cssText =
      "width:calc(100% - 32px);max-width:1100px;margin:32px auto;background:var(--dm-paper);display:grid;justify-items:start";
    document.body.append(host);
    const state: any = {};
    (window as any).ribbonFixture = state;
    function Fixture() {
      const [props, setProps] = React.useState({
        lines: ["Paper", "A few good pieces", "Curiosity"],
        animate: true,
        replayOnClick: true,
        label: "three notebook thoughts",
        ...options,
      });
      state.update = (next: any) =>
        setProps((current: any) => ({ ...current, ...next }));
      return React.createElement(RibbonBanner, {
        ...props,
        "data-testid": "ribbon-fixture",
      });
    }
    const root = (client.createRoot ?? client.default.createRoot)(host);
    state.unmount = () => root.unmount();
    root.render(React.createElement(Fixture));
  }, options);
  const ribbon = page.getByTestId("ribbon-fixture");
  await expect(ribbon).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await ribbon.scrollIntoViewIfNeeded();
  return ribbon;
}

async function seek(ribbon: Locator, time: number) {
  return ribbon.evaluate((element, time) => {
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = time;
    });
    const css = (selector: string) =>
      getComputedStyle(element.querySelector(selector)!);
    const outline = css(".dm-triple-banner__outline");
    const fill = css(".dm-triple-banner__face");
    const label = css(".dm-triple-banner__label");
    const labels = [
      ...element.querySelectorAll(".dm-triple-banner__label"),
    ].map((node) => {
      const style = getComputedStyle(node);
      const inset = style.clipPath
        .match(/^inset\((.*)\)$/)?.[1]
        .match(/calc\([^)]*\)|[^\s]+/g);
      const rightToken = (inset?.[1] ?? inset?.[0] ?? "0px").replace(
        /\s+/g,
        "",
      );
      const width = node.getBoundingClientRect().width;
      const right = [
        ...rightToken.matchAll(/([+-]?(?:\d*\.)?\d+)(%|px)/g),
      ].reduce(
        (sum, term) =>
          sum + Number(term[1]) * (term[2] === "%" ? 1 : 100 / width),
        0,
      );
      const transform = new DOMMatrixReadOnly(
        style.transform === "none" ? undefined : style.transform,
      );
      return {
        right,
        x: transform.e,
        y: transform.f,
        top: node.getBoundingClientRect().top,
      };
    });
    return {
      outline: Number.parseFloat(outline.strokeDashoffset),
      fill: Number.parseFloat(fill.opacity),
      label: Number.parseFloat(label.opacity),
      text: element.textContent,
      labels,
    };
  }, time);
}

test("ribbon fills completely before lettering writes left to right in place", async ({
  page,
}) => {
  const ribbon = await mountRibbon(page);
  await expect(ribbon.locator(".dm-triple-banner__crease")).toHaveCount(0);
  await expect(ribbon.locator(".dm-triple-banner__tail")).toHaveCount(2);
  const choreography = await ribbon.evaluate((element) => {
    const animations = element
      .getAnimations({ subtree: true })
      .filter(
        (animation): animation is CSSAnimation =>
          animation instanceof CSSAnimation,
      );
    const fills = animations.filter(
      (animation) => animation.animationName === "dm-ribbon-fill",
    );
    const labels = animations.filter(
      (animation) => animation.animationName === "dm-ribbon-label",
    );
    return {
      fillEnd: Math.max(
        ...fills.map((animation) =>
          Number(animation.effect!.getComputedTiming().endTime),
        ),
      ),
      labelStart: Math.min(
        ...labels.map((animation) =>
          Number(animation.effect!.getTiming().delay),
        ),
      ),
      labelDuration: Number(labels[0].effect!.getTiming().duration),
      labelEnd: Math.max(
        ...labels.map((animation) =>
          Number(animation.effect!.getComputedTiming().endTime),
        ),
      ),
    };
  });
  expect(choreography.labelStart).toBeGreaterThanOrEqual(
    choreography.fillEnd - 0.01,
  );
  const outline = await seek(ribbon, 400);
  expect(outline.outline).toBeGreaterThan(0);
  expect(outline.outline).toBeLessThan(1);
  expect(outline.fill).toBe(0);
  expect(outline.labels.every((label) => label.right === 100)).toBe(true);
  expect(outline.text).toContain("A few good pieces");
  const filling = await seek(ribbon, 1300);
  expect(filling.outline).toBe(0);
  expect(filling.fill).toBeGreaterThan(0);
  expect(filling.fill).toBeLessThan(1);
  expect(filling.labels.every((label) => label.right === 100)).toBe(true);
  const lettering = await seek(
    ribbon,
    choreography.labelStart + choreography.labelDuration / 2,
  );
  expect(lettering.fill).toBe(1);
  expect(lettering.labels[0].right).toBeGreaterThan(0);
  expect(lettering.labels[0].right).toBeLessThan(100);
  const finished = await seek(ribbon, choreography.labelEnd + 10);
  expect(finished).toMatchObject({ outline: 0, fill: 1, label: 1 });
  expect(finished.labels.every((label) => label.right <= 0)).toBe(true);
  for (const snapshot of [outline, filling, lettering, finished]) {
    snapshot.labels.forEach((label, index) => {
      expect(label.x).toBe(0);
      expect(label.y).toBe(0);
      expect(label.top).toBeCloseTo(outline.labels[index].top, 3);
    });
  }
  expect(
    await ribbon.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .every((animation) =>
          Number.isFinite(animation.effect!.getComputedTiming().endTime),
        ),
    ),
  ).toBe(true);
});

test("the largest label in any row sizes every face and all wrapped ink stays clear", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 1000 });
  const ribbon = await mountRibbon(page, { animate: false });
  const initialWidth = await ribbon.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  const widths: number[] = [];
  for (const position of [0, 1, 2]) {
    await page.evaluate((position) => {
      const lines = ["Paper", "Paper", "Paper"];
      lines[position] = "A few very good pieces worth keeping";
      (window as any).ribbonFixture.update({ lines });
    }, position);
    await expect(
      ribbon.locator(".dm-triple-banner__label").nth(position),
    ).toHaveText("A few very good pieces worth keeping");
    widths.push(
      await ribbon.evaluate((element) => element.getBoundingClientRect().width),
    );
  }
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  expect(widths[0]).toBeGreaterThan(initialWidth);
  expect(
    await ribbon
      .locator(".dm-triple-banner__label")
      .last()
      .evaluate((label) => {
        const range = document.createRange();
        range.selectNodeContents(label);
        return range.getClientRects().length;
      }),
  ).toBe(1);
  await ribbon
    .locator(".dm-triple-banner__label")
    .last()
    .evaluate((label) => {
      (label as HTMLElement).style.fontSize = "40px";
      (label as HTMLElement).style.lineHeight = "1.35";
    });
  await expect
    .poll(() =>
      ribbon.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(widths[0]);
  await ribbon
    .locator(".dm-triple-banner__label")
    .last()
    .evaluate((label) => {
      (label as HTMLElement).style.removeProperty("font-size");
      (label as HTMLElement).style.removeProperty("line-height");
    });
  for (const width of [900, 320, 180, 96]) {
    await page
      .locator("#ribbon-fixture-host")
      .evaluate(
        (host, width) => ((host as HTMLElement).style.width = `${width}px`),
        width,
      );
    await page.evaluate(() =>
      (window as any).ribbonFixture.update({
        lines: [
          "gypqj: small thoughts",
          "A notebook full of unusually long thoughts and room to grow",
          "AnUnusuallyLongUnbrokenNotebookHeadingThatStillNeedsToFit",
        ],
      }),
    );
    await expect(ribbon.locator(".dm-triple-banner__label").first()).toHaveText(
      "gypqj: small thoughts",
    );
    const geometry = await ribbon.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        bands: [...element.querySelectorAll(".dm-triple-banner__band")].map(
          (band) => {
            const bounds = band.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(
              band.querySelector(".dm-triple-banner__label")!,
            );
            return {
              width: bounds.width,
              height: bounds.height,
              lines: [...range.getClientRects()].map((line) => ({
                left: line.left - bounds.left,
                right: line.right - bounds.left,
                top: line.top - bounds.top,
                bottom: line.bottom - bounds.top,
              })),
            };
          },
        ),
        echoes: element.querySelectorAll(
          ".dm-triple-banner__paper .dm-journal-art-echo",
        ).length,
        reverseClipped: [
          ...element.querySelectorAll(".dm-triple-banner__reverse"),
        ].every((reverse) => getComputedStyle(reverse).overflow === "hidden"),
        inkCrossings: [
          ...element.querySelectorAll<SVGPathElement>(
            ".dm-triple-banner__paper .dm-triple-banner__outline",
          ),
        ].flatMap((path) => {
          const band = path.closest(".dm-triple-banner__band")!;
          const range = document.createRange();
          range.selectNodeContents(
            band.querySelector(".dm-triple-banner__label")!,
          );
          const lines = [...range.getClientRects()];
          const matrix = path.getScreenCTM()!;
          const length = path.getTotalLength();
          const crossings = [];
          for (let step = 0; step <= 150; step++) {
            const point = path
              .getPointAtLength((length * step) / 150)
              .matrixTransform(matrix);
            if (
              lines.some(
                (line) =>
                  point.x > line.left - 3 &&
                  point.x < line.right + 3 &&
                  point.y > line.top - 3 &&
                  point.y < line.bottom + 3,
              )
            )
              crossings.push({ x: point.x, y: point.y });
          }
          return crossings;
        }),
      };
    });
    expect(geometry.width).toBeLessThanOrEqual(width + 1);
    expect(geometry.echoes).toBe(0);
    expect(geometry.reverseClipped).toBe(true);
    expect(geometry.inkCrossings).toEqual([]);
    for (const band of geometry.bands) {
      expect(band.width).toBeCloseTo(geometry.width, 0);
      for (const line of band.lines) {
        expect(line.left).toBeGreaterThan((band.width * 63) / 600);
        expect(line.right).toBeLessThan((band.width * 537) / 600);
        expect(line.top, JSON.stringify({ width, band })).toBeGreaterThan(0);
        expect(line.bottom).toBeLessThan(band.height);
      }
    }
  }
});

test("rapid replay preserves native focus and label identity while rewinding owned clocks", async ({
  page,
}) => {
  const ribbon = await mountRibbon(page);
  const button = ribbon.getByRole("button", {
    name: "Replay three notebook thoughts",
    exact: true,
  });
  const original = await ribbon
    .locator(".dm-triple-banner__label")
    .first()
    .elementHandle();
  await expect(button).toHaveAccessibleDescription(
    "Paper A few good pieces Curiosity",
  );
  for (const action of ["click", "Enter", "Space"]) {
    await seek(ribbon, 2100);
    if (action === "click") await button.click();
    else await button.press(action);
    await expect(button).toBeFocused();
    expect(await original!.evaluate((element) => element.isConnected)).toBe(
      true,
    );
    const reset = await seek(ribbon, 20);
    expect(reset.fill).toBe(0);
    expect(reset.outline).toBeGreaterThan(0.5);
    expect(reset.labels.every((label) => label.right === 100)).toBe(true);
  }
  await page.evaluate(() =>
    (window as any).ribbonFixture.update({ replayKey: 2 }),
  );
  await expect
    .poll(() =>
      ribbon.evaluate((element) =>
        Number(
          element
            .querySelector(".dm-triple-banner__outline")!
            .getAnimations()[0].currentTime,
        ),
      ),
    )
    .toBeLessThan(500);
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
});

test("custom colors and playback speed compose with native attributes", async ({
  page,
}) => {
  const ribbon = await mountRibbon(page, {
    colors: {
      face: "#fff1d6",
      reverse: "#cc8899",
      ink: "#164c47",
      outline: "#332c37",
    },
    speed: 2,
    title: "A ribbon in my own inks",
  });
  await expect(ribbon).toHaveAttribute("title", "A ribbon in my own inks");
  const style = await ribbon.evaluate((element) => {
    const css = (selector: string) =>
      getComputedStyle(element.querySelector(selector)!);
    return {
      face: css(".dm-triple-banner__face").fill,
      reverse: css(".dm-triple-banner__fold").fill,
      ink: css(".dm-triple-banner__label").color,
      outline: css(".dm-triple-banner__outline").stroke,
      duration: css(".dm-triple-banner__outline").animationDuration,
    };
  });
  expect(style).toEqual({
    face: "rgb(255, 241, 214)",
    reverse: "rgb(204, 136, 153)",
    ink: "rgb(22, 76, 71)",
    outline: "rgb(51, 44, 55)",
    duration: "0.4s",
  });
  expect(await seek(ribbon, 1100)).toMatchObject({
    outline: 0,
    fill: 1,
    label: 1,
  });
});

test("quiet and reduced motion finish all three phases without hiding words", async ({
  page,
}) => {
  const ribbon = await mountRibbon(page, { quiet: true });
  for (const reduced of [false, true]) {
    if (reduced) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() =>
        (window as any).ribbonFixture.update({ quiet: false }),
      );
    }
    await expect(ribbon).toHaveAttribute("data-animate", "false");
    await expect(ribbon.getByRole("button")).toBeDisabled();
    expect(
      await ribbon.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    expect(await seek(ribbon, 0)).toMatchObject({
      outline: 0,
      fill: 1,
      label: 1,
    });
    await expect(ribbon).toContainText("A few good pieces");
    expect(
      (await seek(ribbon, 0)).labels.every((label) => label.right <= 0),
    ).toBe(true);
  }
});
