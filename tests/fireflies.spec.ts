import { test, expect } from "@playwright/test";
import sharp from "sharp";

test("fireflies render visible light over every desk photo, including reduced motion", async ({ page }) => {
  test.setTimeout(45000);
  for (const [width, height, reducedMotion] of [
    [1440, 900, "no-preference"], [1920, 1080, "no-preference"],
    [390, 844, "no-preference"], [1440, 900, "reduce"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect.poll(() => page.locator(".desk-photo").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    if (width === 1440 && reducedMotion === "no-preference")
      await expect(page.locator(".workspace")).toHaveAttribute("data-engine", "webgl");
    await page.evaluate(async () => {
      await document.fonts.ready;
      const animations = document.getAnimations();
      animations.forEach(animation => animation.pause());
      await Promise.all(animations.map(animation => animation.ready));
    });
    const layer = page.locator(".fireflies");
    await expect(layer).toBeVisible();
    await expect(page.locator(".speaker-hotspot")).toHaveAttribute("aria-pressed", "false");
    const points = await layer.locator("i").evaluateAll(elements => elements.map(el => {
      const bounds = el.getBoundingClientRect();
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, size: bounds.width };
    }).filter(point => point.size > 0));
    const lit = await page.screenshot();
    await layer.evaluate(el => (el as HTMLElement).style.visibility = "hidden");
    const dark = await page.screenshot();
    await layer.evaluate(el => (el as HTMLElement).style.removeProperty("visibility"));
    const before = await sharp(lit).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const after = await sharp(dark).removeAlpha().raw().toBuffer();
    let visible = 0;
    for (const point of points) {
      let contrast = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = Math.floor(point.x) + dx, y = Math.floor(point.y) + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const pixel = (y * before.info.width + x) * before.info.channels;
        const addedLight = before.data[pixel] + before.data[pixel + 1] + before.data[pixel + 2]
          - after[pixel] - after[pixel + 1] - after[pixel + 2];
        contrast = Math.max(contrast, addedLight);
      }
      if (contrast > 45) visible++;
      expect(await page.evaluate(({ x, y }) =>
        !document.elementFromPoint(x, y)?.closest(".fireflies"), point)).toBe(true);
    }
    expect(visible, `${width}x${height}, motion ${reducedMotion}: bright particle cores`).toBeGreaterThanOrEqual(4);
  }
});

test("fireflies drift gently, pause away from the desk and stay static with reduced motion", async ({ page }) => {
  await page.goto("/");
  const particle = page.locator(".fireflies i").first();
  const travel = await particle.evaluate(async el => {
    const animations = el.getAnimations();
    animations.forEach(animation => animation.pause());
    await Promise.all(animations.map(animation => animation.ready));
    const start = el.getBoundingClientRect();
    animations.forEach(animation => { animation.currentTime = Number(animation.currentTime) + 2000; });
    const end = el.getBoundingClientRect();
    animations.forEach(animation => animation.play());
    return Math.hypot(end.x - start.x, end.y - start.y);
  });
  expect(travel).toBeGreaterThan(1);
  expect(travel).toBeLessThan(20);
  // Seeking through the Web Animations API overrides CSS playback; reset it
  // before checking the application's own pause and resume behavior.
  await page.reload();
  await page.getByRole("button", { name: "Move closer to the monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await expect(page.locator(".fireflies")).toBeHidden();
  expect(await particle.evaluate(el => el.getAnimations().every(animation => animation.playState === "paused"))).toBe(true);
  await page.getByRole("button", { name: "Return to desk", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".fireflies")).toBeVisible();
  expect(await particle.evaluate(el => el.getAnimations().every(animation => animation.playState === "running"))).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".fireflies")).toBeHidden();
  expect(await particle.evaluate(el => el.getAnimations().every(animation => animation.playState === "paused"))).toBe(true);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".fireflies")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".fireflies")).toBeVisible();
  expect(await particle.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect(particle).toHaveCSS("opacity", "0.4");
});
