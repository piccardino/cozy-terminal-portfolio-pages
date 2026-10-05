import { test, expect } from "@playwright/test";

test("mug hover follows its body and handle, excluding the hole and surrounding desk", async ({ page }) => {
  test.setTimeout(45000);
  await page.goto("/");
  for (const viewport of [
    { width: 1672, height: 941 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const scale = Math.max(viewport.width / 1672, viewport.height / 941);
    const offsetX = (viewport.width - 1672 * scale) / 2;
    const offsetY = (viewport.height - 941 * scale) / 2;
    await expect.poll(async () => (await page.locator(".cv-hotspot").boundingBox())!.width)
      .toBeCloseTo(181 * scale, 0);
    const screen = await page.locator(".monitor-surface").boundingBox();
    for (const [photoX, photoY, onMug] of [
      [1495, 700, true], [1490, 628, true], [1430, 710, true],
      [1558, 708, true], [1604, 695, true],
      [1580, 695, false], [1563, 710, false],
      [1424, 708, false], [1490, 618, false], [1490, 780, false], [1612, 695, false],
    ] as const) {
      const x = offsetX + photoX * scale, y = offsetY + photoY * scale;
      if (x >= viewport.width || x < 0) continue;
      await page.mouse.move(x, y);
      const hit = await page.evaluate(({ x, y }) =>
        !!document.elementFromPoint(x, y)?.closest(".cv-hotspot"), { x, y });
      expect(hit, `${photoX},${photoY} at ${viewport.width}`).toBe(onMug);
      await expect(page.locator(".cv-highlight")).toHaveCSS("opacity", onMug ? "1" : "0");
      expect(await page.locator(".monitor-surface").boundingBox()).toEqual(screen);
    }
  }
});

test("project folder icons keep square dimensions on desktop, short screens and mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
  await page.locator('.editor-tabs [data-file="projects"]').click();
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1280, height: 660 },
    { width: 1100, height: 800 }, { width: 790, height: 660 },
    { width: 390, height: 844 }, { width: 320, height: 660 },
  ]) {
    await page.setViewportSize(viewport);
    const sizes = await page.locator(".folder-top > svg").evaluateAll(elements =>
      elements.map(el => ({ width: parseFloat(getComputedStyle(el).width), height: parseFloat(getComputedStyle(el).height) })),
    );
    expect(sizes).toHaveLength(33);
    for (const { width, height } of sizes) {
      expect(width).toBeGreaterThanOrEqual(29);
      expect(width).toBe(height);
    }
    expect(await page.locator("#file-content").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});
