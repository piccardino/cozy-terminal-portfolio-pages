import { test, expect } from "@playwright/test";

test("the detailed landscape fills its area without clipping at different sizes", async ({
  page,
}) => {
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
    [1280, 720],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const art = page.locator(".mountain");
    const lines = (await art.textContent())!.split("\n");
    expect(lines).toHaveLength(78);
    expect(lines.every((line) => line.length === 144)).toBe(true);
    expect(lines.join("").replace(/\s/g, "").length).toBeGreaterThan(4000);
    expect(lines.join("\n")).not.toMatch(/SUNSET|RUN|1995/);
    const fit = await art.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const bounds = el.getBoundingClientRect();
      const area = el.parentElement!.getBoundingClientRect();
      const entry = el
        .parentElement!.querySelector(".mini-enter")!
        .getBoundingClientRect();
      return {
        widthRatio: range.getBoundingClientRect().width / bounds.width,
        heightRatio: bounds.height / area.height,
        overflowX: el.scrollWidth > el.clientWidth,
        overflowY: el.scrollHeight > el.clientHeight,
        bottom: entry.bottom,
        areaBottom: area.bottom,
      };
    });
    expect(fit.widthRatio).toBeGreaterThan(0.95);
    expect(fit.widthRatio).toBeLessThanOrEqual(1.001);
    expect(fit.heightRatio).toBeGreaterThan(0.9);
    expect(fit.overflowX).toBe(false);
    expect(fit.overflowY).toBe(false);
    expect(fit.bottom).toBeLessThanOrEqual(fit.areaBottom);
  }
});

test("the mug opens both CV pages lazily, supports zoom and PDF download, and restores focus", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/cv/")) requests.push(request.url());
  });
  await page.goto("/");
  expect(requests).toEqual([]);
  const mug = page.getByRole("button", {
    name: "Open Alex Morra's CV — coffee mug",
  });
  await mug.hover();
  await expect(page.locator(".cv-highlight")).toHaveCSS("opacity", "1");
  await expect(page.locator(".cv-object-label")).toHaveCSS("opacity", "1");
  // The photographed object and its hit target share the photo's cover transform.
  const mugRect = await mug.boundingBox();
  expect(mugRect!.x).toBeCloseTo(
    (1440 - (1672 * 900) / 941) / 2 + (1427 * 900) / 941,
    0,
  );
  await mug.click();
  const dialog = page.getByRole("dialog", { name: "Alex Morra" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close CV", exact: true }),
  ).toBeFocused();
  const images = dialog.locator(".cv-page img");
  await expect(images).toHaveCount(2);
  await expect
    .poll(() =>
      images.evaluateAll((elements) =>
        elements.every((el) => (el as HTMLImageElement).naturalWidth === 1800),
      ),
    )
    .toBe(true);
  expect(requests.filter((url) => url.endsWith(".webp"))).toHaveLength(2);
  await page.getByRole("button", { name: "Zoom", exact: true }).click();
  await expect(dialog.locator(".cv-pages")).toHaveClass(/is-zoomed/);
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(dialog.locator(".cv-pages")).not.toHaveClass(/is-zoomed/);
  await dialog.locator("figure").last().scrollIntoViewIfNeeded();
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Alex-Morra-CV.pdf");
  expect(await download.failure()).toBeNull();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(mug).toBeFocused();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await mug.press("Enter");
  await expect(dialog).toBeVisible();
  expect(requests.filter((url) => url.endsWith(".webp"))).toHaveLength(2);
});

test("CV is reachable on mobile, localised, and closes without leaving the terminal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('.desk-header [data-language="it"]').click();
  await page.locator("#mobile-enter").click();
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await page.locator('.editor-tabs [data-file="about"]').click();
  const opener = page.getByRole("button", { name: "Leggi il mio CV" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Alex Morra" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("link", { name: "Scarica PDF" })).toBeVisible();
  await expect
    .poll(() =>
      dialog
        .locator("img")
        .evaluateAll((elements) =>
          elements.every((el) => (el as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expect(page.getByText("Pagina 1 di 2", { exact: true })).toBeAttached();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Ingrandisci", exact: true }).click();
  expect(
    await dialog
      .locator(".cv-pages")
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Adatta", exact: true }).click();
  await page.screenshot({ path: ".local/cv-viewer-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await expect(opener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
});
