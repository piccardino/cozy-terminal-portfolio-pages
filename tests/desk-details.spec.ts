import { test, expect } from "@playwright/test";

test("mug hover follows its body and handle, excluding the hole and surrounding desk", async ({ page }) => {
  test.setTimeout(45000);
  await page.goto("/");
  for (const viewport of [
    { width: 1672, height: 941 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 941, height: 1672 },
  ]) {
    await page.setViewportSize(viewport);
    const wide = viewport.width / viewport.height >= 16 / 9;
    const portrait = viewport.width < viewport.height;
    const photo = portrait ? { width: 941, height: 1672 }
      : wide ? { width: 2365, height: 665 } : { width: 1672, height: 941 };
    const scale = Math.max(viewport.width / photo.width, viewport.height / photo.height);
    const offsetX = (viewport.width - photo.width * scale) / 2;
    const offsetY = (viewport.height - photo.height * scale) / 2;
    await expect.poll(async () => (await page.locator(".cv-hotspot").boundingBox())!.width)
      .toBeCloseTo((portrait ? 133 : wide ? 135 : 182) * scale, 0);
    const screen = await page.locator(".monitor-surface").boundingBox();
    const points = portrait ? [
      [858, 1130, true], [861, 1067, true], [815, 1120, true], [939, 1130, true],
      [922, 1130, false], [914, 1135, false],
      [804, 1120, false], [861, 1060, false], [855, 1190, false], [948, 1130, false],
    ] as const : wide ? [
      [1657, 457, true],
      [1660, 500, true], [1640, 464, true], [1615, 515, true],
      [1735, 510, true], [1725, 540, true],
      [1719, 510, false], [1713, 528, false],
      [1604, 510, false], [1660, 451, false], [1660, 575, false], [1747, 510, false],
    ] as const : [
      [1492, 621, true],
      [1495, 700, true], [1490, 628, true], [1430, 710, true],
      [1558, 708, true], [1604, 695, true],
      [1580, 695, false], [1563, 710, false],
      [1424, 708, false], [1490, 618, false], [1490, 780, false], [1612, 695, false],
    ] as const;
    for (const [photoX, photoY, onMug] of points) {
      const x = offsetX + photoX * scale, y = offsetY + photoY * scale;
      if (x >= viewport.width || x < 0) continue;
      await page.mouse.move(x, y);
      const hit = await page.evaluate(({ x, y }) =>
        !!document.elementFromPoint(x, y)?.closest(".cv-hotspot"), { x, y });
      expect(hit, `${photoX},${photoY} at ${viewport.width}`).toBe(onMug);
      await expect(page.locator(".cv-highlight")).toHaveCSS("opacity", onMug ? "1" : "0.7");
      expect(await page.locator(".monitor-surface").boundingBox()).toEqual(screen);
    }
  }
});

test("project folder icons keep square dimensions on desktop, short screens and mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
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
