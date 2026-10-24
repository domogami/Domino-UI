import { expect, test } from "@playwright/test";

test("a paper dialog keeps native modality through its exit and restores the opener", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const modalDuringExit = await dialog.evaluate(
    (element) =>
      new Promise<boolean>((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("data-state") !== "closing") return;
          observer.disconnect();
          resolve(
            element.matches(":modal") &&
              getComputedStyle(document.body).overflow === "hidden",
          );
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
        (
          element.querySelector(
            '[aria-label="Close dialog"]',
          ) as HTMLButtonElement
        ).click();
      }),
  );
  expect(modalDuringExit).toBe(true);
  await expect(dialog).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(opener).toBeFocused();
  // A completed close must not leave a stale closing state on the next opening.
  await opener.click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("opacity", "1");
});

test("reduced motion closes without a visual exit and backdrop presses dismiss once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await expect(dialog).toHaveCSS("transform", "none");
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a controlled reopen reverses the exit without losing native modality", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  // Simulate a parent changing its controlled value before the exit completes.
  // The page is intentionally inert here, so use the existing parent's handler.
  await dialog.evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("data-state") !== "closing") return;
          observer.disconnect();
          const button = [
            ...document.querySelectorAll<HTMLButtonElement>(
              ".playground-canvas button",
            ),
          ].find((candidate) =>
            candidate.textContent?.includes("Open a little conversation"),
          )!;
          button.click();
          resolve();
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
        (
          element.querySelector(
            '[aria-label="Close dialog"]',
          ) as HTMLButtonElement
        ).click();
      }),
  );
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(300);
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a selection that begins on the paper cannot dismiss it by ending outside", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  const input = await dialog
    .getByRole("textbox", { name: "Note title" })
    .boundingBox();
  expect(input).not.toBeNull();
  await page.mouse.move(input!.x + 20, input!.y + input!.height / 2);
  await page.mouse.down();
  await page.mouse.move(8, 8);
  await page.mouse.up();
  await expect(dialog).toHaveAttribute("data-state", "open");
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();
});

test("paper remains usable in a short narrow viewport and only its body scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transform", "none");
  await dialog.locator(".dm-dialog__body").evaluate((body) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "A long thought worth keeping. ".repeat(90);
    body.append(paragraph);
  });
  const measurements = await dialog.evaluate((element) => {
    const body = element.querySelector(".dm-dialog__body") as HTMLElement;
    const header = element.querySelector(".dm-dialog__header") as HTMLElement;
    const heading = header.querySelector("h2")!.getBoundingClientRect();
    const description = header.querySelector("p")!.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const close = header.querySelector("button")!.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const footer = element
      .querySelector(".dm-dialog__footer")!
      .getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      footerBottom: footer.bottom,
      bodyScrolls: body.scrollHeight > body.clientHeight,
      outerScrolls: element.scrollHeight > element.clientHeight,
      headerScrolls: header.scrollHeight > header.clientHeight,
      fullHeaderFits:
        heading.top >= headerRect.top &&
        description.bottom <= headerRect.bottom,
      closeWidth: close.width,
      closeHeight: close.height,
    };
  });
  expect(measurements.width).toBeLessThanOrEqual(276);
  expect(measurements.left).toBeGreaterThanOrEqual(0);
  expect(measurements.top).toBeGreaterThanOrEqual(0);
  expect(measurements.bottom).toBeLessThanOrEqual(450);
  expect(measurements.footerBottom).toBeLessThanOrEqual(450);
  expect(measurements.bodyScrolls).toBe(true);
  expect(measurements.outerScrolls).toBe(false);
  expect(measurements.headerScrolls).toBe(false);
  expect(measurements.fullHeaderFits).toBe(true);
  expect(measurements.closeWidth).toBeGreaterThanOrEqual(44);
  expect(measurements.closeHeight).toBeGreaterThanOrEqual(44);
  await expect(
    dialog.getByRole("button", { name: "Save note", exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole("heading", { name: "Keep this thought?", exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByText("A small place for something worth remembering.", {
      exact: true,
    }),
  ).toBeInViewport();
});

test("a long header remains readable by scrolling while its close and actions stay available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transform", "none");
  const scrollState = await dialog
    .locator(".dm-dialog__header")
    .evaluate((header) => {
      header.querySelector("p")!.textContent =
        "A long description that stays readable on its own sheet of paper. ".repeat(
          20,
        );
      header.scrollTop = header.scrollHeight;
      return {
        scrolls: header.scrollHeight > header.clientHeight,
        reachedEnd:
          header.scrollTop + header.clientHeight >= header.scrollHeight - 1,
        closeVisible:
          header.querySelector("button")!.getBoundingClientRect().top >=
          header.getBoundingClientRect().top,
      };
    });
  expect(scrollState.scrolls).toBe(true);
  expect(scrollState.reachedEnd).toBe(true);
  expect(scrollState.closeVisible).toBe(true);
  expect(
    await dialog.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(false);
  await expect(
    dialog.getByRole("button", { name: "Save note", exact: true }),
  ).toBeInViewport();
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(dialog).toBeHidden();
});

test("Escape dismisses the nested margin before its modal and restores each opener", async ({
  page,
}) => {
  await page.goto("/#layers");
  const opener = page.getByRole("button", { name: "Open layered modal" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  const marginOpener = dialog.getByRole("button", {
    name: "Why give it a name?",
  });
  await marginOpener.click();
  const margin = page.getByRole("dialog", {
    name: "A name is just a starting point",
    exact: true,
  });
  await expect(margin).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(margin).toBeHidden();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(marginOpener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
