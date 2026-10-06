import "./style.css";
import { portfolio } from "./portfolio";
import type { Project } from "./portfolio";
import { PortfolioEditor, fileNames } from "./editor";
import { WorkspaceScene } from "./scene";
import type { WorkspaceView } from "./scene";
import { sceneConfig } from "./sceneConfig";
import { asset } from "./assets";
import {
  language,
  setLanguage,
  t,
  englishStackLabels,
  type Language,
} from "./i18n";
import { FireAudio } from "./fireAudio";
import { wallpaperLandscape, type Wallpaper } from "./ascii";
import { CvViewer } from "./cv";
import { WorkspaceControls } from "./workspaceControls";

const icon = (name: string, size = 18) => {
  const paths: Record<string, string> = {
    folder:
      '<path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20"/>',
    sound:
      '<path d="m11 5-6 4H2v6h3l6 4Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="m11 5-6 4H2v6h3l6 4Zm6 4 5 6m0-6-5 6"/>',
    mountains: '<path d="m2 20 7-12 5 7 3-4 5 9Z"/><circle cx="17" cy="5" r="2"/><path d="m7 11 2 2 2-2"/>',
    sunset: '<path d="M2 17h20M4 21h16M6 17a6 6 0 0 1 12 0M12 3v3M3 7l2 2m16-2-2 2"/>',
    back: '<path d="M9 4H4v16h5m7-15-7 7 7 7m-7-7h13"/>',
    github:
      '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3-.3 6-1.5 6-5a4 4 0 0 0-1-3c.3-1 .3-2-1-3-2 0-3 1-3 1a12 12 0 0 0-6 0S8 4 6 4C5 5 5 6 5.3 7A4 4 0 0 0 4 10c0 3.5 3 4.7 6 5a3.5 3.5 0 0 0-1 3v4"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    branch:
      '<circle cx="6" cy="5" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="19" r="3"/><path d="M6 8v8m12-7a9 9 0 0 1-9 9"/>',
    linkedin:
      '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7m0-10v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    phone:
      '<path d="M8 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-4l-5-2-2 2a14 14 0 0 1-6-6l2-2Z"/>',
    external:
      '<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    maximize: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',
    minimize: '<path d="M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
};
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const projectCount = String(portfolio.projects.length).padStart(2, "0");
const personalProjects = portfolio.projects.filter(
  (p) => p.collection !== "work",
);
const workProjects = portfolio.projects.filter((p) => p.collection === "work");
function stackJson() {
  const keys: Record<string, string> = {
    linguaggi: "languages",
    desktop_e_automazione: "desktop_and_automation",
    database_e_dati: "databases_and_data",
    ai_e_training: "ai_and_training",
    llm_locali: "local_llms",
    grafica_e_calcolo: "graphics_and_computing",
    integrazioni_e_documenti: "integrations_and_documents",
  };
  const toolbox = Object.fromEntries(
    Object.entries(portfolio.stack).map(([key, values]) => [
      language === "en" ? keys[key] || key : key,
      values.map((value) =>
        language === "en" ? englishStackLabels[value] || value : value,
      ),
    ]),
  );
  return esc(
    JSON.stringify(
      { developer: portfolio.handle, toolbox, always_learning: true },
      null,
      2,
    ),
  ).replace(
    /(&quot;.*?&quot;)(:)?|\b(true|false)\b/g,
    (_match, text, colon, boolean) =>
      boolean
        ? `<span class="code-bool">${boolean}</span>`
        : `<span class="${colon ? "code-key" : "code-string"}">${text}</span>${colon || ""}`,
  );
}
let wallpaper: Wallpaper = "mountains";
try {
  if (localStorage.getItem("portfolio-wallpaper") === "sunset") wallpaper = "sunset";
} catch { /* The selector also works when storage is unavailable. */ }
const landscape = wallpaperLandscape(wallpaper);
const languageSwitch = () =>
  `<div class="language-switch" role="group" aria-label="Language / Lingua"><button data-language="en" aria-label="English">EN</button><button data-language="it" aria-label="Italiano">IT</button></div>`;
const fullscreenButton = () =>
  `<button class="fullscreen-toggle" type="button" aria-pressed="false">${icon("maximize", 16)}</button>`;
const fireflyPositions = [
  [9, 24],
  [16, 38],
  [6, 62],
  [22, 73],
  [12, 80],
  [27, 20],
  [32, 12],
  [48, 8],
  [64, 13],
  [79, 27],
  [91, 19],
  [85, 43],
  [96, 62],
  [80, 74],
  [88, 83],
  [70, 82],
  [60, 91],
  [42, 87],
  [20, 52],
  [34, 76],
  [55, 16],
  [73, 18],
  [90, 56],
  [93, 89],
];

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="workspace" data-view="desk" data-engine="css" data-render-state="paused" data-wallpaper="${wallpaper}">
    <img class="desk-photo" src="${sceneConfig.photo.src}" alt="Una scrivania accogliente di sera, con piante, luce calda e un monitor con terminale verde." fetchpriority="high" />
    <div class="desk-shade" aria-hidden="true"></div>
    <div class="fireflies" aria-hidden="true">${fireflyPositions.map(([x, y], i) => `<i style="--x:${x}%;--y:${y}%;--travel-x:${(i % 2 ? -1 : 1) * (20 + (i % 5) * 6)}px;--travel-y:${30 + (i % 4) * 7}px;--duration:${22 + (i % 7) * 2}s;--delay:-${i * 2.3}s;--glow-duration:${5 + (i % 5)}s;--glow-delay:-${i * 1.7}s;--size:${i % 3 ? 3 : 4}px"></i>`).join("")}</div>
    <header class="desk-header desk-chrome">
      <div class="desk-brand"><a class="wordmark" href="${portfolio.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub di ${esc(portfolio.name)}"><span class="brand-symbol">p<span>_</span></span><span>${esc(portfolio.name)}<small>PERSONAL WORKSPACE</small></span></a>${fullscreenButton()}</div>
      <div class="desk-header-right"><span class="local-time"><span class="country-label"></span><time data-clock></time></span>${languageSwitch()}</div>
    </header>
    <div class="monitor-surface">
      <div class="mini-screen" aria-hidden="true">
        <div class="mini-inner">
          <aside class="mini-tree"><span class="mini-title">~/workspace</span><pre>├─ about.md
├─ projects [${projectCount}]
│  ├─ volleyhub
│  ├─ aetheria
│  └─ wollytcg
├─ stack.json
└─ contact.sh</pre><div class="mini-git">$ git status<br>On branch main<br><span>working tree clean</span></div><span class="mini-prompt">${esc(portfolio.handle)}@workspace:~ $ <b class="cursor">▌</b></span></aside>
          <div class="mini-center"><pre class="mountain" data-wallpaper="${wallpaper}">${landscape.html}</pre><p class="mini-quote">“Good software<br>for a better tomorrow.”<b class="cursor">▌</b></p><span class="mini-enter">[ clicca per entrare ]</span></div>
          <aside class="mini-system"><span class="mini-title">SYSTEM</span><p>OS&nbsp;&nbsp;&nbsp;: web<br>SHELL: zsh<br>USER : ${esc(portfolio.handle)}</p><div class="mini-bars">CPU <i style="--bar:12%"></i> 12%<br>MEM <i style="--bar:34%"></i> 34%<br>DISK<i style="--bar:28%"></i> 28%</div><p class="mini-playing">NOW PLAYING<br>late-night thoughts<br><span>// a calmer mind</span></p><div class="equalizer">${Array.from({ length: 22 }, (_, i) => `<i style="--i:${i};--height:${8 + Math.sin(i * 1.7) * 7 + (22 - i) * 0.9}px"></i>`).join("")}</div><time data-date></time><time data-clock></time></aside>
        </div>
      </div>
      <main class="terminal" aria-label="Portfolio nel terminale" aria-hidden="true" inert>
        <header class="terminal-header"><div class="window-lights" aria-hidden="true"><i></i><i></i><i></i></div><span class="terminal-title">${esc(portfolio.handle)}@workspace <span>—</span> ~/portfolio</span>${languageSwitch()}${fullscreenButton()}<button class="return-button">${icon("back", 16)}<span>DESK</span><kbd>ESC</kbd></button></header>
        <div class="terminal-layout">
          <aside class="explorer"><div class="panel-label">EXPLORER <span>•••</span></div><div class="workspace-label">⌄ &nbsp; PORTFOLIO</div><nav class="file-tree" aria-label="File del portfolio">
            <button data-file="welcome" class="file-button active">${icon("file", 16)}welcome.md</button>
            <button data-file="about" class="file-button">${icon("file", 16)}about.md</button>
            <div class="projects-row"><button class="folder-disclosure" aria-expanded="true" aria-controls="project-tree">${icon("chevron", 12)}</button><button data-file="projects" class="file-button folder-button">${icon("folder", 16)}projects<span class="count">${projectCount}</span></button></div>
            <div class="project-tree" id="project-tree">${[
              ["personal", personalProjects],
              ["work", workProjects],
            ]
              .map(
                ([group, projects]) =>
                  `<details class="project-group" data-collection="${group}" open><summary><span class="collection-name"></span><span class="count">${(projects as Project[]).length}</span></summary><div class="project-group-files">${(projects as Project[]).map((p) => `<button data-project="${p.slug}" title="${esc(p.name)}">${icon("folder", 13)}<span>${esc(p.name)}</span></button>`).join("")}</div></details>`,
              )
              .join("")}</div>
            <button data-file="stack" class="file-button">${icon("code", 16)}stack.json</button>
            <button data-file="contact" class="file-button">${icon("file", 16)}contact.sh</button>
          </nav><div class="explorer-bottom"><span>UN PO’ DI CURIOSITÀ.</span><p>Un progetto alla volta.</p><a href="${portfolio.github}" target="_blank" rel="noopener noreferrer">${icon("github", 16)} GitHub</a></div></aside>
          <section class="editor"><nav class="editor-tabs"></nav><div class="breadcrumbs">portfolio <span>/</span> <span id="current-file">welcome.md</span></div><div id="file-content" class="file-content" tabindex="-1"></div>
            <section class="command-terminal" aria-label="Shell interattiva"><div class="shell-label"><span>TERMINAL</span><span>zsh <span aria-hidden="true">— +</span></span></div><div id="command-output" class="command-output" role="log" aria-live="polite"><p><span class="muted">// </span>Digita <b>help</b> per i comandi. Oppure esplora le cartelle.</p></div><form id="command-form" class="command-line"><label for="command-input"><span>${esc(portfolio.handle)}</span><span class="muted">@workspace</span> <span class="prompt-path">~</span> <span class="prompt-symbol">❯</span></label><input id="command-input" type="text" aria-label="Comando terminale" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="help" /></form></section>
          </section>
          <aside class="system-panel"><div class="panel-label">SYSTEM</div><div class="system-heading"><span class="live-dot"></span> workspace online</div><dl><div><dt>USER</dt><dd>${esc(portfolio.handle)}</dd></div><div><dt>LOCATION</dt><dd>Italia</dd></div><div><dt>SHELL</dt><dd>portfolio.sh</dd></div></dl><div class="system-separator"></div><span class="panel-label">LOCAL TIME</span><time class="system-clock" data-clock></time><time class="system-date" data-date></time><div class="system-separator"></div><span class="panel-label">NOW PLAYING</span><p class="track-title">Late-night thoughts</p><span class="track-caption">a calmer mind</span><div class="equalizer">${Array.from({ length: 22 }, (_, i) => `<i style="--i:${i};--height:${10 + Math.sin(i) * 8 + (22 - i)}px"></i>`).join("")}</div><button class="system-sound sound-toggle" aria-pressed="false">${icon("mute", 15)}<span>Attiva l’ambiente</span></button><div class="system-note"><span>// a small reminder</span><p>Stay curious.<br>Keep building.</p><span class="cursor">▌</span></div></aside>
        </div><footer class="terminal-status"><span>${icon("branch", 13)} main <span class="status-check">✓</span></span><span class="status-middle">UTF-8 &nbsp;&nbsp; ${esc(portfolio.role)}</span><span>HTML <span class="status-dot">●</span></span></footer>
      </main>
      <div class="crt-overlay" aria-hidden="true"></div>
    </div>
    <button class="wallpaper-toggle" type="button"></button>
    <button class="monitor-return" type="button" aria-hidden="true" inert>${icon("back", 16)}<span>SCRIVANIA</span><kbd>ESC</kbd></button>
    <svg class="monitor-outline" viewBox="0 0 ${sceneConfig.photo.width} ${sceneConfig.photo.height}" aria-hidden="true">
      <defs><clipPath id="speaker-hit-clip" clipPathUnits="objectBoundingBox"><path d="${sceneConfig.speakerObject.clipPath}" /></clipPath><clipPath id="cv-mug-hit-clip" clipPathUnits="objectBoundingBox"><path d="${sceneConfig.cvObject.clipPath}" clip-rule="evenodd" fill-rule="evenodd" /></clipPath><filter id="monitor-edge-glow" x="-15%" y="-25%" width="130%" height="150%"><feGaussianBlur stdDeviation="9" /></filter><clipPath id="linkedin-photo-clip"><path d="${sceneConfig.linkedinObject.outline}" /></clipPath><filter id="linkedin-photo-shadow" x="-20%" y="-25%" width="140%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#160e07" flood-opacity="0.65" /></filter></defs>
      <g class="monitor-highlight" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path class="monitor-halo" d="${sceneConfig.monitorOutline}" filter="url(#monitor-edge-glow)" />
        <path class="monitor-edge" d="${sceneConfig.monitorOutline}" />
      </g>
      <g class="linkedin-click-art" style="transform-origin: ${(sceneConfig.linkedinObject.bounds.left + sceneConfig.linkedinObject.bounds.right) / 2}px ${(sceneConfig.linkedinObject.bounds.top + sceneConfig.linkedinObject.bounds.bottom) / 2}px">
        <g class="linkedin-photo-lift" filter="url(#linkedin-photo-shadow)"><image href="${sceneConfig.photo.src}" width="${sceneConfig.photo.width}" height="${sceneConfig.photo.height}" clip-path="url(#linkedin-photo-clip)" /></g>
        <g class="linkedin-highlight" fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path class="monitor-halo" d="${sceneConfig.linkedinObject.outline}" filter="url(#monitor-edge-glow)" />
          <path class="monitor-edge" d="${sceneConfig.linkedinObject.outline}" />
        </g>
      </g>
      <g class="cv-highlight" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path class="monitor-halo" d="${sceneConfig.cvObject.outline}" filter="url(#monitor-edge-glow)" />
        <path class="monitor-edge" d="${sceneConfig.cvObject.outline}" />
      </g>
      <g class="speaker-highlight" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path class="monitor-halo" d="${sceneConfig.speakerObject.outline}" filter="url(#monitor-edge-glow)" />
        <path class="monitor-edge" d="${sceneConfig.speakerObject.outline}" />
      </g>
      <path class="monitor-hit-target" d="${sceneConfig.monitorOutline}" fill="transparent" />
    </svg>
    <a class="linkedin-hotspot desk-chrome" href="${portfolio.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn di Alex Morra — fotografia sulla bacheca"><span class="linkedin-object-label">${icon("linkedin", 18)}<span>Alex Morra<small>LINKEDIN</small></span></span></a>
    <button class="cv-hotspot desk-chrome" data-open-cv><span class="cv-object-label">${icon("file", 17)}<span>Alex Morra<small>VIEW MY CV</small></span></span></button>
    <button class="speaker-hotspot desk-chrome" aria-pressed="false"><span class="speaker-object-label"></span></button>
    <button class="monitor-hotspot" aria-label="Entra nel terminale ed esplora il portfolio"></button>
    <footer class="desk-footer desk-chrome"><div class="desk-intro"><span class="eyebrow"><i></i> CODICE, CURIOSITÀ E CAFFÈ.</span><h1>Accomodati.<br><em>Sei nel mio spazio.</em></h1><p>Ogni progetto comincia da qui.</p></div><div class="desk-guide"><span class="guide-number">01 <i>/</i> 02</span><span>La scrivania è solo l’inizio.<br><b>Clicca sul monitor per esplorare.</b></span><div class="guide-key"><kbd>ENTER</kbd><span>per entrare</span></div></div></footer>
    <div class="mobile-entry desk-chrome"><button id="mobile-enter">Entra nel workspace <kbd>↵</kbd></button></div>
    <div class="toast" role="status"></div>
  </div>`;

const root = document.querySelector<HTMLElement>(".workspace")!;
const cv = new CvViewer();
const controls = new WorkspaceControls(root, icon);
root.dataset.pageHidden = String(document.hidden);
const terminal = document.querySelector<HTMLElement>(".terminal")!;
const hotspot = document.querySelector<HTMLButtonElement>(".monitor-hotspot")!;
const wallpaperToggle = root.querySelector<HTMLButtonElement>(".wallpaper-toggle")!;
const monitorReturn = root.querySelector<HTMLButtonElement>(".monitor-return")!;
const input = document.querySelector<HTMLInputElement>("#command-input")!;
const content = document.querySelector<HTMLElement>("#file-content")!;
let targetView: WorkspaceView = "desk";

function refreshMonitorCopy() {
  hotspot.setAttribute("aria-label", targetView === "desk"
    ? t("Move closer to the monitor", "Avvicinati al monitor")
    : t("Enter the terminal and explore the portfolio", "Entra nel terminale ed esplora il portfolio"));
  document.querySelector(".mini-enter")!.textContent = targetView === "desk"
    ? t("[ click to look closer ]", "[ clicca per avvicinarti ]")
    : t("[ click or press Enter ]", "[ clicca o premi Invio ]");
}

const scene = new WorkspaceScene(
  root,
  document.querySelector<HTMLImageElement>(".desk-photo")!,
  document.querySelector<HTMLElement>(".monitor-surface")!,
  hotspot,
  (view) => {
    terminal.inert = view !== "terminal";
    terminal.setAttribute("aria-hidden", String(view !== "terminal"));
    hotspot.inert = view === "terminal";
    hotspot.setAttribute("aria-hidden", String(view === "terminal"));
    wallpaperToggle.inert = view === "terminal";
    wallpaperToggle.setAttribute("aria-hidden", String(view === "terminal"));
    monitorReturn.inert = view !== "monitor";
    monitorReturn.setAttribute("aria-hidden", String(view !== "monitor"));
    if (view === "terminal") content.focus({ preventScroll: true });
    else hotspot.focus({ preventScroll: true });
  },
);

function enter() {
  if (root.dataset.view === "monitor") {
    targetView = "terminal";
    wallpaperToggle.inert = true;
    wallpaperToggle.setAttribute("aria-hidden", "true");
    scene.go("terminal");
    return;
  }
  if (targetView !== "desk") return;
  targetView = "monitor";
  wallpaperToggle.inert = true;
  refreshMonitorCopy();
  document.querySelectorAll<HTMLElement>(".desk-chrome").forEach((el) => {
    el.inert = true;
    el.setAttribute("aria-hidden", "true");
  });
  hotspot.inert = true;
  hotspot.setAttribute("aria-hidden", "true");
  scene.go("monitor");
}
function leave() {
  if (targetView === "desk") return;
  monitorReturn.inert = true;
  targetView = "desk";
  refreshMonitorCopy();
  terminal.inert = true;
  terminal.setAttribute("aria-hidden", "true");
  scene.go("desk");
  document.querySelectorAll<HTMLElement>(".desk-chrome").forEach((el) => {
    el.inert = false;
    el.removeAttribute("aria-hidden");
  });
  hotspot.inert = false;
  hotspot.removeAttribute("aria-hidden");
}
hotspot.addEventListener("click", enter);
const monitorHitTarget = document.querySelector<SVGPathElement>(
  ".monitor-hit-target",
)!;
monitorHitTarget.addEventListener("click", enter);
for (const target of [hotspot, monitorHitTarget]) {
  target.addEventListener("pointerenter", () => {
    if (targetView === "desk" || root.dataset.view === "monitor")
      root.classList.add("monitor-hovered");
  });
  target.addEventListener("pointerleave", (event) => {
    const next = (event as PointerEvent).relatedTarget;
    if (
      !(next instanceof Element) ||
      !next.closest(".monitor-hotspot, .monitor-hit-target")
    ) {
      root.classList.remove("monitor-hovered");
    }
  });
}
document.querySelector("#mobile-enter")!.addEventListener("click", enter);
document.querySelector(".return-button")!.addEventListener("click", leave);
monitorReturn.addEventListener("click", leave);
window.addEventListener("keydown", (event) => {
  // Let the native dialog handle Escape and keep the current workspace view.
  if (cv.isOpen) return;
  // Holding Enter through the zoom must not open the terminal automatically.
  if (event.key === "Enter" && event.repeat && targetView !== "terminal") {
    event.preventDefault();
    return;
  }
  if (event.key === "Escape") {
    if (document.fullscreenElement) {
      event.preventDefault();
      void document.exitFullscreen().catch(() => {});
      return;
    }
    event.preventDefault();
    leave();
  }
  if (
    event.key === "Enter" &&
    (targetView === "desk" || root.dataset.view === "monitor") &&
    !(event.target instanceof HTMLButtonElement) &&
    !(event.target instanceof HTMLAnchorElement) &&
    !(event.target instanceof HTMLInputElement) &&
    !(event.target instanceof HTMLTextAreaElement)
  ) {
    event.preventDefault();
    enter();
  }
});

const editor = new PortfolioEditor(icon, landscape.html, stackJson, wallpaper);
function syncWallpaper() {
  const label = wallpaper === "mountains"
    ? t("Show sunset wallpaper", "Mostra lo sfondo tramonto")
    : t("Show mountain wallpaper", "Mostra lo sfondo montagne");
  wallpaperToggle.setAttribute("aria-label", label);
  wallpaperToggle.title = label;
  wallpaperToggle.innerHTML = `${icon(wallpaper, 15)}<span class="wallpaper-dots" aria-hidden="true"><i></i><i></i></span>`;
}
wallpaperToggle.addEventListener("click", () => {
  wallpaper = wallpaper === "mountains" ? "sunset" : "mountains";
  root.dataset.wallpaper = wallpaper;
  const art = root.querySelector<HTMLElement>(".mountain")!;
  const next = wallpaperLandscape(wallpaper);
  art.innerHTML = next.html;
  art.dataset.wallpaper = wallpaper;
  editor.setLandscape(next.html, wallpaper);
  try { localStorage.setItem("portfolio-wallpaper", wallpaper); } catch { /* Optional preference. */ }
  syncWallpaper();
});
const renderFile = (file: string, focus = false) =>
  editor.renderFile(file, focus);
document.addEventListener("click", (event) => {
  const element = (event.target as Element).closest<HTMLElement>(
    "[data-command], [data-language]",
  );
  if (!element || element.closest("[inert]")) return;
  if (element.dataset.language) {
    setLanguage(element.dataset.language as Language);
    applyLanguage();
    editor.refreshLanguage();
  } else if (element.dataset.command) {
    input.value = element.dataset.command;
    input.focus();
  }
});

const outputs = document.querySelector<HTMLElement>("#command-output")!;
const history: string[] = [];
let historyIndex = 0;
const commands = [
  "help",
  "ls",
  "whoami",
  "about",
  "projects",
  "stack",
  "contact",
  "clear",
  "exit",
];
function log(command: string, response: string) {
  const line = document.createElement("p");
  line.innerHTML = `<span class="logged-prompt">❯ ${esc(command)}</span> <span>${esc(response)}</span>`;
  outputs.append(line);
  while (outputs.children.length > 30) outputs.firstElementChild!.remove();
  outputs.scrollTop = outputs.scrollHeight;
}
document
  .querySelector<HTMLFormElement>("#command-form")!
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    history.push(command);
    historyIndex = history.length;
    input.value = "";
    const [cmd, ...args] = command.toLowerCase().split(/\s+/);
    const argument = args
      .join(" ")
      .replace(/^\.\//, "")
      .replace(/^projects\//, "")
      .replace(/\/$/, "");
    if (cmd === "clear") {
      outputs.replaceChildren();
      return;
    }
    if (cmd === "exit" || cmd === "desk") {
      leave();
      return;
    }
    let response = "";
    if (cmd === "help")
      response = t(
        "help · ls · whoami · about · projects · stack · contact · open <project> · cat <file> · clear · exit",
        "help · ls · whoami · about · projects · stack · contact · open <progetto> · cat <file> · clear · exit",
      );
    else if (cmd === "ls")
      response =
        argument === "projects"
          ? portfolio.projects.map((p) => p.slug + "/").join("  ")
          : "welcome.md  about.md  projects/  stack.json  contact.sh";
    else if (cmd === "whoami") {
      renderFile("about");
      response = `${portfolio.name} — ${t(portfolio.role, "Sviluppatore · esploratore creativo")}`;
    } else if (
      ["about", "projects", "stack", "contact", "welcome"].includes(cmd)
    ) {
      renderFile(cmd);
      response = `${t("Opened", "Aperto")} ${fileNames[cmd]}`;
    } else if (cmd === "open" || cmd === "cat" || cmd === "cd") {
      const project = portfolio.projects.find(
        (p) => p.slug === argument || p.name.toLowerCase() === argument,
      );
      const file = Object.keys(fileNames).find(
        (f) => fileNames[f].replace(/\/$/, "") === argument || f === argument,
      );
      if (project || file) {
        renderFile(project?.slug || file!);
        response = `${t("Opened", "Aperto")} ${argument}`;
      } else if (argument === ".." || argument === "~") {
        renderFile("welcome");
        response = "~/portfolio";
      } else
        response = t(
          `File not found: ${argument || "(no file)"}. Try ls.`,
          `File non trovato: ${argument || "(nessun file)"}. Prova ls.`,
        );
    } else
      response = t(
        `Unknown command: ${cmd}. Type help.`,
        `Comando sconosciuto: ${cmd}. Digita help.`,
      );
    log(command, response);
  });
input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex] || "";
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = history[historyIndex] || "";
  } else if (event.key === "Tab" && input.value) {
    const options = [
      ...commands,
      ...portfolio.projects.map((p) => `open ${p.slug}`),
    ];
    const matches = options.filter((c) =>
      c.startsWith(input.value.toLowerCase()),
    );
    if (matches.length === 1) {
      event.preventDefault();
      input.value = matches[0];
    }
  }
});

function updateClock() {
  const now = new Date();
  const locale = language === "en" ? "en-GB" : "it-IT";
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Rome",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
  document.querySelectorAll<HTMLTimeElement>("[data-clock]").forEach((el) => {
    el.textContent = time;
    el.dateTime = now.toISOString();
  });
  document.querySelectorAll<HTMLTimeElement>("[data-date]").forEach((el) => {
    el.textContent = date;
    el.dateTime = now.toISOString();
  });
}
updateClock();
const clockInterval = setInterval(updateClock, 30000);

function applyLanguage() {
  cv.refreshLanguage();
  controls.refreshLanguage();
  document.documentElement.lang = language;
  const copy: Record<string, string> = {
    ".wordmark small": t("PERSONAL WORKSPACE", "WORKSPACE PERSONALE"),
    ".country-label": t("ITALY", "ITALIA"),
    ".mini-playing": t(
      "NOW PLAYING<br>crackling fire<br><span>// a calmer mind</span>",
      "IN ASCOLTO<br>fuoco scoppiettante<br><span>// un po’ di calma</span>",
    ),
    ".return-button span": t("DESK", "SCRIVANIA"),
    ".monitor-return span": t("DESK", "SCRIVANIA"),
    ".explorer-bottom > span": t("A LITTLE CURIOSITY.", "UN PO’ DI CURIOSITÀ."),
    ".explorer-bottom p": t(
      "One project at a time.",
      "Un progetto alla volta.",
    ),
    ".system-panel dl div:nth-child(2) dd": t("Italy", "Italia"),
    ".track-title": t("Crackling fire", "Fuoco scoppiettante"),
    ".track-caption": t("a calmer mind", "un po’ di calma"),
    ".system-note > span:first-child": t(
      "// a small reminder",
      "// un piccolo promemoria",
    ),
    ".system-note p": t(
      "Stay curious.<br>Keep building.",
      "Resta curioso.<br>Continua a costruire.",
    ),
    ".status-middle": `UTF-8 &nbsp;&nbsp; ${esc(t(portfolio.role, "Sviluppatore · esploratore creativo"))}`,
    ".desk-intro .eyebrow": `<i></i> ${t("CODE, CURIOSITY & COFFEE.", "CODICE, CURIOSITÀ E CAFFÈ.")}`,
    ".desk-intro h1": t(
      "Make yourself at home.<br><em>This is my workspace.</em>",
      "Accomodati.<br><em>Sei nel mio spazio.</em>",
    ),
    ".desk-intro p": t(
      "Every project starts here.",
      "Ogni progetto comincia da qui.",
    ),
    ".desk-guide > span:nth-child(2)": t(
      "The desk is just the beginning.<br><b>Click the monitor to explore.</b>",
      "La scrivania è solo l’inizio.<br><b>Clicca sul monitor per esplorare.</b>",
    ),
    ".guide-key > span": t("to enter", "per entrare"),
    "#mobile-enter": `${t("Enter the workspace", "Entra nel workspace")} <kbd>↵</kbd>`,
    "#command-output > p:not(:has(.logged-prompt))": `<span class="muted">// </span>${t("Type <b>help</b> for commands. Or explore the folders.", "Digita <b>help</b> per i comandi. Oppure esplora le cartelle.")}`,
  };
  for (const [selector, value] of Object.entries(copy)) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = value;
  }
  const labels: Record<string, string> = {
    ".wordmark": t(
      `GitHub of ${portfolio.name}`,
      `GitHub di ${portfolio.name}`,
    ),
    ".terminal": t("Terminal portfolio", "Portfolio nel terminale"),
    ".return-button": t("Return to desk", "Torna alla scrivania"),
    ".monitor-return": t("Return to desk", "Torna alla scrivania"),
    ".file-tree": t("Portfolio files", "File del portfolio"),
    ".command-terminal": t("Interactive shell", "Shell interattiva"),
    "#command-input": t("Terminal command", "Comando terminale"),
    ".linkedin-hotspot": t(
      "Alex Morra on LinkedIn — mountain photograph on the board",
      "LinkedIn di Alex Morra — fotografia sulla bacheca",
    ),
  };
  for (const [selector, value] of Object.entries(labels))
    document.querySelector(selector)?.setAttribute("aria-label", value);
  refreshMonitorCopy();
  syncWallpaper();
  document.querySelector<HTMLImageElement>(".desk-photo")!.alt = t(
    "A cosy desk in the evening, with plants, warm lights and a green terminal monitor.",
    "Una scrivania accogliente di sera, con piante, luce calda e un monitor con terminale verde.",
  );
  document
    .querySelector('meta[name="description"]')!
    .setAttribute(
      "content",
      t(
        "Step into my workspace. An interactive portfolio of code, curiosity and small details.",
        "Entra nella mia workstation. Un portfolio interattivo tra codice, curiosità e piccoli dettagli.",
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-language]")
    .forEach((el) =>
      el.setAttribute("aria-pressed", String(el.dataset.language === language)),
    );
  // System labels retain their positions and values when switching languages.
  const panelLabels = document.querySelectorAll<HTMLElement>(
    ".system-panel > .panel-label",
  );
  if (panelLabels[1])
    panelLabels[1].textContent = t("LOCAL TIME", "ORA LOCALE");
  if (panelLabels[2]) panelLabels[2].textContent = t("AMBIENCE", "AMBIENTE");
  updateClock();
  syncSound();
}

const fire = new FireAudio();
function syncSound() {
  root.classList.toggle("sound-on", fire.enabled);
  const speaker = root.querySelector<HTMLButtonElement>(".speaker-hotspot")!;
  speaker.disabled = fire.busy;
  speaker.setAttribute("aria-busy", String(fire.busy));
  speaker.setAttribute("aria-pressed", String(fire.enabled));
  speaker.setAttribute("aria-label", fire.enabled
    ? t("Left speaker: turn fire sound off", "Speaker sinistro: spegni il suono del fuoco")
    : t("Left speaker: turn fire sound on", "Speaker sinistro: accendi il suono del fuoco"));
  const speakerLabel = fire.busy
    ? t("LOADING…", "CARICAMENTO…")
    : fire.enabled ? t("FIRE ON", "FUOCO ON") : t("FIRE OFF", "FUOCO OFF");
  const speakerHint = fire.enabled ? t("CLICK TO MUTE", "CLICCA PER SPEGNERE") : t("CLICK TO PLAY", "CLICCA PER ACCENDERE");
  speaker.querySelector(".speaker-object-label")!.innerHTML = `${icon(fire.enabled ? "sound" : "mute", 18)}<span>${speakerLabel}<small>${speakerHint}</small></span>`;
  document
    .querySelectorAll<HTMLButtonElement>(".sound-toggle")
    .forEach((el) => {
      el.disabled = fire.busy;
      el.setAttribute("aria-busy", String(fire.busy));
      el.setAttribute("aria-pressed", String(fire.enabled));
      el.setAttribute(
        "aria-label",
        fire.enabled
          ? t("Disable fire ambience", "Disattiva il suono del fuoco")
          : t("Enable fire ambience", "Attiva il suono del fuoco"),
      );
      const label =
        fire.busy && !fire.enabled
          ? t("Loading fire…", "Caricamento del fuoco…")
          : el.classList.contains("system-sound")
            ? fire.enabled
              ? t("Fire is crackling", "Il fuoco scoppietta")
              : t("Light the fire", "Accendi il fuoco")
            : fire.enabled
              ? t("FIRE ON", "FUOCO ON")
              : t("FIRE OFF", "FUOCO OFF");
      el.innerHTML = `${icon(fire.enabled ? "sound" : "mute", 16)}<span>${label}</span>`;
    });
}
async function toggleSound() {
  try {
    const playback = fire.toggle();
    syncSound();
    await playback;
  } catch {
    const toast = document.querySelector<HTMLElement>(".toast")!;
    toast.textContent = t(
      "Sound is unavailable in this browser.",
      "Il suono non è disponibile in questo browser.",
    );
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 3500);
  } finally {
    syncSound();
  }
}
document
  .querySelectorAll(".sound-toggle, .speaker-hotspot")
  .forEach((el) => el.addEventListener("click", toggleSound));
document.addEventListener("visibilitychange", () => {
  root.dataset.pageHidden = String(document.hidden);
  void fire.visibility(!document.hidden).catch(() => {});
});
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    scene.dispose();
    clearInterval(clockInterval);
    fire.dispose();
  }
});
applyLanguage();
