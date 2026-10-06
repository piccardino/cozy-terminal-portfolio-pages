import { test, expect } from "@playwright/test";
import sharp from "sharp";

test("the virtual screen meets the photographed display edges in every format", async ({ page }) => {
  await page.goto("/");
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1920, height: 1080 },
    { width: 390, height: 844 }, { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".workspace")).toHaveAttribute("data-engine", viewport.width === 1440 ? "webgl" : "css");
    await expect(page.locator(".desk-photo")).toHaveAttribute("src", viewport.width === 1440 ? /workspace.webp$/ : viewport.width === 390 ? /workspace-portrait.webp$/ : /workspace-wide.webp$/);
    const errors = await page.locator(".desk-photo").evaluate(async (photo: HTMLImageElement) => {
      await photo.decode();
      const canvas = document.createElement("canvas");
      canvas.width = photo.naturalWidth;
      canvas.height = photo.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(photo, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const scale = Math.max(innerWidth / canvas.width, innerHeight / canvas.height);
      const offsetX = (innerWidth - canvas.width * scale) / 2;
      const offsetY = (innerHeight - canvas.height * scale) / 2;
      const screen = document.querySelector(".monitor-surface")!.getBoundingClientRect();
      const left = (screen.left - offsetX) / scale;
      const right = (screen.right - offsetX) / scale;
      // Read the supplied photograph itself: dark green panel pixels continue
      // to its edges, whereas the black bezel and brown room do not.
      return [0.1, 0.5, 0.9].map(fraction => {
        const y = Math.round((screen.top + screen.height * fraction - offsetY) / scale);
        const green: number[] = [];
        const isGreen = (x: number) => {
          const i = (y * canvas.width + x) * 4;
          const [r, g, b] = pixels.slice(i, i + 3);
          return g > r * 1.7 && g > b * 1.18 && g > 9;
        };
        for (let x = Math.floor(left - 40); x < right + 40; x++) {
          // Ignore isolated green reflections along the black bezel.
          if ([0, 1, 2, 3].every(offset => isGreen(x + offset))) green.push(x);
        }
        return [Math.abs(left - green[0]), Math.abs(right - (green.at(-1)! + 4))];
      });
    });
    for (const error of errors.flat()) expect(error, `${viewport.width}px: ${JSON.stringify(errors)}`).toBeLessThanOrEqual(2);
  }
});

test("resizing while Three.js loads keeps the photo and screen in the same coordinates", async ({ page }) => {
  let release!: () => void;
  let requested!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const loading = new Promise<void>(resolve => { requested = resolve; });
  await page.route("**/node_modules/.vite/deps/three.js*", async route => {
    requested();
    await held;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await loading;
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(".desk-photo")).toHaveAttribute("src", /workspace-wide.webp$/);
    release();
    await expect(page.locator(".scene-canvas")).toHaveAttribute("width", "1920");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(".workspace")).toHaveAttribute("data-engine", "webgl");
    await page.addStyleTag({ content: ".desk-shade, .desk-chrome, .fireflies, .monitor-outline, .monitor-surface, .monitor-hotspot, .wallpaper-toggle, .monitor-return { visibility: hidden !important; }" });
    const rendered = await page.screenshot();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".workspace")).toHaveAttribute("data-engine", "css");
    const reference = await page.screenshot();
    // Compare room detail away from the screen against the actual CSS photo.
    // An incorrectly sized or substituted WebGL plane cannot match these areas.
    for (const region of [
      { left: 24, top: 80, width: 200, height: 180 },
      { left: 1180, top: 80, width: 200, height: 180 },
      { left: 400, top: 750, width: 200, height: 100 },
    ]) {
      const actual = await sharp(rendered).extract(region).removeAlpha().raw().toBuffer();
      const expected = await sharp(reference).extract(region).removeAlpha().raw().toBuffer();
      const difference = actual.reduce((sum, value, i) => sum + Math.abs(value - expected[i]), 0) / actual.length;
      expect(difference).toBeLessThan(3);
    }
  } finally {
    release();
  }
});
