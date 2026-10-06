import { test, expect } from "@playwright/test";

test("monitor wallpapers switch without moving the camera and persist across reloads and language changes", async ({ page }) => {
  await page.goto("/");
  const workspace = page.locator(".workspace");
  const art = page.locator(".mountain");
  await expect(workspace).toHaveAttribute("data-wallpaper", "mountains");
  expect((await art.textContent())!.split("\n")).toHaveLength(52);
  expect(await art.locator("span").count()).toBeGreaterThan(100);
  const screen = await page.locator(".monitor-surface").boundingBox();
  await page.getByRole("button", { name: "Show sunset wallpaper", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-view", "desk");
  await expect(workspace).toHaveAttribute("data-wallpaper", "sunset");
  expect((await art.textContent())!.split("\n")).toHaveLength(78);
  expect(await page.locator(".monitor-surface").boundingBox()).toEqual(screen);
  await page.reload();
  await expect(workspace).toHaveAttribute("data-wallpaper", "sunset");
  await page.getByRole("button", { name: "Italiano", exact: true }).click();
  const toggle = page.getByRole("button", { name: "Mostra lo sfondo montagne", exact: true });
  await toggle.focus();
  await toggle.press("Enter");
  await expect(workspace).toHaveAttribute("data-wallpaper", "mountains");
  await expect(workspace).toHaveAttribute("data-view", "desk");
  await page.getByRole("button", { name: "Avvicinati al monitor", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-view", "monitor");
  const close = await page.locator(".monitor-surface").boundingBox();
  await page.getByRole("button", { name: "Mostra lo sfondo tramonto", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-view", "monitor");
  expect(await page.locator(".monitor-surface").boundingBox()).toEqual(close);
  await page.keyboard.press("Escape");
  await expect(workspace).toHaveAttribute("data-view", "desk");
  await page.getByRole("button", { name: "Mostra lo sfondo montagne", exact: true }).click();
  await page.reload();
  await expect(workspace).toHaveAttribute("data-wallpaper", "mountains");
});

test("both backgrounds and the selector fit each photo and portrait close-ups", async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1920, height: 1080 },
    { width: 2560, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 660 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("portfolio-wallpaper");
    });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    for (const close of [false, true]) {
      if (close) {
        await page.getByRole("button", { name: "Move closer to the monitor", exact: true }).click();
        await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
      }
      const screen = (await page.locator(".monitor-surface").boundingBox())!;
      for (const wallpaper of ["mountains", "sunset"] as const) {
        await expect(page.locator(".workspace")).toHaveAttribute("data-wallpaper", wallpaper);
        const control = (await page.locator(".wallpaper-toggle").boundingBox())!;
        expect(control.x).toBeGreaterThanOrEqual(Math.max(0, screen.x));
        expect(control.y).toBeGreaterThanOrEqual(screen.y);
        expect(control.x + control.width).toBeLessThanOrEqual(Math.min(viewport.width, screen.x + screen.width));
        expect(control.y + control.height).toBeLessThanOrEqual(screen.y + screen.height);
        const lines = (await page.locator(".mountain").textContent())!.split("\n");
        expect(lines).toHaveLength(wallpaper === "mountains" ? 52 : 78);
        expect(lines.every(line => line.length === 144)).toBe(true);
        const fits = await page.locator(".mountain").evaluate(el => ({
          width: el.scrollWidth <= el.clientWidth,
          height: el.scrollHeight <= el.clientHeight,
          quote: document.querySelector(".mini-quote")!.getBoundingClientRect().toJSON(),
        }));
        expect(fits.width).toBe(true);
        expect(fits.height).toBe(true);
        if (wallpaper === "mountains" && viewport.width < viewport.height) {
          const quoteText = await page.locator(".mini-quote").evaluate(el => {
            const range = document.createRange(); range.selectNodeContents(el);
            return range.getBoundingClientRect().toJSON();
          });
          expect(quoteText.x).toBeGreaterThanOrEqual(0);
          expect(quoteText.right).toBeLessThanOrEqual(viewport.width);
        }
        await page.locator(".wallpaper-toggle").click();
        await expect(page.locator(".workspace")).toHaveAttribute("data-view", close ? "monitor" : "desk");
      }
    }
  }
});

test("the chosen artwork follows the welcome file and works without local storage", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage disabled"); };
    Storage.prototype.setItem = () => { throw new Error("Storage disabled"); };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".wallpaper-toggle").click();
  await page.getByRole("button", { name: "Move closer to the monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
  await expect(page.locator(".wallpaper-toggle")).toBeHidden();
  await expect(page.locator(".welcome-mountain")).toHaveAttribute("data-wallpaper", "sunset");
  await page.getByRole("button", { name: "Italiano", exact: true }).click();
  await expect(page.locator(".welcome-mountain")).toHaveAttribute("data-wallpaper", "sunset");
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await page.locator(".wallpaper-toggle").click();
  await page.getByRole("button", { name: "Avvicinati al monitor", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".welcome-mountain")).toHaveAttribute("data-wallpaper", "mountains");
});
