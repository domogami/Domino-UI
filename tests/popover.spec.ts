import { expect, test, type Page } from "@playwright/test";

async function mountPopover(
  page: Page,
  options: {
    controlled?: boolean;
    preventDefault?: boolean;
    disabled?: boolean;
    long?: boolean;
    bottom?: boolean;
    absolute?: boolean;
  } = {},
) {
  await page.goto("/#layers");
  await page.evaluate(async (options) => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { Popover } = await import("/src/lib/popover.tsx");
    const target = window as any;
    target.popoverTest?.unmount();
    document.querySelector('[data-testid="popover-harness"]')?.remove();
    target.popoverTest = { changes: [], clicks: 0, cleanups: 0 };
    const state = target.popoverTest;
    const host = document.createElement("section");
    host.dataset.testid = "popover-harness";
    host.style.cssText = options.absolute
      ? "position:absolute;top:1100px;left:16px;z-index:99;padding:16px;background:var(--dm-paper)"
      : `position:fixed;${options.bottom ? "bottom:24px" : "top:32px"};left:16px;z-index:99;padding:16px;background:var(--dm-paper)`;
    if (options.absolute) document.body.style.minHeight = "2200px";
    document.body.append(host);
    function Harness() {
      const [open, setOpen] = React.useState(false);
      state.setOpen = setOpen;
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Popover,
          {
            title: "A little more detail",
            "data-testid": "harness-popover",
            description: "A nonmodal layer with room for a thought.",
            open: options.controlled ? open : undefined,
            onOpenChange: (next: boolean) => {
              state.changes.push(next);
              if (options.controlled) setOpen(next);
            },
            trigger: React.createElement(
              "button",
              {
                id: "harness-trigger",
                disabled: options.disabled,
                ref: (node: HTMLElement | null) => {
                  state.trigger = node;
                  return () => {
                    state.trigger = null;
                    state.cleanups++;
                  };
                },
                onClick: (event: MouseEvent) => {
                  state.clicks++;
                  if (options.preventDefault) event.preventDefault();
                },
              },
              "Harness details",
            ),
          },
          React.createElement("input", { placeholder: "A thought" }),
          options.long &&
            React.createElement(
              "div",
              null,
              ...Array.from({ length: 24 }, (_, i) =>
                React.createElement(
                  "p",
                  { key: i },
                  `Notebook line ${i + 1}. A longer thought that wraps naturally and keeps its own place on the paper.`,
                ),
              ),
            ),
        ),
        React.createElement(
          "button",
          { id: "harness-after" },
          "Following control",
        ),
      );
    }
    const root = createRoot(host);
    state.unmount = () => root.unmount();
    root.render(React.createElement(Harness));
  }, options);
  await expect(page.locator("#harness-trigger")).toBeVisible();
}

const panel = (page: Page) => page.getByTestId("harness-popover");
const trigger = (page: Page) => page.locator("#harness-trigger");

async function expectInsideViewport(page: Page) {
  await expect
    .poll(async () =>
      panel(page).evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.left >= 15 &&
          rect.top >= 15 &&
          rect.right <= innerWidth - 15 &&
          rect.bottom <= innerHeight - 15
        );
      }),
    )
    .toBe(true);
}

test("paper popover uses the top layer and lets Tab leave without pulling focus back", async ({
  page,
}) => {
  await mountPopover(page);
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await expect(panel(page).getByPlaceholder("A thought")).toBeFocused();
  expect(
    await panel(page).evaluate((element) => element.matches(":popover-open")),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.locator("#harness-after")).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await page.waitForTimeout(300);
  await expect(page.locator("#harness-after")).toBeFocused();
  expect(
    await page.evaluate(() => (window as any).popoverTest.changes),
  ).toEqual([true, false]);
});

test("outside pointer dismissal keeps focus on the clicked control and Escape restores the trigger", async ({
  page,
}) => {
  await mountPopover(page);
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await page.locator("#harness-after").click();
  await expect(page.locator("#harness-after")).toBeFocused();
  await page.waitForTimeout(300);
  await expect(page.locator("#harness-after")).toBeFocused();
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(() => (window as any).popoverTest.changes),
  ).toEqual([true, false, true, false]);
});

test("controlled popovers preserve the panel and trigger ref through rapid reversal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mountPopover(page, { controlled: true });
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  const original = await panel(page).elementHandle();
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  expect(
    await panel(page).evaluate((element, saved) => element === saved, original),
  ).toBe(true);
  expect(
    await trigger(page).evaluate(
      (element) => element === (window as any).popoverTest.trigger,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as any).popoverTest.changes),
  ).toEqual([true, false, true]);
  await page.evaluate(() => (window as any).popoverTest.setOpen(false));
  await expect(trigger(page)).toBeFocused();
  await page.evaluate(() => (window as any).popoverTest.unmount());
  expect(await page.evaluate(() => (window as any).popoverTest.trigger)).toBe(
    null,
  );
  expect(errors).toEqual([]);
});

test("narrow long popovers flip above the anchor and scroll within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await mountPopover(page, { long: true, bottom: true });
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await expect(panel(page)).toHaveAttribute("data-side", "top");
  await expectInsideViewport(page);
  expect(
    await panel(page)
      .locator(".dm-popover__body")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 440 });
  await expectInsideViewport(page);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
});

test("anchored placement follows scrolling and resizing", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await mountPopover(page, { absolute: true });
  await page.evaluate(() => window.scrollTo(0, 850));
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await expectInsideViewport(page);
  const before = await panel(page).evaluate((element) =>
    parseFloat(element.style.top),
  );
  await page.evaluate(() => window.scrollBy(0, 100));
  await expect
    .poll(async () => {
      const after = await panel(page).evaluate((element) =>
        parseFloat(element.style.top),
      );
      return Math.round(before - after);
    })
    .toBe(100);
  await page.setViewportSize({ width: 320, height: 700 });
  await expectInsideViewport(page);
});

test("trigger handlers can prevent opening and disabled triggers stay closed", async ({
  page,
}) => {
  await mountPopover(page, { preventDefault: true });
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => (window as any).popoverTest.clicks)).toBe(1);
  expect(
    await page.evaluate(() => (window as any).popoverTest.changes),
  ).toEqual([]);
  await mountPopover(page, { disabled: true });
  await expect(trigger(page)).toBeDisabled();
  await trigger(page).evaluate((element: HTMLButtonElement) => element.click());
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("fallback portal keeps keyboard interaction and reduced-motion closing works", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, "showPopover", {
      configurable: true,
      value: undefined,
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await mountPopover(page);
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await expect(panel(page)).not.toHaveAttribute("data-native", "true");
  await expect(panel(page)).toHaveCSS("transition-duration", "0s");
  await expectInsideViewport(page);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(panel(page)).toHaveAttribute("data-state", "closed");
});

for (const fallback of [false, true]) {
  test(`a ${fallback ? "fallback" : "native"} popover at the modal's final control exits into the modal tab cycle`, async ({
    page,
  }) => {
    if (fallback) {
      await page.addInitScript(() => {
        Object.defineProperty(HTMLElement.prototype, "showPopover", {
          configurable: true,
          value: undefined,
        });
      });
    }
    await page.goto("/#layers");
    await page.evaluate(async () => {
      const reactModule = await import("/node_modules/.vite/deps/react.js");
      const React = reactModule.default ?? reactModule;
      const client =
        await import("/node_modules/.vite/deps/react-dom_client.js");
      const createRoot = client.createRoot ?? client.default.createRoot;
      const { Popover } = await import("/src/lib/popover.tsx");
      const { Dialog } = await import("/src/lib/components.tsx");
      const state = { closeRequests: 0 };
      (window as any).nestedPopoverTest = state;
      const host = document.createElement("section");
      document.body.append(host);
      createRoot(host).render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "button",
            { id: "outside-modal" },
            "Outside modal",
          ),
          React.createElement(
            Dialog,
            {
              open: true,
              title: "Popover tab cycle",
              onClose: () => state.closeRequests++,
            },
            React.createElement(
              "button",
              { id: "inside-before" },
              "Before details",
            ),
            React.createElement(
              Popover,
              {
                title: "Final control details",
                "data-testid": "nested-popover",
                trigger: React.createElement(
                  "button",
                  { id: "last-modal-trigger" },
                  "Last modal control",
                ),
              },
              React.createElement("input", { placeholder: "Nested thought" }),
            ),
          ),
        ),
      );
    });
    const modal = page.getByRole("dialog", {
      name: "Popover tab cycle",
      exact: true,
    });
    const nested = page.getByTestId("nested-popover");
    const lastTrigger = page.locator("#last-modal-trigger");
    await expect(modal).toHaveAttribute("data-state", "open");
    await lastTrigger.click();
    await expect(nested).toHaveAttribute("data-state", "open");
    await expect(nested.getByPlaceholder("Nested thought")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(lastTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(
      modal.getByRole("button", { name: "Close dialog", exact: true }),
    ).toBeFocused();
    await expect(modal).toHaveJSProperty("open", true);
    await page.waitForTimeout(300);
    await expect(
      modal.getByRole("button", { name: "Close dialog", exact: true }),
    ).toBeFocused();
    await lastTrigger.click();
    await expect(nested.getByPlaceholder("Nested thought")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      nested.getByRole("button", { name: "Close popover" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastTrigger).toBeFocused();
    await expect(lastTrigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#inside-before")).toBeFocused();
    await expect(modal).toHaveJSProperty("open", true);
    expect(
      await page.evaluate(
        () => (window as any).nestedPopoverTest.closeRequests,
      ),
    ).toBe(0);
  });
}

test("Escape on an open popover trigger dismisses it and respects another active modal", async ({
  page,
}) => {
  await mountPopover(page);
  await trigger(page).click();
  await expect(panel(page)).toHaveAttribute("data-state", "open");
  await trigger(page).focus();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => {
    const modal = document.createElement("div");
    modal.id = "separate-modal-owner";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText =
      "position:fixed;inset:20px;background:var(--dm-paper)";
    modal.textContent = "Another modal owns Escape until it is dismissed.";
    document.body.append(modal);
  });
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() =>
    document.querySelector("#separate-modal-owner")?.remove(),
  );
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toBeFocused();
  await expect(panel(page)).toHaveAttribute("data-state", "closed");
  expect(
    await page.evaluate(() => (window as any).popoverTest.changes),
  ).toEqual([true, false]);
});
