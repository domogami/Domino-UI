import { expect, test, type Page } from "@playwright/test";
import { entries } from "../src/catalog/entries";

type Theme = "light" | "hybrid" | "dark";

async function changeTheme(page: Page, theme: Theme) {
  await page
    .locator(".topbar")
    .getByRole("button", {
      name: `${theme[0].toUpperCase()}${theme.slice(1)} theme`,
      exact: true,
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function routeTo(page: Page, route: string) {
  await page.evaluate((value) => {
    location.hash = value;
  }, route);
  await expect(page).toHaveURL(
    new RegExp(`#${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
  // The hash updates before React commits; wait for the rendered navigation state.
  await expect(page.locator('.sidebar a[aria-current="page"]')).toHaveAttribute(
    "href",
    `#${route}`,
  );
}

test("hybrid is the first-visit default even with a dark operating system", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hybrid");
  await expect(
    page
      .locator(".topbar")
      .getByRole("button", { name: "Hybrid theme", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(239, 231, 215)",
  );
  await expect(page.locator(".sidebar")).toHaveCSS(
    "background-color",
    "rgb(43, 48, 52)",
  );
});

test("all three themes apply semantic colors and persist after reload", async ({
  page,
}) => {
  await page.goto("/");
  const themes = [
    {
      name: "light",
      paper: "#efe7d7",
      ink: "#252b2e",
      accent: "#0e7c79",
      sidebar: "rgb(240, 234, 221)",
      scheme: "light",
    },
    {
      name: "dark",
      paper: "#2b3034",
      ink: "#efe7d7",
      accent: "#b6cf8e",
      sidebar: "rgb(37, 43, 46)",
      scheme: "dark",
    },
    {
      name: "hybrid",
      paper: "#efe7d7",
      ink: "#252b2e",
      accent: "#0e7c79",
      sidebar: "rgb(43, 48, 52)",
      scheme: "light",
    },
  ] as const;
  for (const theme of themes) {
    await changeTheme(page, theme.name);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("domino-theme")))
      .toBe(theme.name);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );
    const tokens = await page.locator("html").evaluate((element) => {
      const css = getComputedStyle(element);
      return {
        paper: css.getPropertyValue("--dm-paper").trim(),
        ink: css.getPropertyValue("--dm-ink").trim(),
        accent: css.getPropertyValue("--dm-accent").trim(),
        scheme: css.colorScheme,
      };
    });
    expect(tokens).toEqual({
      paper: theme.paper,
      ink: theme.ink,
      accent: theme.accent,
      scheme: theme.scheme,
    });
    await expect(page.locator(".sidebar")).toHaveCSS(
      "background-color",
      theme.sidebar,
    );
  }
});

for (const theme of ["hybrid", "light", "dark"] as const) {
  test(`all ${entries.length} component pages have live examples without runtime errors in ${theme}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/#components");
    await changeTheme(page, theme);
    expect(entries.length).toBeGreaterThanOrEqual(41);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    await expect(page.locator(".component-tile")).toHaveCount(entries.length);
    for (const entry of entries) {
      await routeTo(page, `component/${entry.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        entry.name.replace(/\.$/, ""),
      );
      await expect(
        page.getByRole("tablist", {
          name: `${entry.name} documentation`,
          exact: true,
        }),
      ).toBeVisible();
      const example = page.locator(".playground-canvas");
      await expect(example).toBeVisible();
      expect(
        await example.locator(":scope > *").count(),
        `${entry.id} must have a dedicated preview`,
      ).toBeGreaterThan(0);
      await expect(
        example.getByText("A little room for an idea", { exact: true }),
      ).toHaveCount(0);
      expect(errors, `runtime errors after ${entry.id}`).toEqual([]);
    }
  });
}

test("both command shortcuts find linked results and expose a useful empty state", async ({
  page,
}) => {
  await page.goto("/");
  for (const shortcut of ["Control+k", "Meta+k"]) {
    await page.keyboard.press(shortcut);
    const search = page.getByRole("dialog", {
      name: "Find a little something",
      exact: true,
    });
    await expect(search).toBeVisible();
    const input = search.getByRole("textbox", {
      name: "Search the notebook",
      exact: true,
    });
    await expect(input).toBeFocused();
    await input.fill("button");
    await search.locator('a[href="#component/button"]').click();
    await expect(search).toBeHidden();
    await expect(page).toHaveURL(/#component\/button$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Button",
    );
  }
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", {
    name: "Find a little something",
    exact: true,
  });
  await search.getByRole("textbox").fill("no-such-notebook-piece-9381");
  await expect(
    search.getByText(
      "No matching pages. Try a shorter word, or browse the component index.",
    ),
  ).toBeVisible();
  await expect(search.locator(".search-results a")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
});

test("the gallery filters components and recovers from no matches", async ({
  page,
}) => {
  await page.goto("/#components");
  const filter = page.getByRole("textbox", {
    name: "Filter components",
    exact: true,
  });
  await filter.fill("sticky");
  await expect(page.locator(".component-tile")).toHaveCount(1);
  await expect(
    page.locator(".component-tile").getByRole("link"),
  ).toHaveAttribute("href", "#component/sticky-note");
  await filter.fill("unfindable-9381");
  await expect(page.locator(".component-tile")).toHaveCount(0);
  await expect(
    page.getByText("No pieces match that name. Try a shorter word."),
  ).toBeVisible();
  await filter.clear();
  await expect(page.locator(".component-tile")).toHaveCount(entries.length);
});

test("mobile navigation opens, closes with Escape, and restores opener focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const opener = page.locator(".mobile-nav-toggle");
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".navigation-shell")
      .evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  await expect(opener).toBeFocused();
});

test("the actual dialog supports Escape and restores focus to its opener", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  const opener = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Open a little conversation" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await dialog
    .getByRole("textbox", { name: "Note title" })
    .fill("A keyboard-first note");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("dropdown arrows navigate actions and Escape restores trigger focus", async ({
  page,
}) => {
  await page.goto("/#component/dropdown-menu");
  const canvas = page.locator(".playground-canvas");
  const trigger = canvas.getByRole("button", {
    name: "Note actions",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = canvas.getByRole("menu", { name: "Note actions", exact: true });
  await expect(menu).toBeVisible();
  await expect(
    menu.getByRole("menuitem", { name: "Bookmark note", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    menu.getByRole("menuitem", { name: "Copy a thought", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    menu.getByRole("menuitem", { name: "Archive note", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("component tabs select panels with arrow keys and Home", async ({
  page,
}) => {
  await page.goto("/#component/tabs");
  const canvas = page.locator(".playground-canvas");
  const list = canvas.getByRole("tablist", {
    name: "Notebook views",
    exact: true,
  });
  const notes = list.getByRole("tab", { name: "Notes", exact: true });
  const ideas = list.getByRole("tab", { name: "Ideas", exact: true });
  await expect(notes).toHaveAttribute("aria-selected", "true");
  await notes.focus();
  await page.keyboard.press("ArrowRight");
  await expect(ideas).toBeFocused();
  await expect(ideas).toHaveAttribute("aria-selected", "true");
  await expect(
    canvas.getByRole("tabpanel", { name: "Ideas", exact: true }),
  ).toContainText("Loose beginnings.");
  await expect(canvas.locator('[role="tabpanel"]').nth(0)).toBeHidden();
  await page.keyboard.press("Home");
  await expect(notes).toBeFocused();
  await expect(
    canvas.getByRole("tabpanel", { name: "Notes", exact: true }),
  ).toBeVisible();
});

test("checkbox and switch demos maintain native checked state", async ({
  page,
}) => {
  await page.goto("/#component/checkbox");
  const checkbox = page
    .locator(".playground-canvas")
    .getByRole("checkbox", { name: "Leave room for curiosity", exact: true });
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await routeTo(page, "component/switch");
  const control = page
    .locator(".playground-canvas")
    .getByRole("switch", { name: "Quiet motion", exact: true });
  await expect(control).not.toBeChecked();
  await control.locator("..").click();
  await expect(control).toBeChecked();
  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).not.toBeChecked();
});

test("signature patterns disclose notes, order milestones, cycle photos and collect petals", async ({
  page,
}) => {
  await page.goto("/#component/annotation");
  let canvas = page.locator(".playground-canvas");
  const disclosure = canvas.locator("summary");
  await expect(
    canvas.getByText("Keep the things that make you curious."),
  ).toBeVisible();
  await disclosure.focus();
  await page.keyboard.press("Space");
  await expect(
    canvas.getByText("Keep the things that make you curious."),
  ).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(
    canvas.getByText("Keep the things that make you curious."),
  ).toBeVisible();

  await routeTo(page, "component/timeline");
  canvas = page.locator(".playground-canvas");
  const timeline = canvas.getByRole("list", {
    name: "An illustrative creative process",
    exact: true,
  });
  await expect(timeline.getByRole("listitem")).toHaveCount(3);
  await expect(timeline.getByRole("heading", { level: 3 }).first()).toHaveText(
    "A small idea",
  );

  await routeTo(page, "component/polaroid-stack");
  canvas = page.locator(".playground-canvas");
  const photo = canvas.locator(".dm-polaroid-stack__surface");
  await expect(photo).toHaveAttribute("aria-label", /Showing photo 1 of 2/);
  await photo.focus();
  await page.keyboard.press("ArrowRight");
  await expect(photo).toHaveAttribute("aria-label", /Showing photo 2 of 2/);
  await expect(
    photo.locator('.dm-polaroid-stack__photo[data-current="true"] img'),
  ).toHaveAttribute("src", /snap75-desk\.jpg$/);
  await expect(canvas.locator(".dm-polaroid-stack")).toHaveAttribute(
    "data-state",
    "idle",
  );
  await canvas.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(photo).toHaveAttribute("aria-label", /Showing photo 1 of 2/);

  await routeTo(page, "component/flower-progress");
  canvas = page.locator(".playground-canvas");
  const flower = canvas.getByRole("progressbar", {
    name: "Ideas taking root",
    exact: true,
  });
  const before = Number(await flower.getAttribute("aria-valuenow"));
  const maximum = Number(await flower.getAttribute("aria-valuemax"));
  await canvas
    .getByRole("button", { name: "Find another petal", exact: true })
    .click();
  await expect(flower).toHaveAttribute(
    "aria-valuenow",
    String((before + 1) % (maximum + 1)),
  );
  await expect(flower.locator(".dm-flower-progress__petal--found")).toHaveCount(
    (before + 1) % (maximum + 1),
  );
});

async function assertFinishedName(page: Page) {
  const name = page.locator(".playground-canvas .dm-hero-name");
  await expect(name).toBeVisible();
  await expect(name).toHaveAccessibleName("Dom Lee.");
  const appearance = await name.evaluate((element) => {
    const sweep = element.querySelector(".dm-hero-name-sweep")!;
    const dot = element.querySelector(".dm-hero-name-period")!;
    const ink = element.querySelector("g path")!;
    return {
      sweep: getComputedStyle(sweep).transform,
      dotOpacity: getComputedStyle(dot).opacity,
      inkOpacity: getComputedStyle(ink).opacity,
      activeAnimations: element.getAnimations({ subtree: true }).length,
    };
  });
  expect(appearance).toEqual({
    sweep: "none",
    dotOpacity: "1",
    inkOpacity: "1",
    activeAnimations: 0,
  });
}

test("quiet motion exposes the finished name immediately and keeps replay quiet", async ({
  page,
}) => {
  await page.goto("/#component/hero-name");
  const quiet = page
    .locator(".motion-controls")
    .getByRole("switch", { name: "Quiet motion", exact: true });
  await quiet.focus();
  await page.keyboard.press("Space");
  await expect(
    page.locator(".playground-canvas .dm-hero-name"),
  ).toHaveAttribute("data-animate", "false");
  await assertFinishedName(page);
  await page
    .locator(".motion-controls")
    .getByRole("button", { name: "Replay", exact: true })
    .click();
  await assertFinishedName(page);
});

test("reduced motion exposes final name artwork and independent instances have unique clips", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/hero-name");
  await assertFinishedName(page);
  // Mount the real source component twice through Vite, exercising useId across instances.
  await page.evaluate(
    async ({ reactUrl, rootUrl, brandUrl }) => {
      const [reactModule, rootModule, { HeroName }] = await Promise.all([
        import(reactUrl),
        import(rootUrl),
        import(brandUrl),
      ]);
      // Vite's CommonJS prebundles expose React and ReactDOM through default.
      const { createElement } = reactModule.default ?? reactModule;
      const { createRoot } = rootModule.default ?? rootModule;
      const mount = document.createElement("div");
      mount.id = "brand-regression-mount";
      mount.style.fontSize = "48px";
      document.body.append(mount);
      // React requires a unique prefix for independent roots; the two specimens
      // within this root must still generate their own distinct instance IDs.
      createRoot(mount, { identifierPrefix: "brand-regression-" }).render(
        createElement(
          "div",
          null,
          createElement(HeroName, { animate: false }),
          createElement(HeroName, { animate: false }),
        ),
      );
    },
    {
      reactUrl: "/node_modules/.vite/deps/react.js",
      rootUrl: "/node_modules/.vite/deps/react-dom_client.js",
      brandUrl: "/src/lib/brand.tsx",
    },
  );
  await expect(
    page.locator("#brand-regression-mount .dm-hero-name"),
  ).toHaveCount(2);
  const clips = await page.locator(".dm-hero-name").evaluateAll((elements) =>
    elements.map((element) => {
      const clip = element.querySelector("clipPath")!;
      const fill = element.querySelector("g path")!;
      return { id: clip.id, reference: fill.getAttribute("clip-path") };
    }),
  );
  expect(clips).toHaveLength(3);
  expect(new Set(clips.map((clip) => clip.id)).size).toBe(clips.length);
  for (const clip of clips) expect(clip.reference).toBe(`url(#${clip.id})`);
});

for (const width of [320, 390, 768, 1440]) {
  test(`notebook and component pages avoid horizontal page overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const routes = [
      "overview",
      "components",
      "colors",
      "typography",
      "spacing",
      "style-guide",
      "motion",
      "getting-started",
      "haptics",
      "component/table",
      "component/dialog",
      "component/hero-name",
      "component/brand-banner",
      "component/input",
      "component/tabs",
    ];
    for (const route of routes) {
      await routeTo(page, route);
      if (route.startsWith("component/"))
        await expect(page.locator(".playground-canvas")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth,
              ),
            ),
          { message: `horizontal overflow on ${route} at ${width}px` },
        )
        .toBeLessThanOrEqual(width + 1);
    }
  });
}
