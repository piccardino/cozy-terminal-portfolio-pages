import { test, expect } from "@playwright/test";

test("fullscreen controls follow the browser state, work in both views and change language", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.tagName))
    .toBe("HTML");
  for (const button of await page.locator(".fullscreen-toggle").all()) {
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  await page
    .getByRole("button", {
      name: "Move closer to the monitor",
    })
    .click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await page.locator('.editor-tabs [data-file="about"]').click();
  await page.getByRole("button", { name: "View my CV" }).click();
  await expect(page.getByRole("dialog", { name: "Alex Morra" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.tagName))
    .toBe("HTML");
  await page.getByRole("button", { name: "Close CV", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await page
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click();
  await page.locator('.terminal-header [data-language="it"]').click();
  await page
    .getByRole("button", { name: "Esci da schermo intero", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement))
    .toBeNull();
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await page
    .getByRole("button", { name: "Apri a schermo intero", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  // Exiting through browser UI, rather than the button, must update both controls.
  await page.evaluate(() => document.exitFullscreen());
  for (const button of await page.locator(".fullscreen-toggle").all()) {
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toHaveAttribute("aria-label", "Apri a schermo intero");
  }
});

test("fullscreen rejection restores the control and unsupported browsers hide it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new DOMException("Unavailable", "NotAllowedError"));
  });
  await page.goto("/");
  const button = page.getByRole("button", {
    name: "Enter fullscreen",
    exact: true,
  });
  await button.click();
  await expect(page.getByRole("status")).toHaveText(
    "Fullscreen is unavailable in this browser.",
  );
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "fullscreenEnabled", { value: false });
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  await expect(page.locator(".desk-header .fullscreen-toggle")).toBeHidden();
});

test("LinkedIn photo lifts on click and keyboard activation while the monitor remains still", async ({
  page,
  context,
}) => {
  await context.route("https://www.linkedin.com/**", (route) =>
    route.fulfill({ body: "<title>LinkedIn destination</title>" }),
  );
  await page.goto("/");
  const link = page.locator(".linkedin-hotspot");
  await link.hover();
  const monitor = await page.locator(".monitor-surface").boundingBox();
  await page.mouse.down();
  await expect(page.locator(".workspace")).toHaveClass(/linkedin-clicked/);
  await page.evaluate(() => {
    for (const animation of document
      .querySelector(".linkedin-click-art")!
      .getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 360;
    }
  });
  await expect(page.locator(".linkedin-photo-lift")).toHaveCSS("opacity", "1");
  expect(await page.locator(".monitor-surface").boundingBox()).toEqual(monitor);
  await page.screenshot({ path: ".local/linkedin-click-animation.png" });
  const popupPromise = page.waitForEvent("popup");
  await page.mouse.up();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(
    "https://www.linkedin.com/in/alex-morra-02145a1a4/",
  );
  await popup.close();
  await expect(page.locator(".workspace")).not.toHaveClass(/linkedin-clicked/);
  await link.focus();
  const keyboardPopupPromise = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const keyboardPopup = await keyboardPopupPromise;
  await expect(page.locator(".workspace")).toHaveClass(/linkedin-clicked/);
  await keyboardPopup.close();
  await expect(page.locator(".workspace")).not.toHaveClass(/linkedin-clicked/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await link.focus();
  const reducedPopupPromise = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const reducedPopup = await reducedPopupPromise;
  await expect(page.locator(".workspace")).not.toHaveClass(/linkedin-clicked/);
  await expect(page.locator(".linkedin-photo-lift")).toHaveCSS("opacity", "0");
  await reducedPopup.close();
});

test("fullscreen controls fit narrow mobile headers", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const elements = await page.locator(".desk-header").evaluate((header) => {
      const selectors = [
        ".wordmark",
        ".fullscreen-toggle",
        ".language-switch",
        ".sound-toggle",
      ];
      return selectors.map((selector) =>
        header.querySelector(selector)!.getBoundingClientRect().toJSON(),
      );
    });
    for (let i = 0; i < elements.length; i++) {
      expect(elements[i].left).toBeGreaterThanOrEqual(0);
      expect(elements[i].right).toBeLessThanOrEqual(width);
      if (i > 0)
        expect(elements[i].left).toBeGreaterThanOrEqual(elements[i - 1].right);
    }
    await page
      .getByRole("button", { name: "Enter fullscreen", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(true);
    await page
      .getByRole("button", { name: "Exit fullscreen", exact: true })
      .click();
    await page.locator("#mobile-enter").click();
    await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
    await page.keyboard.press("Enter");
    await expect(page.locator(".workspace")).toHaveAttribute(
      "data-view",
      "terminal",
    );
    const terminalButton = page.getByRole("button", {
      name: "Enter fullscreen",
      exact: true,
    });
    await expect(terminalButton).toBeVisible();
    const bounds = await terminalButton.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `.local/fullscreen-mobile-${width}.png` });
  }
});
