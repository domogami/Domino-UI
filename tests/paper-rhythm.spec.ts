import { expect, test, type Locator, type Page } from "@playwright/test";

async function mountPaper(
  page: Page,
  options: { padding?: string; ruleAlign?: string; mixed?: boolean } = {},
) {
  await page.goto("/#component/paper");
  await page.evaluate(async (options) => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { Paper } = await import("/src/lib/paper.tsx");
    const target = window as any;
    target.paperFixture?.unmount();
    document.querySelector("#paper-rhythm-host")?.remove();
    const host = document.createElement("section");
    host.id = "paper-rhythm-host";
    host.style.cssText =
      "width:calc(100% - 32px);max-width:800px;margin:40px auto;background:var(--dm-paper)";
    document.body.append(host);
    const state: any = {};
    target.paperFixture = state;
    const e = React.createElement;
    function Fixture() {
      const [padding, setPadding] = React.useState(options.padding ?? "md");
      const [ruleAlign, setRuleAlign] = React.useState(
        options.ruleAlign ?? "between",
      );
      state.setPadding = setPadding;
      state.setRuleAlign = setRuleAlign;
      return e(
        Paper,
        {
          pattern: "lined",
          padding,
          ruleAlign,
          id: "paper-rhythm-fixture",
          "data-testid": "paper-rhythm-fixture",
          "aria-label": "A ruled notebook page",
        },
        e(
          "h3",
          null,
          "A place to begin: typography, curiosity & growing ideas",
        ),
        e(
          "p",
          null,
          "One thought, then another. A steady rhythm gives the words a little room to breathe. Descenders—gypqj—must always stay clear of a rule.",
        ),
        e(
          "p",
          null,
          "A wrapped paragraph keeps its own rhythm at every width. ",
          e("a", { href: "#paper-rhythm-host" }, "Keep this thought nearby"),
          ". More room for typography and quietly growing ideas.",
        ),
        e(
          "ul",
          null,
          e("li", null, "Gather patient ideas and typography."),
          e(
            "li",
            null,
            "Keep long list items readable when they wrap onto another row, including gypqj descenders.",
          ),
        ),
        e(
          "p",
          {
            style: {
              fontFamily: '"Kalam", cursive',
              fontWeight: 700,
              fontSize: "22px",
            },
          },
          "A handwritten page: growing, jumping, quietly keeping ideas.",
        ),
        e(
          "p",
          { style: { fontFamily: '"Caveat", cursive', fontSize: "25px" } },
          "A few good pieces, gathered patiently. gypqj",
        ),
        options.mixed &&
          e(
            "h2",
            { "data-large-heading": true, style: { fontSize: "64px" } },
            "Growing typography, a much larger thought",
          ),
        options.mixed && e("button", { type: "button" }, "Keep a good idea"),
        options.mixed &&
          e(
            "figure",
            null,
            e(
              "svg",
              {
                viewBox: "0 0 100 35",
                width: "100%",
                height: 90,
                "aria-label": "A little ink sketch",
              },
              e("path", {
                d: "M2 30 Q25 2 50 20 T98 5",
                fill: "none",
                stroke: "currentColor",
              }),
            ),
            e("figcaption", null, "A sketch needs its own clear space."),
          ),
      );
    }
    const root = createRoot(host);
    state.unmount = () => root.unmount();
    root.render(e(Fixture));
  }, options);
  const paper = page.getByTestId("paper-rhythm-fixture");
  await expect(paper).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
  await paper.scrollIntoViewIfNeeded();
  await ready(paper);
  return paper;
}

async function ready(paper: Locator) {
  await paper.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(paper.locator(".dm-paper__rules")).toHaveAttribute(
    "data-rules-ready",
    "true",
  );
}

/** Compare painted rule coordinates to real font ink, rather than CSS line boxes. */
async function inkAudit(paper: Locator) {
  return paper.evaluate((root) => {
    const svg = root.querySelector<SVGSVGElement>(".dm-paper__rules")!;
    const ctm = svg.getScreenCTM()!;
    const rows = (svg.dataset.ruleRows ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const ink: { top: number; bottom: number; text: string }[] = [];
    const walker = document.createTreeWalker(
      root.querySelector(".dm-paper__content")!,
      NodeFilter.SHOW_TEXT,
    );
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const element = node.parentElement!;
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") continue;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = node.textContent ?? "";
      for (let index = 0; index < text.length; index++) {
        if (/\s/.test(text[index])) continue;
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const metrics = ctx.measureText(text[index]);
        const scale =
          rect.height /
          (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent);
        const baseline = rect.bottom - metrics.fontBoundingBoxDescent * scale;
        ink.push({
          top: baseline - metrics.actualBoundingBoxAscent * scale,
          bottom: baseline + metrics.actualBoundingBoxDescent * scale,
          text: text[index],
        });
      }
    }
    const ruleYs = rows.map((y) => {
      const point = svg.createSVGPoint();
      point.y = y;
      return point.matrixTransform(ctm).y;
    });
    const clearance = 3 * Math.hypot(ctm.c, ctm.d);
    const collisions = ruleYs.flatMap((y) =>
      ink
        .filter(
          (glyph) =>
            y > glyph.top - clearance + 0.6 &&
            y < glyph.bottom + clearance - 0.6,
        )
        .map((glyph) => ({ y, ...glyph })),
    );
    const obstacles = Array.from(
      root.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, figure, img",
      ),
    ).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return ruleYs
        .filter(
          (y) =>
            y > rect.top - clearance + 0.6 && y < rect.bottom + clearance - 0.6,
        )
        .map((y) => ({
          y,
          element: element.tagName,
          top: rect.top,
          bottom: rect.bottom,
        }));
    });
    return {
      rows,
      pitch: Number(svg.dataset.rulePitch),
      collisions,
      obstacles,
      inkCount: ink.length,
    };
  });
}

async function assertSafe(paper: Locator) {
  await ready(paper);
  const result = await inkAudit(paper);
  expect(result.inkCount).toBeGreaterThan(100);
  expect(
    result.rows.length,
    "The paper must retain visible ruling between text rows",
  ).toBeGreaterThan(2);
  expect(result.pitch).toBe(32);
  expect(
    result.collisions,
    "Rules must leave at least 3px around actual glyph ink",
  ).toEqual([]);
  expect(
    result.obstacles,
    "Rules must omit rows behind controls and figures",
  ).toEqual([]);
  for (let index = 1; index < result.rows.length; index++)
    expect(
      Math.abs(
        (result.rows[index] - result.rows[index - 1]) / result.pitch -
          Math.round(
            (result.rows[index] - result.rows[index - 1]) / result.pitch,
          ),
      ),
    ).toBeLessThan(0.02);
}

for (const width of [320, 390, 1100]) {
  test(`ruled paper clears loaded heading, body, list and handwritten glyphs at ${width}px across themes and padding`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const paper = await mountPaper(page);
    for (const theme of ["light", "dark", "hybrid"]) {
      await page.evaluate(
        (theme) => (document.documentElement.dataset.theme = theme),
        theme,
      );
      for (const padding of ["sm", "md", "lg"]) {
        await page.evaluate(
          (padding) => (window as any).paperFixture.setPadding(padding),
          padding,
        );
        await expect(paper).toHaveClass(new RegExp(`dm-paper--${padding}`));
        await assertSafe(paper);
        expect(
          await paper.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        ).toBe(true);
      }
    }
  });
}

test("both rule placements leave oversized headings, controls and figures in genuinely clear bands", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const paper = await mountPaper(page, { mixed: true });
  const rows = [];
  for (const align of ["between", "baseline"]) {
    await page.evaluate(
      (align) => (window as any).paperFixture.setRuleAlign(align),
      align,
    );
    await expect(paper).toHaveAttribute("data-rule-align", align);
    await assertSafe(paper);
    rows.push((await inkAudit(paper)).rows);
  }
  expect(rows[0]).not.toEqual(rows[1]);
  await expect(paper.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(
    paper.getByRole("button", { name: "Keep a good idea" }),
  ).toBeVisible();
});

test("font changes, zoom and wrapping remeasure ruling while semantic content and focused links stay mounted", async ({
  page,
}) => {
  const paper = await mountPaper(page);
  const link = paper.getByRole("link", { name: "Keep this thought nearby" });
  const originalPaper = await paper.elementHandle();
  const originalLink = await link.elementHandle();
  await link.focus();
  await paper.locator("h3").evaluate((heading) => {
    heading.style.fontFamily = "serif";
    heading.style.fontSize = "37px";
  });
  await assertSafe(paper);
  await page.evaluate(async () => {
    const font = new FontFace(
      "Paper late handwriting",
      'url("/fonts/Kalam-Bold.ttf")',
      { weight: "700" },
    );
    document.fonts.add(await font.load());
    const heading = document.querySelector<HTMLElement>(
      "#paper-rhythm-fixture h3",
    )!;
    heading.style.fontFamily = '"Paper late handwriting", cursive';
    heading.style.fontWeight = "700";
    await document.fonts.ready;
  });
  await assertSafe(paper);
  await paper.evaluate((element) => {
    element.style.zoom = "1.25";
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await assertSafe(paper);
  // WebKit can deliver a late empty loading event after the face set is loaded.
  // A completion that has already happened must not leave decorative rules cleared.
  await page.evaluate(() => document.fonts.dispatchEvent(new Event("loading")));
  await assertSafe(paper);
  await expect(link).toBeFocused();
  expect(
    await paper.evaluate((element, saved) => element === saved, originalPaper),
  ).toBe(true);
  expect(
    await link.evaluate((element, saved) => element === saved, originalLink),
  ).toBe(true);
  await expect(paper.getByRole("list")).toHaveCount(1);
});

async function paintedIntersections(page: Page, paper: Locator) {
  // Alter CSSOM only: changing text paint must not trigger the component's DOM observers.
  const selector = "#paper-rhythm-fixture";
  await page.evaluate((selector) => {
    document.querySelector("#paper-paint-mask")?.remove();
    const style = document.createElement("style");
    style.id = "paper-paint-mask";
    document.head.append(style);
    (window as any).paperMaskSheet = style.sheet;
    (window as any).paperMaskSelector = selector;
  }, selector);
  const capture = async (hideInk: boolean, hideRules: boolean) => {
    await page.evaluate(
      ({ hideInk, hideRules }) => {
        const sheet: CSSStyleSheet = (window as any).paperMaskSheet;
        while (sheet.cssRules.length) sheet.deleteRule(0);
        const selector = (window as any).paperMaskSelector;
        if (hideInk)
          sheet.insertRule(
            `${selector}, ${selector} * { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; }`,
          );
        if (hideRules)
          sheet.insertRule(
            `${selector} .dm-paper__rules { visibility: hidden !important; }`,
          );
      },
      { hideInk, hideRules },
    );
    return (await paper.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
  };
  const blank = await capture(true, true);
  const text = await capture(false, true);
  const rules = await capture(true, false);
  const result = await page.evaluate(
    async ({ blank, text, rules }) => {
      async function decode(base64: string) {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${base64}`)).blob(),
        );
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return {
          pixels: context.getImageData(0, 0, image.width, image.height).data,
          width: image.width,
          height: image.height,
        };
      }
      const [base, ink, lines] = await Promise.all([
        decode(blank),
        decode(text),
        decode(rules),
      ]);
      let inkPixels = 0,
        rulePixels = 0,
        intersections = 0;
      const rows = new Map<number, number>();
      for (let y = 4; y < base.height - 4; y++)
        for (let x = 4; x < base.width - 4; x++) {
          const offset = (y * base.width + x) * 4;
          const differs = (pixels: Uint8ClampedArray) =>
            [0, 1, 2].some(
              (channel) =>
                Math.abs(
                  pixels[offset + channel] - base.pixels[offset + channel],
                ) >= 5,
            );
          const hasInk = differs(ink.pixels),
            hasRule = differs(lines.pixels);
          if (hasInk) {
            inkPixels++;
            rows.set(y, (rows.get(y) ?? 0) + 1);
          }
          if (hasRule) rulePixels++;
          if (hasInk && hasRule) intersections++;
        }
      return {
        inkPixels,
        rulePixels,
        intersections,
        inkRow: [...rows].sort((a, b) => b[1] - a[1])[0][0],
        pixelHeight: base.height,
      };
    },
    { blank, text, rules },
  );
  await page.evaluate(() => {
    const sheet: CSSStyleSheet = (window as any).paperMaskSheet;
    while (sheet.cssRules.length) sheet.deleteRule(0);
  });
  return result;
}

test("real rule and glyph paint never intersect, and the pixel detector catches a deliberately crossing rule", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const paper = await mountPaper(page);
  await ready(paper);
  const safe = await paintedIntersections(page, paper);
  expect(safe.inkPixels).toBeGreaterThan(1000);
  expect(safe.rulePixels).toBeGreaterThan(100);
  expect(safe.intersections).toBe(0);
  await paper.evaluate((root, { inkRow, pixelHeight }) => {
    const svg = root.querySelector<SVGSVGElement>(".dm-paper__rules")!;
    const point = svg.createSVGPoint();
    const rect = root.getBoundingClientRect();
    point.x = rect.left;
    point.y = rect.top + (inkRow * rect.height) / pixelHeight;
    const local = point.matrixTransform(svg.getScreenCTM()!.inverse());
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("dm-paper__rule-ink");
    path.dataset.negativeControl = "true";
    path.setAttribute("d", `M0 ${local.y} H${svg.viewBox.baseVal.width}`);
    path.setAttribute("stroke-width", "1.5");
    svg.append(path);
  }, safe);
  const broken = await paintedIntersections(page, paper);
  expect(
    broken.intersections,
    "A rule through a densely painted glyph row must be detected",
  ).toBeGreaterThan(5);
  await paper
    .locator('[data-negative-control="true"]')
    .evaluate((path) => path.remove());
});
