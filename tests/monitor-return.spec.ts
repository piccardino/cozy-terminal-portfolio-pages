import { test, expect } from "@playwright/test";

test("close-up exposes a return button in every photo format and restores the desk", async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1920, height: 1080 },
    { width: 390, height: 844 }, { width: 320, height: 660 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".monitor-return")).toBeHidden();
    const original = await page.locator(".monitor-surface").boundingBox();
    await page.getByRole("button", { name: "Move closer to the monitor", exact: true }).click();
    await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
    const back = page.getByRole("button", { name: "Return to desk", exact: true });
    await expect(back).toBeVisible();
    const screen = (await page.locator(".monitor-surface").boundingBox())!;
    const button = (await back.boundingBox())!;
    const wallpaper = (await page.locator(".wallpaper-toggle").boundingBox())!;
    expect(button.x).toBeGreaterThanOrEqual(Math.max(0, screen.x));
    expect(button.y).toBeGreaterThanOrEqual(screen.y);
    expect(button.x + button.width).toBeLessThanOrEqual(screen.x + screen.width);
    expect(button.x + button.width).toBeGreaterThan(screen.x + screen.width - 16);
    expect(button.y).toBeLessThan(screen.y + 16);
    expect(button.y + button.height).toBeLessThan(wallpaper.y);
    expect(button.y + button.height).toBeLessThanOrEqual(screen.y + screen.height);
    await back.click();
    await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
    await expect(page.locator(".monitor-return")).toBeHidden();
    expect(await page.locator(".speaker-hotspot").evaluate(el => el.inert)).toBe(false);
    expect(await page.locator(".monitor-surface").boundingBox()).toEqual(original);
    await expect(page.locator(".monitor-hotspot")).toBeFocused();
  }
});

test("Italian close-up return works with keyboard and preserves the wallpaper", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Italiano", exact: true }).click();
  await page.getByRole("button", { name: "Mostra lo sfondo tramonto", exact: true }).click();
  await page.getByRole("button", { name: "Avvicinati al monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  const back = page.getByRole("button", { name: "Torna alla scrivania", exact: true });
  await back.focus();
  await back.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".workspace")).toHaveAttribute("data-wallpaper", "sunset");
  await page.getByRole("button", { name: "Avvicinati al monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.getByRole("button", { name: "Entra nel terminale ed esplora il portfolio", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
  await expect(page.locator(".monitor-return")).toBeHidden();
  await expect(page.getByRole("button", { name: "Torna alla scrivania", exact: true })).toBeVisible();
});

test("touch can return from a portrait close-up", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto("/");
  await page.locator("#mobile-enter").tap();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.getByRole("button", { name: "Return to desk", exact: true }).tap();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator("#mobile-enter")).toBeEnabled();
  await page.close();
});
