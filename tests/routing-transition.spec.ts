import { expect, test, type Page } from "@playwright/test";

async function observeTransitions(page: Page) {
  await page.addInitScript(() => {
    const browser = window as Window & { routeTransitions?: ViewTransition[] };
    browser.routeTransitions = [];
    const start = document.startViewTransition;
    if (!start) return;
    document.startViewTransition = function (update) {
      const transition = start.call(this, update);
      browser.routeTransitions!.push(transition);
      return transition;
    };
  });
}

test("real page snapshots animate the content sheet while navigation, scroll and history keep working", async ({
  page,
}) => {
  await observeTransitions(page);
  await page.goto("/#overview");
  test.skip(
    !(await page.evaluate(
      () => typeof document.startViewTransition === "function",
    )),
    "Browser has no same-document View Transitions API.",
  );
  await page.addStyleTag({
    content:
      "html { --dm-layer-duration: 800ms; --dm-layer-exit-duration: 400ms; }",
  });
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  const colors = page.locator('.sidebar a[href="#colors"]');
  await colors.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toBeVisible();
  const snapshot = await page.evaluate(async () => {
    const transitions = (
      window as Window & { routeTransitions: ViewTransition[] }
    ).routeTransitions;
    const transition = transitions.at(-1)!;
    await transition.ready;
    return {
      root: getComputedStyle(document.documentElement).viewTransitionName,
      sheet: getComputedStyle(document.querySelector(".dm-page-transition")!)
        .viewTransitionName,
      rail: getComputedStyle(document.querySelector(".sidebar")!)
        .viewTransitionName,
      animations: document
        .getAnimations()
        .map((animation) => (animation as CSSAnimation).animationName),
      scroll: window.scrollY,
    };
  });
  expect(snapshot.root).toBe("none");
  expect(snapshot.sheet).toBe("dm-page-content");
  expect(snapshot.rail).toBe("none");
  expect(snapshot.animations).toContain("dm-page-arrive");
  expect(snapshot.animations).toContain("dm-page-leave");
  expect(snapshot.scroll).toBe(0);
  await expect(colors).toBeFocused();
  await page.evaluate(async () => {
    await (
      window as Window & { routeTransitions: ViewTransition[] }
    ).routeTransitions.at(-1)!.finished;
  });
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-dm-page-transition",
  );
  await colors.click();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { routeTransitions: ViewTransition[] })
          .routeTransitions.length,
    ),
  ).toBe(1);
  await page.locator('.sidebar a[href="#typography"]').click();
  await expect(
    page.getByRole("heading", { name: "Words with character.", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#colors$/);
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#typography$/);
  await expect(
    page.getByRole("heading", { name: "Words with character.", exact: true }),
  ).toBeVisible();
});

for (const mode of ["unsupported", "reduced", "capture fails"] as const) {
  test(`${mode} routing commits immediately without leaving a transition marker`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      (window as Window & { routeStartCount: number }).routeStartCount = 0;
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value:
          mode === "unsupported"
            ? undefined
            : () => {
                (
                  window as Window & { routeStartCount: number }
                ).routeStartCount += 1;
                throw new DOMException(
                  "Capture unavailable",
                  "InvalidStateError",
                );
              },
      });
    }, mode);
    if (mode === "reduced")
      await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#overview");
    await page.locator('.sidebar a[href="#colors"]').click();
    await expect(
      page.getByRole("heading", { name: "Color & themes.", exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-dm-page-transition",
    );
    expect(
      await page.evaluate(
        () => (window as Window & { routeStartCount: number }).routeStartCount,
      ),
    ).toBe(mode === "capture fails" ? 1 : 0);
  });
}

test("superseded capture callbacks cannot restore an obsolete route, even out of order", async ({
  page,
}) => {
  await page.addInitScript(() => {
    type Pending = {
      update: () => Promise<void>;
      finish: () => void;
      skipped: boolean;
    };
    const pending: Pending[] = [];
    (window as Window & { pendingRoutes: Pending[] }).pendingRoutes = pending;
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (update: () => void) => {
        let finish!: () => void;
        let done!: () => void;
        const finished = new Promise<void>((resolve) => {
          finish = resolve;
        });
        const updateCallbackDone = new Promise<void>((resolve) => {
          done = resolve;
        });
        const entry: Pending = {
          update: async () => {
            update();
            done();
          },
          finish,
          skipped: false,
        };
        pending.push(entry);
        return {
          ready: Promise.resolve(),
          finished,
          updateCallbackDone,
          skipTransition: () => {
            entry.skipped = true;
          },
        };
      },
    });
  });
  await page.goto("/#overview");
  await page.locator('.sidebar a[href="#colors"]').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).pendingRoutes.length))
    .toBe(1);
  await page.locator('.sidebar a[href="#typography"]').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).pendingRoutes.length))
    .toBe(2);
  await page.evaluate(async () => {
    const pending = (window as any).pendingRoutes;
    await pending[1].update();
    pending[1].finish();
    await pending[0].update();
    pending[0].finish();
  });
  await expect(
    page.getByRole("heading", { name: "Words with character.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).pendingRoutes[0].skipped),
  ).toBe(true);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-dm-page-transition",
  );
});

test("search and mobile navigation keep their own close motion and focus restoration", async ({
  page,
}) => {
  await observeTransitions(page);
  await page.goto("/#overview");
  const searchButton = page.locator(".sidebar-search");
  await searchButton.click();
  const search = page.getByRole("dialog", {
    name: "Find a little something",
    exact: true,
  });
  await search
    .getByRole("textbox", { name: "Search the notebook" })
    .fill("Color & themes");
  await page.keyboard.press("Enter");
  await expect(search).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toBeVisible();
  await expect(searchButton).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { routeTransitions: ViewTransition[] })
          .routeTransitions.length,
    ),
  ).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.locator(".mobile-nav-toggle");
  await toggle.click();
  await page.locator('.sidebar a[href="#typography"]').click();
  await expect(
    page.getByRole("heading", { name: "Words with character.", exact: true }),
  ).toBeVisible();
  await expect(toggle).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { routeTransitions: ViewTransition[] })
          .routeTransitions.length,
    ),
  ).toBe(0);
});

test("in-page anchors and browser-owned visual transitions bypass page snapshots", async ({
  page,
}) => {
  await observeTransitions(page);
  await page.goto("/#haptics");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        addEventListener("hashchange", () => resolve(), { once: true });
        location.hash = "safari-haptics";
      }),
  );
  await expect(page.locator("#safari-haptics")).toBeVisible();
  await expect(page.locator(".not-found")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { routeTransitions: ViewTransition[] })
          .routeTransitions.length,
    ),
  ).toBe(0);
  await page.evaluate(() => {
    history.pushState(null, "", "#colors");
    const event = new PopStateEvent("popstate");
    Object.defineProperty(event, "hasUAVisualTransition", { value: true });
    dispatchEvent(event);
  });
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { routeTransitions: ViewTransition[] })
          .routeTransitions.length,
    ),
  ).toBe(0);
});
