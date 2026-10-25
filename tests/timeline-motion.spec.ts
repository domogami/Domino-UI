import { expect, test, type Page } from "@playwright/test";

async function mountTimeline(
  page: Page,
  options: {
    ids?: string[];
    quiet?: boolean;
    animate?: boolean;
    offscreen?: boolean;
    long?: boolean;
  } = {},
) {
  await page.goto("/#component/timeline");
  await page.evaluate(async (options) => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { Timeline } = await import("/src/lib/timeline.tsx");
    const target = window as any;
    target.timelineFixture?.unmount();
    document.querySelector("#timeline-fixture-host")?.remove();
    const host = document.createElement("section");
    host.id = "timeline-fixture-host";
    host.style.cssText =
      "width:calc(100% - 32px);max-width:560px;margin:1400px auto 80px;background:var(--dm-paper)";
    document.body.append(host);
    const state: any = {};
    target.timelineFixture = state;
    const pool = Object.fromEntries(
      ["idea", "shape", "share", "return"].map((id, index) => [
        id,
        {
          id,
          meta: options.long
            ? `STAGE ${index + 1} / A longer context label and averylongunbrokenlabelthatmustwrap.`
            : `STAGE ${index + 1}`,
          title: options.long
            ? `A thoughtful milestone with averylongunbrokentitlethatmuststillfit ${index + 1}`
            : `Illustrative milestone ${index + 1}`,
          description: React.createElement(
            "p",
            null,
            "A useful thought stays readable throughout the drawing. ",
            React.createElement(
              "a",
              { href: `https://example.invalid/${id}` },
              `Read ${id} notes`,
            ),
          ),
        },
      ]),
    );
    function Fixture() {
      const [ids, setIds] = React.useState(
        options.ids ?? ["idea", "shape", "share"],
      );
      const [quiet, setQuiet] = React.useState(options.quiet ?? false);
      const [animate, setAnimate] = React.useState(options.animate ?? true);
      const [replayKey, setReplayKey] = React.useState<string | number>(0);
      state.setIds = setIds;
      state.setQuiet = setQuiet;
      state.setAnimate = setAnimate;
      state.replay = setReplayKey;
      return React.createElement(Timeline, {
        items: ids.map((id: string) => pool[id]),
        quiet,
        animate,
        replayKey,
        label: "Illustrative milestones",
        id: "timeline-motion-fixture",
        "data-testid": "timeline-fixture",
        "data-consumer": "preserved",
        start: 4,
        className: "fixture-timeline",
      });
    }
    const root = createRoot(host);
    state.unmount = () => root.unmount();
    root.render(React.createElement(Fixture));
    window.scrollTo({ top: 0, behavior: "instant" });
  }, options);
  await expect(list(page)).toBeAttached();
  if (!options.offscreen && (options.ids ?? ["idea", "shape", "share"]).length)
    await list(page).scrollIntoViewIfNeeded();
}
const list = (page: Page) => page.getByTestId("timeline-fixture");
const firstLine = (page: Page) =>
  list(page).locator(".dm-timeline__line").first();
const firstConnector = (page: Page) =>
  list(page).locator(".dm-timeline__connector").first();

async function staticTimeline(page: Page) {
  await expect(list(page)).toHaveAttribute("data-state", "finished");
  expect(
    await list(page).evaluate(
      (root) => root.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  for (const content of await list(page)
    .locator(".dm-timeline__content")
    .all()) {
    await expect(content).toHaveCSS("opacity", "1");
    await expect(content).toHaveCSS("transform", "none");
  }
  for (const line of await list(page).locator(".dm-timeline__line").all())
    await expect(line).toHaveCSS("stroke-dashoffset", "0px");
}

test("the first viewport entry draws once and an offscreen replay waits without hiding content", async ({
  page,
}) => {
  await mountTimeline(page, { offscreen: true });
  await expect(list(page)).toHaveAttribute("data-state", "pending");
  await expect(list(page)).toHaveRole("list");
  await expect(list(page).getByRole("listitem")).toHaveCount(3);
  await expect(list(page).getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(list(page).getByRole("link")).toHaveCount(3);
  for (const content of await list(page).locator(".dm-timeline__content").all())
    await expect(content).toHaveCSS("opacity", "1");
  await list(page).scrollIntoViewIfNeeded();
  await expect(list(page)).toHaveAttribute("data-state", "running");
  await expect(list(page)).toHaveAttribute("data-replay", "1");
  await expect(list(page)).toHaveAttribute("data-state", "finished");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await list(page).scrollIntoViewIfNeeded();
  await expect(list(page)).toHaveAttribute("data-state", "finished");
  await expect(list(page)).toHaveAttribute("data-replay", "1");
  await page.evaluate(() => {
    scrollTo({ top: 0, behavior: "instant" });
    (window as any).timelineFixture.replay("draw-again");
  });
  await expect
    .poll(() =>
      list(page).evaluate(
        (root) => root.getBoundingClientRect().top >= innerHeight,
      ),
    )
    .toBe(true);
  await expect(list(page)).toHaveAttribute("data-state", "pending");
  await expect(list(page)).toHaveAttribute("data-replay", "1");
  await list(page).scrollIntoViewIfNeeded();
  await expect(list(page)).toHaveAttribute("data-replay", "2");
  await expect(list(page)).toHaveAttribute("data-state", "finished");
  await page.evaluate(() =>
    (window as any).timelineFixture.setIds([
      "return",
      "idea",
      "shape",
      "share",
    ]),
  );
  await expect(list(page).getByRole("listitem")).toHaveCount(4);
  await staticTimeline(page);
  await expect(list(page)).toHaveAttribute("data-replay", "2");
});

test("connector frames paint growing ink and replay preserves the list, items, links and focus", async ({
  page,
}) => {
  await mountTimeline(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(list(page)).toHaveAttribute("data-replay", "1");
  const originalList = await list(page).elementHandle();
  const item = list(page).locator('[data-timeline-id="idea"]');
  const originalItem = await item.elementHandle();
  const link = item.getByRole("link", { name: "Read idea notes" });
  const originalLink = await link.elementHandle();
  await link.focus();
  await page.evaluate(() => (window as any).timelineFixture.replay(1));
  await expect(list(page)).toHaveAttribute("data-replay", "2");
  await expect(link).toBeFocused();
  expect(
    await list(page).evaluate(
      (element, saved) => element === saved,
      originalList,
    ),
  ).toBe(true);
  expect(
    await item.evaluate((element, saved) => element === saved, originalItem),
  ).toBe(true);
  expect(
    await link.evaluate((element, saved) => element === saved, originalLink),
  ).toBe(true);
  await expect(list(page)).toHaveAttribute("data-consumer", "preserved");
  await expect(list(page)).toHaveAttribute("start", "4");
  const timing = await list(page).evaluate((root) => {
    const animations = root.getAnimations({ subtree: true });
    for (const animation of animations) animation.pause();
    const path = root.querySelector(".dm-timeline__line")!;
    const connector = path
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "dm-timeline-connector",
      )!;
    (window as any).timelineFixture.animations = animations;
    (window as any).timelineFixture.connector = connector;
    const contents = Array.from(
      root.querySelectorAll(".dm-timeline__content"),
    ).map((element) => {
      const animation = element
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "dm-timeline-content",
        )!;
      return {
        delay: animation.effect!.getTiming().delay,
        opacity: Number(getComputedStyle(element).opacity),
      };
    });
    return {
      duration: connector.effect!.getTiming().duration,
      delay: connector.effect!.getTiming().delay,
      contents,
    };
  });
  expect(timing.duration).toBe(480);
  expect(timing.delay).toBe(120);
  expect(timing.contents.map((content) => content.delay)).toEqual([
    0, 600, 1200,
  ]);
  expect(timing.contents.every((content) => content.opacity >= 0.75)).toBe(
    true,
  );
  const frame = async (fraction: number) => {
    await page.evaluate((fraction) => {
      const animation = (window as any).timelineFixture.connector;
      const timing = animation.effect.getTiming();
      animation.currentTime = timing.delay + Number(timing.duration) * fraction;
    }, fraction);
    return {
      offset: await firstLine(page).evaluate((path) =>
        parseFloat(getComputedStyle(path).strokeDashoffset),
      ),
      pixels: await firstConnector(page).screenshot({ animations: "allow" }),
    };
  };
  const early = await frame(0.1),
    complete = await frame(0.99);
  expect(early.offset).toBeGreaterThan(complete.offset + 0.5);
  expect(early.pixels.equals(complete.pixels)).toBe(false);
  await page.evaluate(async () => {
    const animations: Animation[] = (window as any).timelineFixture.animations;
    for (const animation of animations) {
      const timing = animation.effect!.getTiming();
      animation.currentTime =
        Number(timing.delay) + Number(timing.duration) - 1;
      animation.play();
    }
    await Promise.allSettled(animations.map((animation) => animation.finished));
  });
  await staticTimeline(page);
  await expect(link).toBeFocused();
});

test("quiet and animate=false render finished ink and preserve readable native content", async ({
  page,
}) => {
  for (const options of [{ quiet: true }, { animate: false }]) {
    await mountTimeline(page, options);
    await staticTimeline(page);
    await page.evaluate(() =>
      (window as any).timelineFixture.replay("quiet-request"),
    );
    await staticTimeline(page);
    await expect(list(page).getByRole("heading", { level: 3 })).toHaveCount(3);
    await expect(list(page).getByRole("link")).toHaveCount(3);
  }
});

test("changing motion preference finishes the current draw without losing focused links or auto-replaying", async ({
  page,
}) => {
  await mountTimeline(page);
  await expect(list(page)).toHaveAttribute("data-state", "running");
  const link = list(page).getByRole("link", { name: "Read shape notes" });
  await link.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await staticTimeline(page);
  await expect(link).toBeFocused();
  await page.evaluate(() =>
    (window as any).timelineFixture.replay("reduced-request"),
  );
  await staticTimeline(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await staticTimeline(page);
  const previous = await list(page).getAttribute("data-replay");
  await page.evaluate(() =>
    (window as any).timelineFixture.replay("motion-again"),
  );
  await expect(list(page)).not.toHaveAttribute("data-replay", previous!);
  await expect(list(page)).toHaveAttribute("data-state", "running");
  await page.evaluate(() => (window as any).timelineFixture.setQuiet(true));
  await staticTimeline(page);
  await expect(link).toBeFocused();
  await page.evaluate(() => (window as any).timelineFixture.setQuiet(false));
  await staticTimeline(page);
});

test("empty, single and larger timelines retain stable item identity through structural changes", async ({
  page,
}) => {
  await mountTimeline(page, { ids: [], quiet: true });
  await staticTimeline(page);
  await expect(list(page).getByRole("listitem")).toHaveCount(0);
  await expect(list(page).locator(".dm-timeline__connector")).toHaveCount(0);
  await page.evaluate(() => (window as any).timelineFixture.setIds(["idea"]));
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await expect(list(page).getByRole("heading", { level: 3 })).toHaveText(
    "Illustrative milestone 1",
  );
  await expect(list(page).locator(".dm-timeline__connector")).toHaveCount(0);
  await page.evaluate(() =>
    (window as any).timelineFixture.setIds([
      "idea",
      "shape",
      "share",
      "return",
    ]),
  );
  await expect(list(page).getByRole("listitem")).toHaveCount(4);
  await expect(list(page).locator(".dm-timeline__connector")).toHaveCount(3);
  const item = list(page).locator('[data-timeline-id="shape"]');
  const original = await item.elementHandle();
  await page.evaluate(() =>
    (window as any).timelineFixture.setIds([
      "return",
      "shape",
      "idea",
      "share",
    ]),
  );
  expect(
    await item.evaluate((element, saved) => element === saved, original),
  ).toBe(true);
  await staticTimeline(page);
});

for (const width of [320, 390]) {
  test(`timeline labels, headings and linked descriptions wrap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await mountTimeline(page, { long: true, quiet: true });
    await page.evaluate(() => document.fonts.ready);
    for (const target of [
      list(page),
      ...(await list(page)
        .locator(
          ".dm-timeline__content, .dm-timeline__meta, .dm-timeline__title, .dm-timeline__description",
        )
        .all()),
    ])
      expect(
        await target.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(list(page).getByRole("link")).toHaveCount(3);
  });
}
