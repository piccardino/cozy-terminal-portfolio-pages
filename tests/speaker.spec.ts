import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function trackAudio(page: Page) {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { speakerTestContexts: contexts });
    window.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        contexts.push(this);
      }
    };
  });
}

const audioState = (page: Page) => page.evaluate(() =>
  (window as unknown as { speakerTestContexts: AudioContext[] }).speakerTestContexts.map(context => context.state),
);

test("speaker contour and hit area follow all photographs, cropping and live resizing", async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const viewport of [
    { width: 1672, height: 941 }, { width: 1440, height: 900 },
    { width: 2365, height: 665 }, { width: 1920, height: 1080 },
    { width: 941, height: 1672 }, { width: 390, height: 844 },
    { width: 320, height: 660 }, { width: 320, height: 844 },
  ]) {
    await page.mouse.move(0, 0);
    await page.setViewportSize(viewport);
    const profile = viewport.width < viewport.height ? "portrait"
      : viewport.width / viewport.height >= 16 / 9 ? "wide" : "standard";
    const photo = profile === "portrait" ? { width: 941, height: 1672 }
      : profile === "wide" ? { width: 2365, height: 665 } : { width: 1672, height: 941 };
    const cabinet = profile === "portrait" ? { left: 57, top: 835, right: 160, bottom: 984 }
      : profile === "wide" ? { left: 718, top: 323, right: 827, bottom: 465 }
        : { left: 253, top: 432, right: 395, bottom: 631 };
    const scale = Math.max(viewport.width / photo.width, viewport.height / photo.height);
    const offsetX = (viewport.width - photo.width * scale) / 2;
    const offsetY = (viewport.height - photo.height * scale) / 2;
    const speaker = page.locator(".speaker-hotspot");
    await expect.poll(async () => (await speaker.boundingBox())!.width)
      .toBeCloseTo((cabinet.right - cabinet.left) * scale, 0);
    const box = (await speaker.boundingBox())!;
    expect(box.x).toBeCloseTo(offsetX + cabinet.left * scale, 0);
    expect(box.y).toBeCloseTo(offsetY + cabinet.top * scale, 0);
    expect(box.height).toBeCloseTo((cabinet.bottom - cabinet.top) * scale, 0);
    const contour = (await page.locator(".speaker-highlight .monitor-edge").boundingBox())!;
    // SVG client bounds include the 1.5px stroke; HTML bounds include no stroke.
    expect(Math.abs(contour.x - box.x)).toBeLessThan(2 * scale);
    expect(Math.abs(contour.y - box.y)).toBeLessThan(2 * scale);
    expect(Math.abs(contour.width - box.width)).toBeLessThan(3 * scale);
    expect(Math.abs(contour.height - box.height)).toBeLessThan(3 * scale);
    await expect(page.locator(".speaker-highlight")).toHaveCSS("opacity", "0.7");
    const screen = await page.locator(".monitor-surface").boundingBox();
    const points = profile === "portrait" ? [
      [135, 925, true], [156, 925, true], [140, 979, true],
      [54, 900, false], [164, 925, false], [92, 973, false], [145, 988, false],
    ] as const : profile === "wide" ? [
      [750, 390, true], [820, 400, true], [790, 461, true],
      [714, 390, false], [831, 390, false], [820, 459, false], [780, 469, false],
    ] as const : [
      [300, 550, true], [390, 480, true], [358, 625, true],
      [249, 550, false], [399, 550, false], [390, 620, false], [320, 636, false],
    ] as const;
    for (const [photoX, photoY, onSpeaker] of points) {
      const x = offsetX + photoX * scale, y = offsetY + photoY * scale;
      if (x < 0 || x >= viewport.width || y < 0 || y >= viewport.height) continue;
      await page.mouse.move(x, y);
      expect(await page.evaluate(({ x, y }) =>
        !!document.elementFromPoint(x, y)?.closest(".speaker-hotspot"), { x, y }),
      `${profile} ${photoX},${photoY} at ${viewport.width}`).toBe(onSpeaker);
      await expect(page.locator(".speaker-highlight")).toHaveCSS("opacity", onSpeaker ? "1" : "0.7");
    }
    const visibleSpeaker = points.find(([photoX, , onSpeaker]) => onSpeaker
      && offsetX + photoX * scale >= 0 && offsetX + photoX * scale < viewport.width)!;
    await page.mouse.move(offsetX + visibleSpeaker[0] * scale, offsetY + visibleSpeaker[1] * scale);
    const label = (await page.locator(".speaker-object-label").boundingBox())!;
    expect(label.x).toBeGreaterThanOrEqual(0);
    expect(label.x + label.width).toBeLessThanOrEqual(viewport.width);
    await expect(page.locator(".speaker-object-label")).toHaveCSS("opacity", "1");
    expect(await page.locator(".monitor-surface").boundingBox()).toEqual(screen);
  }
});

test("hover reveals the fire control, click toggles and keeps sound through monitor zoom", async ({ page }) => {
  await trackAudio(page);
  const downloads: string[] = [];
  page.on("request", request => {
    if (/\/audio\/fireplace-loop\.(ogg|mp3)$/.test(request.url())) downloads.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const speaker = page.getByRole("button", { name: "Left speaker: turn fire sound on", exact: true });
  await speaker.hover();
  await expect(page.locator(".speaker-object-label")).toHaveCSS("opacity", "1");
  await expect(page.locator(".speaker-object-label")).toContainText("CLICK TO PLAY");
  expect(await audioState(page)).toEqual([]);
  expect(downloads).toEqual([]);
  await speaker.click();
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".desk-header .sound-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => audioState(page)).toEqual(["running"]);
  await page.mouse.move(0, 0);
  await expect(page.locator(".speaker-object-label")).toHaveCSS("opacity", "0");
  expect(await audioState(page)).toEqual(["running"]);
  await page.getByRole("button", { name: "Move closer to the monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  expect(await page.locator(".speaker-hotspot").evaluate(el => el.inert)).toBe(true);
  expect(await audioState(page)).toEqual(["running"]);
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
  await page.getByRole("button", { name: "Disable fire ambience", exact: true }).click();
  await expect.poll(() => audioState(page)).toEqual(["suspended"]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute("aria-pressed", "false");
  await page.locator(".speaker-hotspot").click();
  await expect.poll(() => audioState(page)).toEqual(["running"]);
  await page.locator(".speaker-hotspot").click();
  await expect.poll(() => audioState(page)).toEqual(["suspended"]);
  expect(downloads).toHaveLength(1);
});

test("speaker supports keyboard, loading feedback and Italian labels", async ({ page }) => {
  await trackAudio(page);
  let releaseDownload!: () => void;
  const pendingDownload = new Promise<void>(resolve => { releaseDownload = resolve; });
  await page.route("**/audio/fireplace-loop.ogg", async route => {
    await pendingDownload;
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Italiano", exact: true }).click();
  const speaker = page.getByRole("button", { name: "Speaker sinistro: accendi il suono del fuoco", exact: true });
  await page.locator(".cv-hotspot").focus();
  await page.keyboard.press("Tab");
  await expect(speaker).toBeFocused();
  await expect(page.locator(".speaker-highlight")).toHaveCSS("opacity", "1");
  await speaker.press("Enter");
  await expect(speaker).toBeDisabled();
  await expect(speaker).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".speaker-object-label")).toContainText("CARICAMENTO");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  releaseDownload();
  const enabled = page.getByRole("button", { name: "Speaker sinistro: spegni il suono del fuoco", exact: true });
  await expect(enabled).toBeEnabled();
  await expect(enabled).toHaveAttribute("aria-pressed", "true");
  await enabled.focus();
  await enabled.press("Space");
  await expect.poll(() => audioState(page)).toEqual(["suspended"]);
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
});

test("touching the visible speaker toggles fire on a cropped portrait photo", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await trackAudio(page);
  await page.goto("/");
  await expect(page.locator(".desk-photo")).toHaveAttribute("src", /workspace-portrait.webp$/);
  const scale = 844 / 1672;
  const x = (390 - 941 * scale) / 2 + 135 * scale, y = 925 * scale;
  await page.touchscreen.tap(x, y);
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => audioState(page)).toEqual(["running"]);
  await page.touchscreen.tap(x, y);
  await expect.poll(() => audioState(page)).toEqual(["suspended"]);
  await expect(page.locator(".desk-header .sound-toggle")).toHaveAttribute("aria-pressed", "false");
  await page.close();
});
