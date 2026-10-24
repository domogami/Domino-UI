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
  for (const region of await dialog
    .locator(
      ":scope > .dm-dialog__header, :scope > .dm-dialog__body, :scope > .dm-dialog__footer",
    )
    .all()) {
    await expect(region).toHaveCSS("transform", "none");
    await expect(region).toHaveCSS("opacity", "1");
    await expect(region).toHaveCSS("transition-duration", "0s");
    await expect(region).toHaveCSS("transition-delay", "0s");
  }
  expect(
    await dialog
      .locator(".dm-dialog__body")
      .evaluate((element) => getComputedStyle(element, "::before").opacity),
  ).toBe("0");
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

test("paper folds through coordinated hinges and crease shading on the same dialog nodes", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>(
      ".playground-canvas .dm-dialog",
    )!;
    const header = dialog.querySelector<HTMLElement>(".dm-dialog__header")!;
    const body = dialog.querySelector<HTMLElement>(".dm-dialog__body")!;
    const footer = dialog.querySelector<HTMLElement>(".dm-dialog__footer")!;
    const sample = () => ({
      shell: getComputedStyle(dialog).transform,
      shellOpacity: Number(getComputedStyle(dialog).opacity),
      headerDelay: getComputedStyle(header).transitionDelay,
      header: getComputedStyle(header).transform,
      body: getComputedStyle(body).transform,
      bodyFlat:
        getComputedStyle(body).transform === "none" ||
        new DOMMatrixReadOnly(getComputedStyle(body).transform).isIdentity,
      footer: getComputedStyle(footer).transform,
      headerOpacity: Number(getComputedStyle(header).opacity),
      bodyOpacity: Number(getComputedStyle(body).opacity),
      footerOpacity: Number(getComputedStyle(footer).opacity),
      crease: Number(getComputedStyle(body, "::before").opacity),
    });
    const watch = (state: "open" | "closing") =>
      new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (dialog.dataset.state !== state) return;
          observer.disconnect();
          const animations = dialog
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSTransition &&
                ["transform", "opacity"].includes(animation.transitionProperty),
            );
          const duration = Math.max(
            ...animations.map((animation) =>
              Number(animation.effect!.getComputedTiming().endTime),
            ),
          );
          animations.forEach((animation) => animation.pause());
          const seek = (time: number) => {
            animations.forEach((animation) => {
              animation.currentTime = time;
            });
            return sample();
          };
          const start = seek(0);
          const middle = seek(duration / 2);
          const end = seek(duration + 1);
          animations.forEach((animation) => animation.finish());
          resolve({
            duration,
            start,
            middle,
            end,
            regionsPersist:
              dialog.querySelector(".dm-dialog__header") === header &&
              dialog.querySelector(".dm-dialog__body") === body &&
              dialog.querySelector(".dm-dialog__footer") === footer,
            modal: dialog.matches(":modal"),
          });
        });
        observer.observe(dialog, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
      });
    (window as any).foldProbe = {
      opening: watch("open"),
      closing: watch("closing"),
    };
  });
  const opener = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Open a little conversation" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveClass(/dm-dialog--fold/);
  const opening = await page.evaluate(() => (window as any).foldProbe.opening);
  expect(opening.duration).toBeGreaterThanOrEqual(300);
  expect(opening.duration).toBeLessThanOrEqual(340);
  expect(opening.regionsPersist).toBe(true);
  expect(opening.modal).toBe(true);
  for (const region of ["shell", "header", "body", "footer"] as const) {
    expect(opening.start[region]).toContain("matrix3d");
    expect(opening.middle[region]).not.toBe(opening.start[region]);
    expect(opening.end[region]).toBe("none");
  }
  // The paper and lettering stay opaque; only the hinges and crease move.
  expect(opening.start.shellOpacity).toBe(1);
  for (const phase of [opening.start, opening.middle, opening.end]) {
    expect(phase.headerOpacity).toBe(1);
    expect(phase.bodyOpacity).toBe(1);
    expect(phase.footerOpacity).toBe(1);
    expect(phase.headerDelay).toBe("0s");
  }
  expect(opening.middle.header).toBe("none");
  expect(opening.middle.crease).toBeLessThan(opening.start.crease);
  expect(opening.end.crease).toBe(0);
  expect(opening.end.bodyOpacity).toBe(1);
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const closing = await page.evaluate(() => (window as any).foldProbe.closing);
  expect(closing.duration).toBeGreaterThanOrEqual(150);
  expect(closing.duration).toBeLessThanOrEqual(180);
  expect(closing.regionsPersist).toBe(true);
  expect(closing.modal).toBe(true);
  expect(closing.start.bodyFlat).toBe(true);
  expect(closing.middle.body).toContain("matrix3d");
  expect(closing.start.headerDelay).toBe("0s");
  expect(closing.middle.shellOpacity).toBeLessThanOrEqual(0.01);
  expect(closing.middle.headerOpacity).toBe(1);
  expect(closing.middle.bodyOpacity).toBe(1);
  expect(closing.middle.footerOpacity).toBe(1);
  expect(closing.end.crease).toBeGreaterThan(closing.start.crease);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("native modality waits for a longer owned fold phase before restoring focus", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page.addStyleTag({
    content:
      '.dm-dialog--fold[data-state="closing"] > .dm-dialog__footer { transition-duration: 600ms; }',
  });
  const opener = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Open a little conversation" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveCSS("transform", "none");
  await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>(
      ".playground-canvas .dm-dialog",
    )!;
    (window as any).lastFoldPhase = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (dialog.dataset.state !== "closing") return;
        observer.disconnect();
        const footer = dialog.querySelector(".dm-dialog__footer")!;
        const hinge = footer
          .getAnimations()
          .find(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === "transform",
          )!;
        hinge.finished.then(
          () => resolve({ completed: true, modal: dialog.matches(":modal") }),
          () => resolve({ completed: false, modal: dialog.matches(":modal") }),
        );
      });
      observer.observe(dialog, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });
  });
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).lastFoldPhase)).toEqual({
    completed: true,
    modal: true,
  });
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
