import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page, options: Record<string, unknown> = {}) {
  await page.goto("/#component/waveform");
  await page.evaluate(async options => {
    const module = await import("/node_modules/.vite/deps/react.js");
    const React = module.default ?? module;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const { Waveform } = await import("/src/lib/waveform.tsx");
    const host = document.createElement("div"); host.id = "waveform-fixture-host";
    host.style.cssText = "width:min(240px,calc(100vw - 32px));margin:24px auto;background:var(--dm-paper)";
    document.body.append(host);
    const root = (client.createRoot ?? client.default.createRoot)(host);
    let props = { id: "waveform-fixture", className: "consumer-waveform", "data-consumer": "kept", ...options };
    const render = () => root.render(React.createElement(Waveform, props));
    (window as any).waveformFixture = {
      update(patch: object) { props = { ...props, ...patch }; render(); },
      unmount() { root.unmount(); host.remove(); },
    };
    render();
  }, options);
  const waveform = page.locator("#waveform-fixture");
  await expect(waveform).toBeVisible(); return waveform;
}

test("the catalog example controls only its ink and displays both themes without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/#component/waveform");
  const mark = page.locator('.waveform-demo [data-example="original"]');
  await expect(mark).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Toggle waveform motion", exact: true }).click();
  await expect(mark).toHaveAttribute("data-playing", "true");
  const samples = page.getByRole("img", { name: "Illustrative amplitude envelope", exact: true });
  await expect(samples).toHaveCount(2);
  const colors = await samples.evaluateAll(elements => elements.map(element => getComputedStyle(element).color));
  expect(colors[0]).not.toBe(colors[1]);
  for (const sample of await samples.all()) {
    expect(await sample.evaluate(element => element.getBoundingClientRect().width <= element.parentElement!.getBoundingClientRect().width)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.locator(".waveform-demo audio, .waveform-demo video, .waveform-demo iframe")).toHaveCount(0);
});

test("only confirmed playing moves the accent while paused geometry remains complete and stable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const mark = await fixture(page), trace = mark.locator(".dm-waveform__trace"), ink = mark.locator(".dm-waveform__ink");
  const geometry = await ink.getAttribute("d");
  await expect(trace).toHaveCSS("animation-play-state", "paused");
  await expect(ink).toHaveCSS("stroke-width", "1.15px");
  await page.evaluate(() => (window as any).waveformFixture.update({ playing: true }));
  await expect(trace).toHaveCSS("animation-play-state", "running");
  const before = await trace.evaluate(element => Number(element.getAnimations()[0].currentTime));
  await expect.poll(() => trace.evaluate(element => Number(element.getAnimations()[0].currentTime))).toBeGreaterThan(before + 30);
  await page.evaluate(() => (window as any).waveformFixture.update({ playing: false }));
  await expect(trace).toHaveCSS("animation-play-state", "paused");
  const paused = await trace.evaluate(element => Number(element.getAnimations()[0].currentTime));
  await page.waitForTimeout(120);
  expect(await trace.evaluate(element => Number(element.getAnimations()[0].currentTime))).toBe(paused);
  expect(await ink.getAttribute("d")).toBe(geometry);
  await page.evaluate(() => (window as any).waveformFixture.unmount());
  await expect(mark).toHaveCount(0);
});

test("supplied samples are bounded, finite and capped without changing the stable default sketch", async ({ page }) => {
  const mark = await fixture(page), ink = mark.locator(".dm-waveform__ink");
  const original = await ink.getAttribute("d");
  await page.evaluate(() => (window as any).waveformFixture.update({ samples: [-2, Number.NaN, Number.POSITIVE_INFINITY, 2, .5] }));
  await expect(mark).toHaveAttribute("data-source", "samples");
  expect(await ink.getAttribute("d")).not.toMatch(/NaN|Infinity/);
  const box = await ink.evaluate(element => { const rect = (element as SVGGraphicsElement).getBBox(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; });
  expect(box.x).toBeGreaterThanOrEqual(4); expect(box.x + box.width).toBeLessThanOrEqual(316);
  expect(box.y).toBeGreaterThanOrEqual(7); expect(box.y + box.height).toBeLessThanOrEqual(57);
  await page.evaluate(() => (window as any).waveformFixture.update({ samples: Array.from({ length: 10000 }, (_, index) => index % 10 / 10) }));
  expect((await ink.getAttribute("d"))!.match(/C/g)).toHaveLength(127);
  await page.evaluate(() => (window as any).waveformFixture.update({ samples: [] }));
  await expect(mark).toHaveAttribute("data-source", "sketch"); expect(await ink.getAttribute("d")).toBe(original);
});

test("decorative marks stay noninteractive and meaningful graphics require an explicit label", async ({ page }) => {
  const mark = await fixture(page, { "aria-hidden": false, role: "button", tabIndex: 0, label: "Unrequested name", width: 180, height: 24 });
  await expect(mark).toHaveClass(/consumer-waveform/); await expect(mark).toHaveAttribute("data-consumer", "kept");
  await expect(mark).toHaveAttribute("aria-hidden", "true"); await expect(mark).not.toHaveAttribute("tabindex");
  await expect(mark).not.toHaveAttribute("role", "button"); await expect(mark).not.toHaveAttribute("aria-label");
  await expect(mark).toHaveCSS("width", "180px"); await expect(mark).toHaveCSS("height", "24px");
  await mark.evaluate(element => (element as HTMLElement).focus()); await expect(mark).not.toBeFocused();
  await page.evaluate(() => (window as any).waveformFixture.update({ decorative: false, label: " " }));
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  await page.evaluate(() => (window as any).waveformFixture.update({ decorative: false, label: "Recording amplitude envelope", samples: [0, .8, .2, .6, 0] }));
  await expect(page.getByRole("img", { name: "Recording amplitude envelope", exact: true })).toBeVisible();
  await expect(mark).not.toHaveAttribute("inert"); await expect(mark).not.toHaveAttribute("aria-hidden");
  await expect(mark.locator("svg")).toHaveAttribute("focusable", "false");
  await expect(mark).toHaveCSS("pointer-events", "none");
});

test("quiet, reduced motion and print retain static complete ink", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const mark = await fixture(page, { playing: true, quiet: true }), trace = mark.locator(".dm-waveform__trace"), ink = mark.locator(".dm-waveform__ink");
  const path = await ink.getAttribute("d"); await expect(trace).toHaveCSS("animation-name", "none");
  await page.evaluate(() => (window as any).waveformFixture.update({ quiet: false }));
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(trace).toHaveCSS("animation-name", "none");
  expect(await ink.getAttribute("d")).toBe(path);
  await page.emulateMedia({ reducedMotion: "no-preference", media: "print" });
  await expect(trace).toHaveCSS("animation-name", "none"); await expect(trace).toHaveCSS("opacity", "0");
  expect(await ink.getAttribute("d")).toBe(path);
});
