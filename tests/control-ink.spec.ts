import { expect, test, type Page } from "@playwright/test";

async function mountControls(page: Page) {
  await page.goto("/#component/checkbox");
  await page.evaluate(async () => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { Checkbox, IconButton, RadioGroup } =
      await import("/src/lib/components.tsx");
    const { TaskCheckbox } = await import("/src/lib/task-checkbox.tsx");
    const target = window as any;
    target.controlFixture?.root.unmount();
    document.querySelector("#control-ink-host")?.remove();
    const host = document.createElement("section");
    host.id = "control-ink-host";
    host.style.cssText =
      "position:relative;z-index:100;width:calc(100% - 32px);max-width:580px;box-sizing:border-box;margin:32px auto;padding:24px;background:var(--dm-paper);color:var(--dm-ink)";
    document.body.append(host);
    const state: any = { changes: [], clicks: 0 };
    target.controlFixture = state;
    const e = React.createElement;
    const icon = e(
      "svg",
      {
        viewBox: "0 0 24 24",
        width: 20,
        height: 20,
        fill: "none",
        stroke: "currentColor",
        "aria-hidden": true,
      },
      e("path", { d: "M12 20 3 11C-2 3 8 0 12 6c4-6 14-3 9 5Z" }),
    );
    function Fixture() {
      const [quiet, setQuiet] = React.useState(false);
      const [value, setValue] = React.useState("ink");
      state.setQuiet = setQuiet;
      state.setValue = setValue;
      const mixed = React.useRef(null);
      React.useEffect(() => {
        mixed.current.indeterminate = true;
      }, []);
      return e(
        "form",
        { id: "control-ink-form", style: { display: "grid", gap: 20 } },
        e(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 14 } },
          ...(["sm", "md", "lg"] as const).map((size) =>
            e(
              IconButton,
              { key: size, label: `Save ${size}`, size, variant: "secondary" },
              icon,
            ),
          ),
          e(IconButton, { label: "Saving", loading: true }, icon),
          e(
            IconButton,
            {
              label: "Unavailable action",
              disabled: true,
              onClick: () => state.clicks++,
            },
            icon,
          ),
        ),
        e(Checkbox, {
          id: "regular-ink",
          label: "Keep this idea close",
          description: "A description stays below its own label.",
          name: "keep",
          value: "yes",
        }),
        e(Checkbox, {
          id: "mixed-ink",
          ref: mixed,
          label: "Some ideas selected",
        }),
        e(Checkbox, {
          id: "disabled-ink",
          label: "Unavailable choice",
          disabled: true,
        }),
        e(
          "div",
          { style: { width: 190, maxWidth: "100%" } },
          e(Checkbox, {
            id: "wrapped-ink",
            label:
              "A longer handwritten choice that wraps without shifting its description",
            description: "A quiet note wraps underneath the words.",
          }),
        ),
        e(TaskCheckbox, {
          id: "task-ink",
          label: "Finish the notebook task",
          defaultChecked: true,
        }),
        e(RadioGroup, {
          label: "Reading pace",
          name: "pace",
          defaultValue: "slow",
          quiet,
          required: true,
          options: [
            { value: "slow", label: "Slow and steady" },
            { value: "skip", label: "Unavailable pace", disabled: true },
            {
              value: "quick",
              label: "A quick look",
              description: "Then linger.",
            },
          ],
          onValueChange: (next: string) => state.changes.push(next),
        }),
        e(RadioGroup, {
          label: "Notebook ink",
          name: "ink",
          value,
          quiet,
          options: [
            { value: "ink", label: "Ink" },
            { value: "teal", label: "Teal" },
          ],
          onValueChange: setValue,
        }),
      );
    }
    state.root = createRoot(host);
    state.root.render(e(Fixture));
  });
  await expect(page.locator("#control-ink-form")).toBeVisible();
  await page.locator("#control-ink-host").scrollIntoViewIfNeeded();
}

test("icon controls stay square and their actual SVGs are centered at every size", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await mountControls(page);
    for (const [size, side] of [
      ["sm", 36],
      ["md", 44],
      ["lg", 50],
    ] as const) {
      const metrics = await page
        .getByRole("button", { name: `Save ${size}` })
        .evaluate((button) => {
          const box = button.getBoundingClientRect();
          const ink = button.querySelector("svg")!.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            x: ink.x + ink.width / 2 - (box.x + box.width / 2),
            y: ink.y + ink.height / 2 - (box.y + box.height / 2),
          };
        });
      expect(metrics.width).toBe(side);
      expect(metrics.height).toBe(side);
      expect(Math.abs(metrics.x)).toBeLessThan(0.2);
      expect(Math.abs(metrics.y)).toBeLessThan(0.2);
    }
    const loading = page.getByRole("button", { name: "Saving" });
    await expect(loading).toBeDisabled();
    await expect(loading.locator(".dm-icon-button__icon")).toHaveCount(0);
    await expect(loading.locator(".dm-spinner")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Unavailable action" }),
    ).toBeDisabled();
  }
});

test("checkbox shares the task pen geometry while independent choice text stays clean", async ({
  page,
}) => {
  await mountControls(page);
  const checkbox = page.getByRole("checkbox", { name: "Keep this idea close" });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  const result = await page.evaluate(() => {
    const ordinary = document.querySelector<HTMLInputElement>("#regular-ink")!;
    const task = document.querySelector<HTMLInputElement>(
      ".dm-task-checkbox__input",
    )!;
    const ordinaryStyle = getComputedStyle(ordinary);
    const taskStyle = getComputedStyle(task);
    const copy = ordinary.nextElementSibling!;
    const title = copy.querySelector(".dm-choice__label")!;
    const description = copy.querySelector(".dm-choice__description")!;
    return {
      mask: ordinaryStyle.getPropertyValue("--dm-checkbox-check-mask"),
      taskMask: taskStyle.getPropertyValue("--dm-checkbox-check-mask"),
      radius: ordinaryStyle.borderRadius,
      taskRadius: taskStyle.borderRadius,
      textBackground: getComputedStyle(title).backgroundImage,
      textDecoration: getComputedStyle(title).textDecorationLine,
      labelLeft: title.getBoundingClientRect().left,
      descriptionLeft: description.getBoundingClientRect().left,
      descriptionTop: description.getBoundingClientRect().top,
      titleBottom: title.getBoundingClientRect().bottom,
    };
  });
  expect(result.mask).toContain("M3 12Q6 15 9 19Q14 10 22 3");
  expect(result.mask).toBe(result.taskMask);
  expect(result.radius).toBe(result.taskRadius);
  expect(result.textBackground).toBe("none");
  expect(result.textDecoration).toBe("none");
  expect(result.labelLeft).toBe(result.descriptionLeft);
  expect(result.descriptionTop).toBeGreaterThan(result.titleBottom);
  await expect(page.locator("#regular-ink")).toHaveAccessibleDescription(
    "A description stays below its own label.",
  );
  await expect(page.locator("#mixed-ink")).toBeChecked({ indeterminate: true });
  await expect
    .poll(() =>
      page.locator("#mixed-ink").evaluate((input) => {
        const matrix = new DOMMatrixReadOnly(
          getComputedStyle(input, "::before").transform,
        );
        return Math.hypot(matrix.a, matrix.b);
      }),
    )
    .toBeCloseTo(1, 3);
  const mixedPaint = await page.locator("#mixed-ink").evaluate((input) => ({
    dash: getComputedStyle(input, "::before").transform,
    check: getComputedStyle(input, "::after").clipPath,
  }));
  expect(mixedPaint.dash).not.toBe("none");
  expect(mixedPaint.check).toBe("inset(0px 100% 0px 0px)");
  await expect(
    page.getByRole("checkbox", { name: "Unavailable choice" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() =>
      new FormData(document.querySelector("#control-ink-form")!).get("keep"),
    ),
  ).toBe("yes");
  await page.locator("#control-ink-host").screenshot({
    path: test.info().outputPath("checkbox-ink.png"),
  });
});

test("real dialog close controls retain a centered 44px target on desktop and mobile", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#component/dialog");
    await page
      .getByRole("button", { name: "Open a little conversation" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Keep this thought?" });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate(
          (element) => element.getAnimations({ subtree: true }).length,
        ),
      )
      .toBe(0);
    const close = dialog.getByRole("button", { name: "Close dialog" });
    const metrics = await close.evaluate((button) => {
      const box = button.getBoundingClientRect();
      const icon = button.querySelector("svg")!.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        x: icon.x + icon.width / 2 - box.x - box.width / 2,
        y: icon.y + icon.height / 2 - box.y - box.height / 2,
      };
    });
    expect(metrics.width).toBe(44);
    expect(metrics.height).toBe(44);
    expect(Math.abs(metrics.x)).toBeLessThan(0.2);
    expect(Math.abs(metrics.y)).toBeLessThan(0.2);
    await close.click();
    await expect(dialog).not.toBeVisible();
    await page.goto("/#component/toast");
    const dismiss = page.getByRole("button", { name: "Dismiss notification" });
    await expect(dismiss).toBeVisible();
    const toastBox = (await dismiss.boundingBox())!;
    expect(toastBox.width).toBe(44);
    expect(toastBox.height).toBe(44);
  }
});

test("native radio keyboard selection skips disabled options and controlled changes remain native", async ({
  page,
}) => {
  await mountControls(page);
  const slow = page.getByRole("radio", { name: "Slow and steady" });
  const quick = page.getByRole("radio", { name: "A quick look" });
  await slow.focus();
  await page.keyboard.press("ArrowDown");
  await expect(quick).toBeChecked();
  await expect(quick).toBeFocused();
  await expect(slow).not.toBeChecked();
  expect(
    await page.evaluate(() => (window as any).controlFixture.changes),
  ).toEqual(["quick"]);
  await page.getByRole("radio", { name: "Teal", exact: true }).check();
  await expect(
    page.getByRole("radio", { name: "Teal", exact: true }),
  ).toBeChecked();
  await page.evaluate(() => (window as any).controlFixture.setValue("ink"));
  await expect(
    page.getByRole("radio", { name: "Ink", exact: true }),
  ).toBeChecked();
  expect(
    await page.evaluate(() =>
      new FormData(document.querySelector("#control-ink-form")!).get("pace"),
    ),
  ).toBe("quick");
});

test("radio ink blooms, settles to a compact dot and reverses without replacing its input", async ({
  page,
}) => {
  await mountControls(page);
  const quick = page.getByRole("radio", { name: "A quick look" });
  const handle = await quick.elementHandle();
  await quick.check();
  const middle = await quick.evaluate(async (input) => {
    await new Promise(requestAnimationFrame);
    const animations = input.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 140;
    }
    const bloom = getComputedStyle(input, "::before");
    const dot = getComputedStyle(input, "::after");
    return {
      names: animations.map((animation) =>
        "animationName" in animation ? animation.animationName : "transition",
      ),
      opacity: Number(bloom.opacity),
      dot: dot.transform,
      bloom: bloom.transform,
    };
  });
  expect(middle.names).toContain("dm-radio-ink-bloom");
  expect(middle.opacity).toBeGreaterThan(0.1);
  expect(middle.bloom).not.toBe("matrix(0.2, 0, 0, 0.2, 0, 0)");
  expect(middle.dot).not.toBe("matrix(0, 0, 0, 0, 0, 0)");
  await quick.evaluate((input) =>
    input
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish()),
  );
  const finished = await quick.evaluate((input) => ({
    opacity: getComputedStyle(input, "::before").opacity,
    dot: getComputedStyle(input, "::after").transform,
    animations: input.getAnimations({ subtree: true }).length,
  }));
  expect(finished.opacity).toBe("0");
  expect(finished.dot).toBe("matrix(0.72, 0, 0, 0.72, 0, 0)");
  expect(finished.animations).toBe(0);
  const bounds = (await quick.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await expect
    .poll(() =>
      quick.evaluate(
        (input) => new DOMMatrixReadOnly(getComputedStyle(input).transform).a,
      ),
    )
    .toBeLessThan(0.95);
  await page.mouse.up();
  await page.getByRole("radio", { name: "Slow and steady" }).check();
  const reversed = await quick.evaluate(async (input) => {
    await new Promise(requestAnimationFrame);
    return input
      .getAnimations({ subtree: true })
      .some(
        (animation) =>
          "transitionProperty" in animation &&
          animation.transitionProperty === "transform",
      );
  });
  expect(reversed).toBe(true);
  await expect(quick).not.toBeChecked();
  expect(
    await handle!.evaluate(
      (input) =>
        input === document.querySelector('[name="pace"][value="quick"]'),
    ),
  ).toBe(true);
});

test("quiet and reduced motion show finished control ink immediately", async ({
  page,
}) => {
  await mountControls(page);
  await page.evaluate(() => (window as any).controlFixture.setQuiet(true));
  await expect(
    page.getByRole("group", { name: "Reading pace" }),
  ).toHaveAttribute("data-quiet", "true");
  const quick = page.getByRole("radio", { name: "A quick look" });
  await quick.check();
  expect(await quick.evaluate((input) => input.getAnimations().length)).toBe(0);
  expect(
    await quick.evaluate(
      (input) => getComputedStyle(input, "::after").transform,
    ),
  ).toBe("matrix(0.72, 0, 0, 0.72, 0, 0)");
  const quietBounds = (await quick.boundingBox())!;
  await page.mouse.move(
    quietBounds.x + quietBounds.width / 2,
    quietBounds.y + quietBounds.height / 2,
  );
  await page.mouse.down();
  expect(
    await quick.evaluate((input) => getComputedStyle(input).transform),
  ).toBe("none");
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => (window as any).controlFixture.setQuiet(false));
  await expect(
    page.getByRole("group", { name: "Reading pace" }),
  ).not.toHaveAttribute("data-quiet");
  const immediateReduced = await page
    .getByRole("radio", { name: "Slow and steady" })
    .evaluate((input: HTMLInputElement) => {
      input.click();
      return {
        checked: input.checked,
        animationName: getComputedStyle(input, "::before").animationName,
        runningBloom: input
          .getAnimations({ subtree: true })
          .filter(
            (animation) =>
              "animationName" in animation &&
              animation.animationName === "dm-radio-ink-bloom" &&
              animation.playState === "running",
          ).length,
      };
    });
  expect(immediateReduced).toEqual({
    checked: true,
    animationName: "none",
    runningBloom: 0,
  });
  await page.getByRole("radio", { name: "Slow and steady" }).check();
  const checkbox = page.getByRole("checkbox", { name: "Keep this idea close" });
  await checkbox.check();
  expect(
    await checkbox.evaluate(
      (input) => getComputedStyle(input, "::after").clipPath,
    ),
  ).toBe("inset(0px)");
  expect(
    await page
      .locator("#control-ink-form")
      .evaluate(
        (form) =>
          form
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running").length,
      ),
  ).toBe(0);
});
