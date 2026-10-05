import { test, expect } from "@playwright/test";

test("supplied photos and calibrated objects follow aspect ratio and live resizing", async ({ page }) => {
  await page.goto("/");
  for (const [width, height, image] of [
    [2560, 720, "wide"], [2100, 900, "wide"], [450, 800, "portrait"], [1440, 900, "standard"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".desk-photo")).toHaveAttribute("src", image === "standard" ? /workspace.webp$/ : new RegExp(`workspace-${image}.webp$`));
    await expect.poll(() => page.locator(".desk-photo").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const geometry = await page.locator(".monitor-hit-target").evaluate(el => {
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    });
    await page.mouse.click(geometry.x, geometry.y);
    await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
    await page.keyboard.press("Escape");
    await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
    await page.locator(".cv-hotspot").click();
    await expect(page.locator(".cv-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: `.local/photo-${image}-${width}.png`, animations: "disabled" });
  }
});
