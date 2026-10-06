import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function enter(page: Page) {
  await page
    .getByRole("button", {
      name: "Move closer to the monitor",
    })
    .click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.getByRole("button", { name: "Enter the terminal and explore the portfolio" }).click();
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await expect(page.getByRole("main")).toHaveAttribute("aria-hidden", "false");
}
async function command(page: Page, text: string) {
  const input = page.getByLabel("Terminal command");
  await input.fill(text);
  await input.press("Enter");
}

type AudioTrace = {
  testAudioContexts: AudioContext[];
  testAudioSources: AudioBufferSourceNode[];
};
async function trackAudio(page: Page) {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const contexts: AudioContext[] = [];
    const sources: AudioBufferSourceNode[] = [];
    Object.assign(window, {
      testAudioContexts: contexts,
      testAudioSources: sources,
    });
    window.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        contexts.push(this);
      }
      createBufferSource() {
        const source = super.createBufferSource();
        sources.push(source);
        return source;
      }
    };
  });
}

test("camera matches the photograph, zooms into the framed monitor, pauses, and reverses with Escape", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-engine",
    "webgl",
  );
  const rect = await page.locator(".monitor-surface").boundingBox();
  expect(rect).toBeTruthy();
  // On 1440x900 the photograph is fitted by its height, cropped horizontally.
  const scale = 900 / 941;
  expect(rect!.x).toBeCloseTo((1440 - 1672 * scale) / 2 + 423 * scale, 0);
  expect(rect!.y).toBeCloseTo(193 * scale, 0);
  await page.screenshot({ path: ".local/desk-desktop.png" });
  await enter(page);
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-render-state",
    "paused",
  );
  const close = (await page.locator(".monitor-surface").boundingBox())!;
  expect(close.width).toBeGreaterThan(rect!.width * 1.5);
  expect(close.x).toBeGreaterThan(20);
  expect(close.y).toBeGreaterThan(20);
  expect(close.x + close.width).toBeLessThan(1420);
  expect(close.y + close.height).toBeLessThan(880);
  expect(close.width / close.height).toBeCloseTo(rect!.width / rect!.height, 2);
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  await expect(page.locator("#file-content")).toBeFocused();
  await page.screenshot({ path: ".local/terminal-desktop.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-render-state",
    "running",
  );
  await expect(page.locator(".monitor-hotspot")).toBeFocused();
  expect(errors).toEqual([]);
});

test("the close-up waits through held Enter and resizing until a second activation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.down("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await expect(page.locator(".mini-screen")).toHaveCSS("opacity", "1");
  await expect(page.locator(".terminal")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".terminal")).toHaveJSProperty("inert", true);
  await expect(page.locator(".monitor-hotspot")).toBeFocused();
  // A repeated keydown after the camera settles must not count as a fresh press.
  await page.keyboard.down("Enter");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator(".desk-photo")).toHaveAttribute("src", /workspace-wide.webp$/);
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.up("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await expect(page.locator(".terminal")).toHaveCSS("opacity", "0");
  const close = await page.locator(".monitor-surface").boundingBox();
  await page.screenshot({ path: ".local/monitor-preview-close.png" });
  await page.getByRole("button", { name: "Enter the terminal and explore the portfolio" }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "terminal");
  expect(await page.locator(".monitor-surface").boundingBox()).toEqual(close);
  await expect(page.locator("#file-content")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
});

test("hover keeps the display stationary and lights the complete monitor including its base", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-engine",
    "webgl",
  );
  const screen = page.locator(".monitor-surface");
  const before = await screen.boundingBox();
  await page.mouse.move(
    before!.x + before!.width * 0.15,
    before!.y + before!.height * 0.2,
  );
  await expect(page.locator(".workspace")).toHaveClass(/monitor-hovered/);
  await expect(page.locator(".monitor-highlight")).toHaveCSS("opacity", "1");
  const samples = await screen.evaluate(async (element) => {
    const positions: { x: number; y: number; width: number; height: number }[] =
      [];
    for (let frame = 0; frame < 24; frame++) {
      await new Promise(requestAnimationFrame);
      const { x, y, width, height } = element.getBoundingClientRect();
      positions.push({ x, y, width, height });
    }
    return positions;
  });
  for (const sample of samples) expect(sample).toEqual(before);
  await expect(page.locator(".monitor-hotspot")).toHaveCSS(
    "box-shadow",
    "none",
  );
  await expect(page.locator(".monitor-highlight .monitor-edge")).toHaveCSS(
    "stroke",
    "rgb(83, 255, 208)",
  );
  await expect(page.locator(".monitor-highlight .monitor-halo")).toHaveCSS(
    "opacity",
    "0.26",
  );
  await expect(page.locator(".monitor-invitation")).toHaveCount(0);

  // This point is on the desk base in the reference photo, below the display and its stand.
  const scale = 900 / 941;
  await page.mouse.move((1440 - 1672 * scale) / 2 + 835 * scale, 718 * scale);
  await expect(page.locator(".workspace")).toHaveClass(/monitor-hovered/);
  expect(await screen.boundingBox()).toEqual(before);
  await page.screenshot({
    path: ".local/monitor-glow.png",
    animations: "disabled",
  });
  await page.mouse.move(20, 450);
  await expect(page.locator(".monitor-highlight")).toHaveCSS("opacity", "0");
  expect(await screen.boundingBox()).toEqual(before);
});

test("project folders, shell commands, history, and escaping work", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  await page
    .getByRole("button", { name: "Open Space Bunny Aetheria", exact: true })
    .click();
  await expect(page.locator("#file-content h2")).toContainText(
    "Space Bunny Aetheria",
  );
  await expect(
    page.getByRole("link", { name: "View source on GitHub" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/piccardino/space-bunny-aetheria",
  );
  await command(page, "open somi");
  await expect(page.locator("#file-content h2")).toContainText("SOMI");
  await command(page, "help");
  await expect(page.locator("#command-output")).toContainText("cat <file>");
  await page.getByLabel("Terminal command").press("ArrowUp");
  await expect(page.getByLabel("Terminal command")).toHaveValue("help");
  await page.getByLabel("Terminal command").press("ArrowUp");
  await expect(page.getByLabel("Terminal command")).toHaveValue("open somi");
  await command(page, "<img src=x onerror=alert(1)>");
  await expect(page.locator("#command-output img")).toHaveCount(0);
  await expect(page.locator("#command-output")).toContainText(
    "Unknown command",
  );
  await command(page, "cat contact.sh");
  await expect(page.locator("#file-content h2")).toContainText(
    "start with a conversation",
  );
  await command(page, "clear");
  await expect(page.locator("#command-output")).toBeEmpty();
});

test("all public projects expose source links while private projects expose their websites", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  await command(page, "projects");
  await expect(
    page
      .locator("#file-content .project-grid")
      .first()
      .locator(".project-folder"),
  ).toHaveCount(14);
  await expect(
    page
      .locator("#file-content .project-grid")
      .nth(1)
      .locator(".project-folder"),
  ).toHaveCount(19);
  await expect(page.locator("#file-content .project-folder")).toHaveCount(33);
  const projectNames = await page
    .locator("#file-content .project-folder h3")
    .allTextContents();
  expect(projectNames.every((name) => !/test/i.test(name))).toBe(true);
  await page.screenshot({
    path: ".local/all-projects.png",
    animations: "disabled",
  });
  const expected = [
    ["space-bunny-aetheria", "space-bunny-aetheria"],
    ["somi", "SOMI"],
    ["overlay-video", "Overlay_Video"],
    ["pointsvolleyhub", "PointsVolleyHub"],
    ["sitohelix", "sitoHelix"],
    ["karaoke", "Karaoke"],
    ["floating-island", "Floating-Island"],
  ];
  for (const [slug, repo] of expected) {
    await command(page, `open ${slug}`);
    await expect(
      page.getByRole("link", { name: "View source on GitHub" }),
    ).toHaveAttribute("href", `https://github.com/piccardino/${repo}`);
  }
  await command(page, "open volleyhub");
  await expect(
    page.getByRole("link", { name: "Visit website" }),
  ).toHaveAttribute("href", "https://volleyhubpro.com/");
  await expect(page.locator('#file-content a[href*="github.com"]')).toHaveCount(
    0,
  );
  await expect(page.locator("#file-content")).not.toContainText("git clone");
  await command(page, "open piano-finanziario");
  await expect(
    page.getByRole("link", { name: "Visit website" }),
  ).toHaveAttribute("href", "https://piano-finanziario-befa7.web.app/");
  await command(page, "open karaoke");
  await expect(
    page.getByRole("link", { name: "Open demo on Pages" }),
  ).toHaveAttribute("href", "https://piccardino.github.io/Karaoke/");
  for (const [slug, name] of [
    ["coach-ai-lab", "VolleyHub — Training AI"],
    ["pip-boy-data-manager", "Pip-Boy Data Manager"],
  ]) {
    await command(page, `open ${slug}`);
    await expect(page.locator("#file-content h2")).toContainText(name);
    await expect(
      page.locator("#file-content .project-description"),
    ).not.toBeEmpty();
    await expect(
      page.locator('#file-content a[href*="github.com"]'),
    ).toHaveCount(0);
  }
});

test("work projects show only their function and stack includes automation, AI training and remote computing", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  for (const [slug, purpose] of [
    ["portale-intranet", "resources by category"],
    ["gestione-segnalazioni", "reports with attachments"],
    ["convertitore-excel-xml", "editable tables"],
    ["trascrizione-vocale", "audio recording"],
    ["coach-ai-lab", "Italian and English"],
    ["remotegpu", "another machine’s graphics card"],
  ]) {
    await command(page, `open ${slug}`);
    await expect(page.locator(".project-description")).toContainText(purpose);
    await expect(page.locator("#file-content")).not.toContainText(
      /Flask|PyTorch|OpenCL|Vulkan|localhost|\.exe|C:\\|ASL|undefined/,
    );
    await expect(page.locator(".project-document a")).toHaveCount(0);
  }
  await command(page, "open portale-intranet");
  await page.screenshot({
    path: ".local/work-project.png",
    animations: "disabled",
  });
  await command(page, "cat stack.json");
  const stack = JSON.parse(
    (await page.locator(".code-block pre").textContent())!,
  );
  expect(stack.developer).toBe("piccardino");
  expect(stack.toolbox.languages).toContain("C#");
  expect(stack.toolbox.web).toContain("Flask");
  expect(stack.toolbox.desktop_and_automation).toContain("PyAutoGUI");
  expect(stack.toolbox.databases_and_data).toContain("Oracle SQL");
  expect(stack.toolbox.ai_and_training).toContain("PyTorch");
  expect(stack.toolbox.ai_and_training).toContain("Whisper / faster-whisper");
  expect(stack.toolbox.local_llms).toEqual(
    expect.arrayContaining([
      "Local LLM setup and configuration",
      "Local inference",
      "Model and tokenizer management",
      "Context and generation settings",
      "CPU / GPU execution",
    ]),
  );
  expect(stack.toolbox.graphics_and_computing).toEqual(
    expect.arrayContaining(["OpenCL", "Vulkan"]),
  );
  await page.screenshot({
    path: ".local/stack-updated.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator("#file-content")
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(false);
  await page.screenshot({
    path: ".local/stack-mobile.png",
    animations: "disabled",
  });
});

test("LinkedIn highlights the photograph and contacts include the supplied email and phone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-engine",
    "webgl",
  );
  const link = page.getByRole("link", {
    name: "Alex Morra on LinkedIn — mountain photograph on the board",
  });
  await expect(link).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/alex-morra-02145a1a4/",
  );
  const screenBefore = await page.locator(".monitor-surface").boundingBox();
  await link.hover();
  await expect(page.locator(".linkedin-highlight")).toHaveCSS("opacity", "1");
  await expect(page.locator(".monitor-highlight")).toHaveCSS("opacity", "0");
  expect(await page.locator(".monitor-surface").boundingBox()).toEqual(
    screenBefore,
  );
  await page.screenshot({
    path: ".local/linkedin-glow.png",
    animations: "disabled",
  });
  await enter(page);
  await command(page, "contact");
  await expect(
    page.locator('#file-content a[href="mailto:alexmorra2002@gmail.com"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('#file-content a[href="tel:+393495274599"]'),
  ).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Alex Morra · LinkedIn", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/alex-morra-02145a1a4/",
  );
  await page.screenshot({
    path: ".local/contacts.png",
    animations: "disabled",
  });
});

test("LinkedIn hover reaches the entire photograph through the empty header across desktop sizes", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.goto("/");
  const link = page.locator(".linkedin-hotspot");
  for (const viewport of [
    { width: 1440, height: 900, engine: "webgl", photoWidth: 1672, photoHeight: 941, linkWidth: 208 },
    { width: 1920, height: 1080, engine: "css", photoWidth: 2365, photoHeight: 665, linkWidth: 157 },
    { width: 1440, height: 600, engine: "css", photoWidth: 2365, photoHeight: 665, linkWidth: 157 },
    { width: 790, height: 884, engine: "css", photoWidth: 941, photoHeight: 1672, linkWidth: 201 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".workspace")).toHaveAttribute(
      "data-engine",
      viewport.engine,
    );
    await page.waitForFunction(({ photoWidth, photoHeight, linkWidth }) => {
      const link = document.querySelector(".linkedin-hotspot")!;
      const scale = Math.max(innerWidth / photoWidth, innerHeight / photoHeight);
      return Math.abs(link.getBoundingClientRect().width - linkWidth * scale) < 0.1;
    }, viewport);
    const photo = (await link.boundingBox())!;
    const screen = await page.locator(".monitor-surface").boundingBox();
    for (const y of [0.04, 0.23, 0.5, 0.96]) {
      for (const x of [0.04, 0.5, 0.96]) {
        const point = {
          x: photo.x + photo.width * x,
          y: photo.y + photo.height * y,
        };
        // Cover fitting crops the top of the photo on wide, short windows.
        if (
          point.x < 0 ||
          point.y < 0 ||
          point.x >= viewport.width ||
          point.y >= viewport.height
        )
          continue;
        await page.mouse.move(point.x, point.y);
        expect(
          await page.evaluate(
            ({ x, y }) =>
              !!document.elementFromPoint(x, y)?.closest(".linkedin-hotspot"),
            point,
          ),
          `${viewport.width}x${viewport.height}, photo point ${x},${y}`,
        ).toBe(true);
        await expect(page.locator(".linkedin-highlight")).toHaveCSS(
          "opacity",
          "1",
        );
        expect(await page.locator(".monitor-surface").boundingBox()).toEqual(
          screen,
        );
      }
    }
    await page.mouse.move(10, viewport.height / 2);
    await expect(page.locator(".linkedin-highlight")).toHaveCSS("opacity", "0.7");
  }
  await link.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(link).toBeFocused();
  await expect(page.locator(".linkedin-highlight")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Left speaker: turn fire sound on", exact: true }).click();
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("mobile uses CSS and keeps navigation and content inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-engine",
    "css",
  );
  await page.screenshot({ path: ".local/desk-mobile.png" });
  await page.locator("#mobile-enter").click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await expect(page.locator(".scene-canvas")).toHaveCount(0);
  await page.locator('.editor-tabs [data-file="projects"]').click();
  await page.getByRole("button", { name: "Open SOMI", exact: true }).click();
  await expect(page.locator("#file-content h2")).toContainText("SOMI");
  const overflow = await page
    .locator("#file-content")
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: ".local/terminal-mobile.png" });
  await command(page, "exit");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
});

test("reduced motion skips WebGL and supports a keyboard-only round trip", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await expect(page.locator(".scene-canvas")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".monitor-hotspot")).toBeFocused();
});

test("unavailable WebGL still enters and returns to the photograph", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return getContext.call(this, type as "2d", ...args);
    } as typeof getContext;
  });
  await page.goto("/");
  await enter(page);
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-engine",
    "css",
  );
  await command(page, "about");
  await expect(page.locator("#file-content h2")).toContainText(
    "behind the prompt",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".desk-photo")).toHaveCSS("opacity", "1");
});

test("resizing in the terminal and interrupting a transition keep the scene usable", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  await page.setViewportSize({ width: 790, height: 884 });
  await page.locator('.editor-tabs [data-file="welcome"]').click();
  expect(
    await page
      .locator("#file-content")
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await page.locator("#mobile-enter").click();
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "entering",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await page.locator("#mobile-enter").click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "monitor");
  await page.keyboard.press("Enter");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
});

test("English is default, language switches preserve the current project and save the preference", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".desk-header [data-language=en]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".desk-intro h1")).toContainText(
    "Make yourself at home",
  );
  await enter(page);
  await command(page, "open portale-intranet");
  await expect(page.locator("#file-content h2")).toContainText("IntraEllipse");
  await expect(page.locator(".project-description")).toContainText(
    "resources by category",
  );
  const tabs = await page.locator(".tab-item").count();
  await page.locator(".terminal-header [data-language=it]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.locator(".workspace")).toHaveAttribute(
    "data-view",
    "terminal",
  );
  await expect(page.locator(".tab-item")).toHaveCount(tabs);
  await expect(page.locator("#file-content h2")).toContainText("IntraEllipse");
  await expect(page.locator(".project-description")).toContainText(
    "risorse per categoria",
  );
  await expect(page.getByLabel("Comando terminale")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".desk-intro h1")).toContainText("Accomodati");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await page.locator(".desk-header [data-language=en]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("projects scroll independently, expand and collapse, and preserve original work names", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  const tree = page.locator(".project-tree");
  const stack = page.locator('.file-tree [data-file="stack"]');
  const stackBefore = await stack.boundingBox();
  await tree.hover();
  await page.mouse.wheel(0, 2500);
  await expect
    .poll(() => tree.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  expect(await stack.boundingBox()).toEqual(stackBefore);
  await expect(stack).toBeInViewport();
  await expect(
    page.locator('.file-tree [data-file="contact"]'),
  ).toBeInViewport();
  await expect(tree).toHaveCSS(
    "scrollbar-color",
    "rgb(56, 94, 73) rgb(8, 24, 15)",
  );
  const workNames = await page
    .locator('.project-group[data-collection="work"] [data-project] span')
    .allTextContents();
  expect(workNames).toEqual([
    "AutoMacro",
    "BACKUP_Ellipse",
    "Dashboard",
    "DB search",
    "HL7",
    "IntraEllipse",
    "LANaccessFilesGUI",
    "Macro Novara",
    "MACRO timer 2.0",
    "RAD ldo GPI",
    "REST_service",
    "SQL Rad PROD & C#",
    "Request",
    "Tool-XML-CSV",
    "WEBAPP Folders",
    "WEBAPP segnalazioni - timer",
    "XLS to XML",
    "ZPL",
    "server_whisper.py",
  ]);
  await page.getByRole("button", { name: "Collapse projects folder" }).click();
  await expect(tree).toBeHidden();
  await page.getByRole("button", { name: "Expand projects folder" }).click();
  await expect(tree).toBeVisible();
  await page.locator('.project-group[data-collection="work"] summary').click();
  await expect(
    page.locator('.project-group[data-collection="work"] .project-group-files'),
  ).toBeHidden();
  await command(page, "projects");
  await expect(
    page.locator('#file-content [data-collection="personal"] .project-folder'),
  ).toHaveCount(14);
  await expect(
    page.locator('#file-content [data-collection="work"] .project-folder'),
  ).toHaveCount(19);
  for (const selector of [".file-tree", "#file-content"])
    await expect(page.locator(selector)).not.toContainText(
      /VolleyVFX Studio|TC Workstation 3D|Laya Volley|BLE Scanner|Assistente documentale|Chat desktop/,
    );
  await page.screenshot({
    path: ".local/projects-updated.png",
    animations: "disabled",
  });
});

test("middle click closes tabs and welcome remains pinned", async ({
  page,
}) => {
  await page.goto("/");
  await enter(page);
  await page
    .locator('.editor-tabs [data-file="welcome"]')
    .click({ button: "middle" });
  await expect(page.locator('.editor-tabs [data-file="welcome"]')).toHaveCount(
    1,
  );
  await command(page, "open somi");
  await page
    .locator('.editor-tabs [data-file="about"]')
    .click({ button: "middle" });
  await expect(page.locator("#file-content h2")).toContainText("SOMI");
  await expect(page.locator('.editor-tabs [data-file="about"]')).toHaveCount(0);
  for (const file of ["somi", "contact", "projects"])
    await page
      .locator(`.editor-tabs [data-file="${file}"]`)
      .click({ button: "middle" });
  await expect(page.locator(".editor-tabs .tab")).toHaveCount(1);
  await expect(page.locator("#current-file")).toHaveText("welcome.md");
  await page.locator('.file-tree [data-file="stack"]').click();
  await expect(page.locator('.editor-tabs [data-file="stack"]')).toHaveCount(1);
  await page
    .getByRole("button", { name: "Close stack.json", exact: true })
    .click();
  await expect(page.locator(".editor-tabs .tab")).toHaveCount(1);
  await expect(page.locator("#file-content h2")).toContainText("Hi, I'm");
});

test("fireflies stay on the desk, ASCII fits, and the fire plays only after being enabled", async ({
  page,
}) => {
  await trackAudio(page);
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (/\/audio\/fireplace-loop\.(ogg|mp3)$/.test(request.url()))
      downloads.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".fireflies")).toBeVisible();
  expect(await page.locator(".fireflies i").count()).toBeGreaterThan(10);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { testAudioContexts: AudioContext[] })
          .testAudioContexts.length,
    ),
  ).toBe(0);
  expect(downloads).toEqual([]);
  const art = page.locator(".mountain");
  expect(await art.textContent()).toMatch(/^[\x20-\x7e·◯\n]+$/);
  expect(["normal", "0px"]).toContain(
    await art.evaluate((el) => getComputedStyle(el).letterSpacing),
  );
  expect(await art.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Left speaker: turn fire sound on", exact: true }).click();
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { testAudioContexts: AudioContext[] })
            .testAudioContexts[0].state,
      ),
    )
    .toBe("running");
  expect(downloads).toHaveLength(1);
  expect(downloads[0]).toContain("fireplace-loop.ogg");
  const recording = await page.evaluate(() => {
    const source = (window as unknown as AudioTrace).testAudioSources[0];
    return {
      loop: source.loop,
      duration: source.buffer!.duration,
      channels: source.buffer!.numberOfChannels,
    };
  });
  expect(recording.loop).toBe(true);
  expect(recording.duration).toBeCloseTo(29.1435, 1);
  expect(recording.channels).toBe(2);
  await enter(page);
  await expect(page.locator(".fireflies")).toBeHidden();
  expect(await page.locator(".fireflies i").first().evaluate(el =>
    el.getAnimations().every(animation => animation.playState === "paused"),
  )).toBe(true);
  await page.getByRole("button", { name: "Disable fire ambience" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { testAudioContexts: AudioContext[] })
            .testAudioContexts[0].state,
      ),
    )
    .toBe("suspended");
  await page.getByRole("button", { name: "Enable fire ambience" }).click();
  await expect(page.locator(".system-sound")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(downloads).toHaveLength(1);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".workspace")).toHaveAttribute("data-view", "desk");
  await expect(page.locator(".fireflies")).toBeVisible();
  expect(await page.locator(".fireflies i").first().evaluate(el => el.getAnimations().length)).toBe(0);
});

test("the fireplace recording also loops with the MP3 browser fallback", async ({
  page,
}) => {
  await trackAudio(page);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function (type: string) {
      return type.includes("ogg") ? "" : original.call(this, type);
    };
  });
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (/\/audio\/fireplace-loop\.(ogg|mp3)$/.test(request.url()))
      downloads.push(request.url());
  });
  await page.goto("/");
  expect(downloads).toEqual([]);
  await page.getByRole("button", { name: "Left speaker: turn fire sound on", exact: true }).click();
  await expect(page.locator(".speaker-hotspot")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(downloads).toHaveLength(1);
  expect(downloads[0]).toContain("fireplace-loop.mp3");
  const recording = await page.evaluate(() => {
    const source = (window as unknown as AudioTrace).testAudioSources[0];
    return { loop: source.loop, duration: source.buffer!.duration };
  });
  expect(recording.loop).toBe(true);
  expect(recording.duration).toBeCloseTo(29.1435, 1);
});
