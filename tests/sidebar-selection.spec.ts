import { expect, test, type Page } from "@playwright/test";

const navFor = (page: Page) => page.locator("#notebook-navigation nav");
const markerFor = (page: Page) =>
  navFor(page).locator(":scope > .dm-nav-trail");
async function settled(page: Page, href: string) {
  const marker = markerFor(page);
  await expect(marker).toHaveAttribute("data-nav-ready", "true");
  await expect(marker).toHaveAttribute("data-active-href", href);
  await expect
    .poll(() =>
      marker.evaluate(
        (element) =>
          element
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === "running" || animation.pending,
            ).length,
      ),
    )
    .toBe(0);
  await expect
    .poll(() =>
      marker.evaluate((element) => {
        const target = element.parentElement!.querySelector(
          '[aria-current="page"]',
        )!;
        const a = element.getBoundingClientRect(),
          b = target.getBoundingClientRect();
        return Math.max(
          Math.abs(a.top - b.top),
          Math.abs(a.left - b.left),
          Math.abs(a.width - b.width),
          Math.abs(a.height - b.height),
        );
      }),
    )
    .toBeLessThan(0.7);
}
async function go(page: Page, route: string) {
  await page.evaluate((route) => (location.hash = route), route);
  await settled(page, `#${route}`);
}

test("one selection surface travels continuously and reverses from its current painted position", async ({
  page,
}) => {
  await page.goto("/#overview");
  await settled(page, "#overview");
  const marker = markerFor(page);
  const original = await marker.elementHandle();
  const initial = await marker.boundingBox();
  const target = navFor(page).getByRole("link", {
    name: "Color & themes",
    exact: true,
  });
  const targetBox = await target.boundingBox();
  await page.evaluate(() => (location.hash = "colors"));
  await expect(marker).toHaveAttribute("data-active-href", "#colors");
  const halfway = await marker.evaluate((element) => {
    const animations = element.getAnimations();
    for (const animation of animations) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * 0.25;
    }
    const box = element.getBoundingClientRect();
    return {
      top: box.top,
      left: box.left,
      opacity: getComputedStyle(element).opacity,
      count: animations.length,
    };
  });
  expect(halfway.count).toBeGreaterThan(0);
  expect(halfway.top).toBeGreaterThan(initial!.y + 1);
  expect(halfway.top).toBeLessThan(targetBox!.y - 1);
  expect(halfway.opacity).toBe("1");
  const reversal = await marker.evaluate(async (element) => {
    const before = element.getBoundingClientRect();
    return new Promise<{ before: number; after: number; transitions: number }>(
      (resolve) => {
        const observer = new MutationObserver(() => {
          if ((element as HTMLElement).dataset.activeHref !== "#overview")
            return;
          observer.disconnect();
          const animations = element.getAnimations();
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = 0;
          }
          const after = element.getBoundingClientRect();
          for (const animation of animations) animation.play();
          resolve({
            before: before.top,
            after: after.top,
            transitions: animations.length,
          });
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-active-href"],
        });
        location.hash = "overview";
      },
    );
  });
  expect(reversal.transitions).toBeGreaterThan(0);
  expect(Math.abs(reversal.before - reversal.after)).toBeLessThan(1);
  await settled(page, "#overview");
  expect(
    await marker.evaluate((element, saved) => element === saved, original),
  ).toBe(true);
  await expect(marker).toHaveAttribute("aria-hidden", "true");
  await expect(navFor(page).locator(":scope > .dm-nav-trail")).toHaveCount(1);
});

test("selection follows nested links, browser back, scrolling and responsive row heights", async ({
  page,
}) => {
  await page.goto("/#overview");
  const marker = markerFor(page);
  const original = await marker.elementHandle();
  await go(page, "category/Actions");
  await go(page, "component/button");
  const parentBox = await navFor(page)
    .locator('a[href="#category/Actions"]')
    .boundingBox();
  const childBox = await marker.boundingBox();
  expect(childBox!.x).toBeGreaterThan(parentBox!.x + 10);
  expect(childBox!.height).toBeLessThan(parentBox!.height);
  await go(page, "colors");
  await page.goBack();
  await settled(page, "#component/button");
  await navFor(page).evaluate((nav) => (nav.scrollTop = 180));
  await settled(page, "#component/button");
  await navFor(page)
    .locator('[aria-current="page"] > span:not(.nav-bullet)')
    .evaluate(
      (label) =>
        (label.textContent =
          "A longer button label that wraps into several readable notebook rows"),
    );
  const priorHeight = childBox!.height;
  await settled(page, "#component/button");
  expect((await marker.boundingBox())!.height).toBeGreaterThan(priorHeight);
  await page.setViewportSize({ width: 900, height: 800 });
  await settled(page, "#component/button");
  await navFor(page).locator('[aria-current="page"]').focus();
  await page.emulateMedia({ colorScheme: "dark" });
  await settled(page, "#component/button");
  await expect(navFor(page).locator('[aria-current="page"]')).toBeFocused();
  expect(
    await marker.evaluate((element, saved) => element === saved, original),
  ).toBe(true);
});

test("existing outline icons make one finite gesture and respect changing reduced motion", async ({
  page,
}) => {
  await page.goto("/#overview");
  const row = navFor(page).getByRole("link", {
    name: "Color & themes",
    exact: true,
  });
  const icon = row.locator("svg.dm-nav-icon");
  const originalIcon = await icon.elementHandle();
  const originalPath = await icon.locator("path").first().elementHandle();
  await row.hover();
  const motion = await icon.evaluate((svg) => {
    const animations = svg.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * 0.35;
    }
    return {
      count: animations.length,
      transform: getComputedStyle(svg).transform,
      dash: getComputedStyle(svg.querySelector("path")!).strokeDasharray,
      iterations: animations.map(
        (animation) => animation.effect!.getTiming().iterations,
      ),
    };
  });
  expect(motion.count).toBeGreaterThan(1);
  expect(motion.transform).not.toBe("none");
  expect(motion.dash).not.toBe("none");
  expect(motion.iterations.every((iterations) => iterations === 1)).toBe(true);
  await icon.evaluate(async (svg) => {
    const animations = svg.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) +
        Number(animation.effect!.getTiming().delay) -
        1;
      animation.play();
    }
    await Promise.allSettled(animations.map((animation) => animation.finished));
  });
  await expect
    .poll(() =>
      icon.evaluate((svg) => svg.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await expect(icon.locator("path").first()).toHaveCSS(
    "stroke-dasharray",
    "none",
  );
  const focusRow = navFor(page).getByRole("link", {
    name: "The sketchbook",
    exact: true,
  });
  const focusIcon = focusRow.locator("svg.dm-nav-icon");
  await focusRow.focus();
  await expect(focusRow).toBeFocused();
  await expect
    .poll(() =>
      focusIcon.evaluate((svg) => svg.getAnimations({ subtree: true }).length),
    )
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      focusIcon.evaluate((svg) => svg.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await go(page, "typography");
  await expect(markerFor(page)).toHaveCSS("transition-duration", "0s");
  const typeRow = navFor(page).getByRole("link", {
    name: "Typography",
    exact: true,
  });
  await typeRow.hover();
  expect(
    await typeRow
      .locator("svg")
      .evaluate((svg) => svg.getAnimations({ subtree: true }).length),
  ).toBe(0);
  expect(
    await icon.evaluate((element, saved) => element === saved, originalIcon),
  ).toBe(true);
  expect(
    await icon
      .locator("path")
      .first()
      .evaluate((element, saved) => element === saved, originalPath),
  ).toBe(true);
});

test("the mobile drawer keeps one aligned marker through route dismissal and reopening", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/#overview");
  const toggle = page.locator(".mobile-nav-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await settled(page, "#overview");
  const marker = markerFor(page);
  const original = await marker.elementHandle();
  await navFor(page)
    .getByRole("link", { name: "Color & themes", exact: true })
    .click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await settled(page, "#colors");
  await expect(page.locator(".navigation-shell")).toHaveAttribute(
    "aria-modal",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 1100, height: 900 });
  await settled(page, "#colors");
  await expect(page.locator(".navigation-shell")).not.toHaveAttribute(
    "aria-modal",
  );
  expect(
    await marker.evaluate((element, saved) => element === saved, original),
  ).toBe(true);
});

test("quiet public use changes native button selection immediately and cleans owned animation on unmount", async ({
  page,
}) => {
  await page.goto("/#overview");
  await page.evaluate(async () => {
    const mod = await import("/node_modules/.vite/deps/react.js");
    const React = mod.default ?? mod;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { NavTrail } = await import("/src/lib/nav-trail.tsx");
    const { Icon } = await import("/src/Icons.tsx");
    const host = document.createElement("section");
    host.id = "quiet-nav-fixture";
    host.style.cssText =
      "position:fixed;right:20px;top:20px;width:280px;z-index:999;background:var(--dm-sidebar);color:var(--dm-sidebar-ink)";
    document.body.append(host);
    const state: any = {};
    (window as any).quietNavFixture = state;
    function Fixture() {
      const ref = React.useRef<HTMLElement>(null);
      const [active, setActive] = React.useState(0);
      const [quiet, setQuiet] = React.useState(true);
      const [visible, setVisible] = React.useState(true);
      state.setQuiet = setQuiet;
      state.removeMarker = () => setVisible(false);
      return React.createElement(
        "nav",
        {
          ref,
          className: "dm-nav-trail-host",
          "aria-label": "Quiet public navigation",
        },
        visible &&
          React.createElement(NavTrail, {
            containerRef: ref,
            activeKey: active,
            quiet,
          }),
        ...["book", "pen"].map((name, index) =>
          React.createElement(
            "button",
            {
              key: name,
              type: "button",
              "data-nav-icon": name,
              "aria-current": active === index ? "page" : undefined,
              onClick: () => setActive(index),
              style: {
                width: "100%",
                height: index ? "60px" : "40px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              },
            },
            React.createElement(Icon, { name, className: "dm-nav-icon" }),
            `Notebook page ${index + 1}`,
          ),
        ),
      );
    }
    const root = createRoot(host);
    state.unmount = () => root.unmount();
    root.render(React.createElement(Fixture));
  });
  const fixture = page.getByRole("navigation", {
    name: "Quiet public navigation",
  });
  const marker = fixture.locator(".dm-nav-trail");
  await fixture.getByRole("button", { name: "Notebook page 2" }).click();
  await expect(marker).toHaveCSS("transition-duration", "0s");
  expect(
    await marker.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  expect(
    await fixture
      .locator("svg")
      .evaluateAll(
        (icons) =>
          icons.flatMap((icon) => icon.getAnimations({ subtree: true })).length,
      ),
  ).toBe(0);
  await page.evaluate(() => (window as any).quietNavFixture.setQuiet(false));
  const first = fixture.getByRole("button", { name: "Notebook page 1" });
  await first.focus();
  await expect
    .poll(() =>
      first
        .locator("svg")
        .evaluate((svg) => svg.getAnimations({ subtree: true }).length),
    )
    .toBeGreaterThan(0);
  const iconHandle = await first.locator("svg").elementHandle();
  await page.evaluate(() => (window as any).quietNavFixture.removeMarker());
  await expect(marker).toHaveCount(0);
  expect(
    await iconHandle!.evaluate(
      (svg) => svg.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await expect(first).toBeFocused();
  await page.evaluate(() => (window as any).quietNavFixture.unmount());
});
