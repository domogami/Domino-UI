import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 900 } });

const toggleFor = (page: Page) => page.locator(".mobile-nav-toggle");
const sidebarFor = (page: Page) => page.locator("#notebook-navigation");

async function expectOpen(page: Page, open: boolean) {
  await expect(toggleFor(page)).toHaveAttribute("aria-expanded", String(open));
  await expect(toggleFor(page)).toHaveAttribute(
    "data-state",
    open ? "open" : "closed",
  );
  if (open) {
    await expect(sidebarFor(page)).not.toHaveAttribute("aria-hidden", "true");
  } else {
    await expect(sidebarFor(page)).toHaveAttribute("aria-hidden", "true");
  }
  await expect
    .poll(() =>
      sidebarFor(page).evaluate((element) => (element as HTMLElement).inert),
    )
    .toBe(!open);
  await expect
    .poll(() =>
      page
        .locator(".app-content")
        .evaluate((element) => (element as HTMLElement).inert),
    )
    .toBe(open);
}

async function transitionTimes(element: Locator) {
  return element.evaluate((node) =>
    getComputedStyle(node)
      .transitionDuration.split(",")
      .map(
        (duration) =>
          Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000),
      ),
  );
}

test("one menu button morphs in place and keeps focus inside the navigation modal", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = toggleFor(page);
  const shell = page.locator(".navigation-shell");
  const button = await toggle.elementHandle();
  const paths = toggle.locator(".dm-menu-toggle__line");
  const firstPath = await paths.first().elementHandle();
  await expect(paths).toHaveCount(3);
  await expect(toggle).toHaveAttribute("aria-controls", "notebook-navigation");
  await expectOpen(page, false);
  await expect(shell).not.toHaveAttribute("role", "dialog");

  await toggle.click();
  await expectOpen(page, true);
  await expect(shell).toHaveAttribute("role", "dialog");
  await expect(shell).toHaveAttribute("aria-modal", "true");
  await expect(toggle).toHaveAccessibleName("Close navigation");
  await expect(toggle).toBeFocused();
  expect(await toggle.evaluate((node) => !node.closest(".app-content"))).toBe(
    true,
  );
  expect(
    await shell.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  expect(await toggle.evaluate((node, saved) => node === saved, button)).toBe(
    true,
  );
  expect(
    await paths.first().evaluate((node, saved) => node === saved, firstPath),
  ).toBe(true);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Escape");
  await expectOpen(page, false);
  await expect(toggle).toHaveAccessibleName("Open navigation");
  await expect(toggle).toBeFocused();
  expect(await toggle.evaluate((node, saved) => node === saved, button)).toBe(
    true,
  );
});

test("Tab and Shift+Tab wrap through the same toggle and visible drawer controls", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = toggleFor(page);
  await toggle.click();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  const lastControlIsFocused = () =>
    sidebarFor(page).evaluate((sidebar) => {
      const controls = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        ),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      );
      return document.activeElement === controls.at(-1);
    });
  await expect.poll(lastControlIsFocused).toBe(true);
  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await sidebarFor(page).evaluate((node) =>
      node.contains(document.activeElement),
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".app-content")
      .evaluate((node) => node.contains(document.activeElement)),
  ).toBe(false);
});

test("the panel and backdrop interpolate together and stay mounted through closing", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = toggleFor(page);
  const sidebar = sidebarFor(page);
  const backdrop = page.locator(".nav-backdrop");
  const panelNode = await sidebar.elementHandle();
  const backdropNode = await backdrop.elementHandle();
  expect(await transitionTimes(sidebar)).toContain(360);
  expect(await transitionTimes(backdrop)).toContain(360);
  await expect(sidebar).toHaveCSS(
    "transition-timing-function",
    /cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  );
  await toggle.click();
  await expectOpen(page, true);
  await expect(sidebar).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await expect(backdrop).toHaveCSS("opacity", "1");

  const closing = await toggle.evaluate(async (button) => {
    (button as HTMLButtonElement).click();
    const panel = document.querySelector<HTMLElement>("#notebook-navigation")!;
    const shade = document.querySelector<HTMLElement>(".nav-backdrop")!;
    const read = () => ({
      x: new DOMMatrix(getComputedStyle(panel).transform).m41,
      opacity: Number(getComputedStyle(shade).opacity),
      panelAnimating: panel
        .getAnimations()
        .some((animation) => animation.playState === "running"),
      backdropAnimating: shade
        .getAnimations()
        .some((animation) => animation.playState === "running"),
    });
    // React can commit on the first frame; wait for a rendered intermediate
    // frame instead of assuming two frames have advanced the transition.
    for (let frame = 0; frame < 30; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const state = read();
      if (
        state.x < 0 &&
        state.x > -260 &&
        state.opacity > 0 &&
        state.opacity < 1
      )
        return state;
    }
    return read();
  });
  expect(closing.panelAnimating).toBe(true);
  expect(closing.backdropAnimating).toBe(true);
  expect(closing.x).toBeLessThan(0);
  expect(closing.x).toBeGreaterThan(-260);
  expect(closing.opacity).toBeGreaterThan(0);
  expect(closing.opacity).toBeLessThan(1);
  await expectOpen(page, false);
  await expect(backdrop).toHaveCSS("opacity", "0");
  await expect(backdrop).toHaveCSS("pointer-events", "none");
  await expect(backdrop).toHaveCSS("visibility", "hidden");
  expect(
    await sidebar.evaluate((node, saved) => node === saved, panelNode),
  ).toBe(true);
  expect(
    await backdrop.evaluate((node, saved) => node === saved, backdropNode),
  ).toBe(true);
});

test("quickly reversing the menu leaves one coherent open state and the same button", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = toggleFor(page);
  const buttonNode = await toggle.elementHandle();
  await toggle.click();
  await toggle.evaluate(async (button) => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    (button as HTMLButtonElement).click();
    await frame();
    await frame();
    (button as HTMLButtonElement).click();
  });
  await expectOpen(page, true);
  await expect(toggle).toBeFocused();
  await expect(sidebarFor(page)).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await expect(page.locator(".nav-backdrop")).toHaveCSS("opacity", "1");
  await expect(page.locator(".navigation-shell")).toHaveAttribute(
    "aria-modal",
    "true",
  );
  expect(
    await toggle.evaluate((node, saved) => node === saved, buttonNode),
  ).toBe(true);
  await toggle.click();
  await expectOpen(page, false);
  await expect(toggle).toBeFocused();
});

test("a route choice and a tap outside the drawer both dismiss navigation", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = toggleFor(page);
  await toggle.click();
  await sidebarFor(page)
    .getByRole("link", { name: "Color & themes", exact: true })
    .click();
  await expect(page).toHaveURL(/#colors$/);
  await expectOpen(page, false);
  await expect(toggle).toBeFocused();
  await toggle.click();
  await expectOpen(page, true);
  await page.mouse.click(365, 400);
  await expectOpen(page, false);
  await expect(toggle).toBeFocused();
});

test("resizing to desktop removes modal state and restores the body's prior overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.body.style.overflow = "clip";
  });
  await toggleFor(page).click();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(toggleFor(page)).toBeHidden();
  await expect(page.locator(".navigation-shell")).not.toHaveAttribute(
    "role",
    "dialog",
  );
  await expect(page.locator(".navigation-shell")).not.toHaveAttribute(
    "aria-modal",
    "true",
  );
  await expect
    .poll(() =>
      sidebarFor(page).evaluate((node) => (node as HTMLElement).inert),
    )
    .toBe(false);
  await expect
    .poll(() =>
      page
        .locator(".app-content")
        .evaluate((node) => (node as HTMLElement).inert),
    )
    .toBe(false);
  await expect(page.locator("body")).toHaveCSS("overflow", "clip");
  await expect(
    sidebarFor(page).getByRole("link", { name: "Color & themes", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expectOpen(page, false);
  await expect(toggleFor(page)).toBeVisible();
});

test("search is the top modal and consumes its own Escape before navigation closes", async ({
  page,
}) => {
  await page.goto("/");
  await toggleFor(page).click();
  const searchButton = page.locator(".sidebar-search");
  await searchButton.click();
  const search = page.getByRole("dialog", {
    name: "Find a little something",
    exact: true,
  });
  await expect(search).toBeVisible();
  await expect(
    search.getByRole("textbox", { name: "Search the notebook", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
  await expectOpen(page, true);
  await expect(searchButton).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expectOpen(page, false);
  await expect(toggleFor(page)).toBeFocused();
});

test("reduced motion changes state immediately without panel or icon animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = toggleFor(page);
  await toggle.click();
  await expectOpen(page, true);
  for (const element of [
    sidebarFor(page),
    page.locator(".nav-backdrop"),
    toggle.locator(".dm-menu-toggle__line").first(),
  ]) {
    expect(
      (await transitionTimes(element)).every((duration) => duration === 0),
    ).toBe(true);
    expect(
      await element.evaluate((node) =>
        node
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ),
    ).toBe(false);
  }
  await expect(sidebarFor(page)).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.keyboard.press("Escape");
  await expectOpen(page, false);
  await expect(toggle).toBeFocused();
});
