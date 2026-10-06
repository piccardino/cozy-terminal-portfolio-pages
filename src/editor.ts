import { portfolio, type Project } from "./portfolio";
import { englishProjects, language, t } from "./i18n";
import type { Wallpaper } from "./ascii";

export const fileNames: Record<string, string> = {
  welcome: "welcome.md",
  about: "about.md",
  projects: "projects/",
  stack: "stack.json",
  contact: "contact.sh",
};
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const personal = portfolio.projects.filter((p) => p.collection !== "work");
const work = portfolio.projects.filter((p) => p.collection === "work");
const featured = portfolio.projects.filter((p) => p.featured);
const localProject = (p: Project): Project =>
  language === "en" ? { ...p, ...englishProjects[p.slug] } : p;
const projectLabel = (p: Project) =>
  p.language ||
  (p.collection === "work"
    ? t("Work project", "Progetto lavorativo")
    : t("Personal project", "Progetto personale"));

export class PortfolioEditor {
  private content = document.querySelector<HTMLElement>("#file-content")!;
  private tabs = document.querySelector<HTMLElement>(".editor-tabs")!;
  private openTabs = ["welcome", "about", "projects", "contact"];
  activeFile = "welcome";
  constructor(
    private icon: (name: string, size?: number) => string,
    private landscapeHtml: string,
    private stackJson: () => string,
    private wallpaper: Wallpaper = "mountains",
  ) {
    document.addEventListener("click", (event) => {
      const element = (event.target as Element).closest<HTMLElement>(
        "[data-close-tab], [data-file], [data-project]",
      );
      if (!element || element.closest("[inert]")) return;
      if (element.dataset.closeTab) {
        this.closeTab(element.dataset.closeTab);
        return;
      }
      this.renderFile(element.dataset.project || element.dataset.file!, true);
    });
    this.tabs.addEventListener("mousedown", (event) => {
      if (event.button === 1) event.preventDefault();
    });
    this.tabs.addEventListener("auxclick", (event) => {
      if (event.button !== 1) return;
      event.preventDefault();
      const tab = (event.target as Element).closest<HTMLElement>("[data-tab]");
      if (tab) this.closeTab(tab.dataset.tab!);
    });
    const disclosure =
      document.querySelector<HTMLButtonElement>(".folder-disclosure")!;
    disclosure.addEventListener("click", () => {
      const tree = document.querySelector<HTMLElement>(".project-tree")!;
      tree.hidden = !tree.hidden;
      disclosure.setAttribute("aria-expanded", String(!tree.hidden));
      this.disclosureLabel();
    });
    this.refreshLanguage();
  }
  setLandscape(html: string, wallpaper: Wallpaper) {
    this.landscapeHtml = html;
    this.wallpaper = wallpaper;
    const art = this.content.querySelector<HTMLElement>(".welcome-mountain");
    if (art) {
      art.innerHTML = html;
      art.dataset.wallpaper = wallpaper;
    }
  }
  private disclosureLabel() {
    const disclosure =
      document.querySelector<HTMLButtonElement>(".folder-disclosure")!;
    disclosure.setAttribute(
      "aria-label",
      disclosure.getAttribute("aria-expanded") === "true"
        ? t("Collapse projects folder", "Chiudi la cartella projects")
        : t("Expand projects folder", "Espandi la cartella projects"),
    );
  }
  refreshLanguage() {
    document.querySelector<HTMLElement>(
      '.project-group[data-collection="personal"] .collection-name',
    )!.textContent = t("Personal", "Personali");
    document.querySelector<HTMLElement>(
      '.project-group[data-collection="work"] .collection-name',
    )!.textContent = t("Work", "Lavorativi");
    document
      .querySelectorAll<HTMLElement>(".project-tree [data-project]")
      .forEach((el) => {
        const p = localProject(
          portfolio.projects.find((p) => p.slug === el.dataset.project)!,
        );
        el.querySelector("span")!.textContent = p.name;
        el.title = p.name;
      });
    this.tabs.setAttribute("aria-label", t("Open files", "File aperti"));
    this.disclosureLabel();
    const scroll = this.content.scrollTop;
    this.renderFile(this.activeFile);
    this.content.scrollTop = scroll;
  }
  private renderTabs() {
    this.tabs.innerHTML = this.openTabs
      .map((file) => {
        const p = portfolio.projects.find((p) => p.slug === file);
        const name = p
          ? localProject(p).name
          : fileNames[file].replace(/\/$/, "");
        return `<div class="tab-item" data-tab="${file}"><button class="tab${file === this.activeFile ? " active" : ""}" data-file="${file}" ${file === this.activeFile ? 'aria-current="page"' : ""}>${this.icon(p || file === "projects" ? "folder" : "file", 14)}<span>${esc(name)}</span></button>${file === "welcome" ? "" : `<button class="tab-close" data-close-tab="${file}" aria-label="${esc(t("Close", "Chiudi") + " " + name)}" title="${esc(t("Close · middle click", "Chiudi · click rotellina"))}">×</button>`}</div>`;
      })
      .join("");
  }
  private closeTab(file: string) {
    if (file === "welcome") return;
    const index = this.openTabs.indexOf(file);
    if (index < 0) return;
    this.openTabs.splice(index, 1);
    if (this.activeFile === file)
      this.renderFile(this.openTabs[Math.max(0, index - 1)], true);
    else this.renderTabs();
  }
  private cards(projects: Project[]) {
    return `<div class="project-grid">${projects
      .map((original, i) => {
        const p = localProject(original);
        return `<button class="project-folder" data-project="${p.slug}" aria-label="${t("Open", "Apri")} ${esc(p.name)}"><div class="folder-top">${this.icon("folder", 37)}<span>${String(i + 1).padStart(2, "0")}</span></div><h3>${esc(p.name)}</h3><p>${esc(projectLabel(p))}${p.siteUrl ? " · live" : ""}</p><span class="folder-open">${t("Open project", "Apri progetto")} ${this.icon("chevron", 13)}</span></button>`;
      })
      .join("")}</div>`;
  }
  renderFile(file: string, focus = false) {
    const cvLink = `<button class="text-button" data-open-cv>${this.icon("file", 16)} ${t("View my CV", "Leggi il mio CV")}</button>`;
    const original = portfolio.projects.find((p) => p.slug === file);
    if (!original && !fileNames[file]) return;
    this.activeFile = file;
    if (!this.openTabs.includes(file)) this.openTabs.push(file);
    this.renderTabs();
    this.tabs
      .querySelector<HTMLElement>(".tab.active")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    document
      .querySelectorAll<HTMLElement>(".file-tree [data-file]")
      .forEach((el) => {
        const selected =
          el.dataset.file === file ||
          (!!original && el.dataset.file === "projects");
        el.classList.toggle("active", selected);
        if (selected) el.setAttribute("aria-current", "page");
        else el.removeAttribute("aria-current");
      });
    document
      .querySelectorAll<HTMLElement>(".project-tree [data-project]")
      .forEach((el) =>
        el.classList.toggle("selected", el.dataset.project === file),
      );
    document.querySelector("#current-file")!.textContent = original
      ? `projects / ${original.name} / README.md`
      : fileNames[file];
    if (original) this.content.innerHTML = this.project(localProject(original));
    else if (file === "welcome")
      this.content.innerHTML = `<div class="document welcome-document"><span class="document-kicker">// HELLO, WORLD.</span><div class="welcome-top"><div><h2>${t("Hi, I'm", "Ciao, sono")}<br><span>${esc(portfolio.name)}<b class="cursor">_</b></span></h2><p class="welcome-role">${esc(t(portfolio.role, "Sviluppatore · esploratore creativo"))}</p></div><pre class="welcome-mountain" data-wallpaper="${this.wallpaper}" aria-hidden="true">${this.landscapeHtml}</pre></div><p class="document-lead">${t("Ideas, code.<br>One project at a time.", "Idee, codice.<br>Un progetto alla volta.")}</p><p class="document-text">${t("Welcome to my little corner of the internet.<br>Open a folder, explore the projects or type a command.", "Benvenuto nel mio piccolo angolo di internet.<br>Apri una cartella, dai un’occhiata ai progetti o scrivi un comando.")}</p><div class="section-line"><span>${t("FEATURED", "IN PRIMO PIANO")}</span><span>${featured.length} ${t("projects", "progetti")}</span></div>${this.cards(featured)}<div class="welcome-footer"><button class="text-button" data-file="projects">${this.icon("folder", 16)}${t(`Explore all ${portfolio.projects.length} projects`, `Esplora tutti i ${portfolio.projects.length} progetti`)}</button><p class="document-footnote"><span>tip:</span> ${t("try", "prova")} <button class="inline-command" data-command="whoami">whoami</button>.</p></div></div>`;
    else if (file === "about")
      this.content.innerHTML = `<article class="document"><span class="document-kicker">// ABOUT.MD</span><h2>${t("The person<br><span>behind the prompt.</span>", "La persona<br><span>dietro al prompt.</span>")}</h2><p class="document-lead">${esc(portfolio.name)}</p><p class="document-text bio">${esc(t("I like exploring where code meets experience. This is my space: ideas to try, details to care for and projects taking shape.", portfolio.bio))}</p><div class="section-line"><span>${t("MY APPROACH", "IL MIO APPROCCIO")}</span></div><div class="about-values"><div><span>01</span><h3>${t("Explore", "Esplorare")}</h3><p>${t("Start with a question. Try, observe, learn.", "Partire da una domanda. Provare, osservare, imparare.")}</p></div><div><span>02</span><h3>${t("Build", "Costruire")}</h3><p>${t("Turn an idea into something you can use.", "Trasformare un’idea in qualcosa che si può usare.")}</p></div><div><span>03</span><h3>${t("Care", "Curare")}</h3><p>${t("Give even the smallest details some attention.", "Dare attenzione anche ai dettagli più piccoli.")}</p></div></div><div class="about-links"><button class="text-button" data-file="stack">${this.icon("code", 16)} ${t("Explore the stack", "Esplora lo stack")}</button>${cvLink}</div></article>`;
    else if (file === "projects")
      this.content.innerHTML = `<article class="document"><span class="document-kicker">// LS ~/PORTFOLIO/PROJECTS</span><h2>${t("Small worlds.<br><span>Real projects.</span>", "Piccoli mondi.<br><span>Progetti reali.</span>")}</h2><p class="document-text">${t("Personal ideas and tools built at work.<br>Open a folder to learn what it does, explore the code or visit its website.", "Idee personali e strumenti costruiti al lavoro.<br>Apri una cartella per conoscere il progetto, esplorare il codice o visitare il sito.")}</p><section data-collection="personal"><div class="section-line"><span>${t("PERSONAL PROJECTS", "PROGETTI PERSONALI")}</span><span>${personal.length} ${t("projects", "progetti")}</span></div>${this.cards(personal)}</section><section data-collection="work"><div class="section-line"><span>${t("WORK PROJECTS", "PROGETTI LAVORATIVI")}</span><span>${work.length} ${t("projects", "progetti")}</span></div>${this.cards(work)}</section><p class="document-footnote">${t("Available websites and public repositories open from each project’s page.", "I siti disponibili e le repository pubbliche si aprono dalla scheda del progetto.")}</p></article>`;
    else if (file === "stack")
      this.content.innerHTML = `<article class="document"><span class="document-kicker">// STACK.JSON</span><h2>${t("The tools<br><span>on my desk.</span>", "Gli strumenti<br><span>sulla scrivania.</span>")}</h2><p class="document-text">${t("Languages and technologies behind the web projects, work tools and AI labs. My skills also include setting up local LLMs, managing models and tokenizers, configuring context and generation settings, and running inference on CPU or GPU.", "Linguaggi e tecnologie dei progetti web, degli strumenti di lavoro e dei laboratori AI. Le mie competenze includono anche la configurazione di LLM in locale, la gestione di modelli e tokenizer, i parametri di contesto e generazione e l’inferenza su CPU o GPU.")}</p><div class="code-block"><div class="code-block-label">stack.json <span>JSON</span></div><pre>${this.stackJson()}</pre></div></article>`;
    else
      this.content.innerHTML = `<article class="document"><span class="document-kicker">// CONTACT.SH</span><h2>${t("Good ideas<br><span>start with a conversation.</span>", "Le belle idee<br><span>iniziano parlando.</span>")}</h2><p class="document-text">${t("Send me a message, call me or find me on LinkedIn.<br>For code and experiments, there’s GitHub.", "Scrivimi, chiamami o raggiungimi su LinkedIn.<br>Per il codice e gli esperimenti, c’è GitHub.")}</p>${cvLink}<div class="contact-links"><div class="contact-link"><span>$ send mail</span><a href="mailto:${esc(portfolio.email)}">${this.icon("mail", 23)}${esc(portfolio.email)}</a></div><div class="contact-link"><span>$ call alex</span><a href="tel:${portfolio.phoneHref}">${this.icon("phone", 23)}${esc(portfolio.phone)}</a></div><div class="contact-link"><span>$ open linkedin</span><a href="${portfolio.linkedin}" target="_blank" rel="noopener noreferrer">${this.icon("linkedin", 23)}Alex Morra · LinkedIn</a></div><div class="contact-link"><span>$ open github</span><a href="${portfolio.github}" target="_blank" rel="noopener noreferrer">${this.icon("github", 23)}github.com/${esc(portfolio.handle)}</a></div></div><p class="document-footnote">${t("The mountain photograph on the board also opens LinkedIn.<br>Your desk is waiting: press", "Anche la fotografia delle montagne sulla bacheca apre LinkedIn.<br>La scrivania ti aspetta: premi")} <kbd>ESC</kbd>.</p></article>`;
    this.content.scrollTop = 0;
    if (focus) this.content.focus({ preventScroll: true });
  }
  private project(p: Project) {
    const repository = p.visibility === "public" ? p.repositoryUrl : undefined;
    const siteName = p.siteUrl?.startsWith("https://")
      ? new URL(p.siteUrl).hostname
      : "portfolio / workspace";
    const preview = repository
      ? `<span class="code-dim">$ git clone</span><span>${esc(repository)}.git</span><span class="code-dim">$ cd ${esc(p.slug)}</span><span class="repo-ready">${t("Public code, ready to explore.", "Codice pubblico, pronto da esplorare.")}<span class="cursor">▌</span></span>`
      : p.siteUrl
        ? `<span class="code-dim">$ open ${esc(siteName)}</span><span class="repo-ready">${t("This project is online.", "Il progetto è online.")}</span><span class="private-note">${t("The source code is private. You can explore the public website.", "Il codice di questo progetto è privato. Puoi esplorare il sito pubblico.")}</span>`
        : `<span class="code-dim">$ project info</span><span class="private-note">${t("Private code. There is no public demo for this project.", "Codice privato. Per questo progetto non è disponibile una demo pubblica.")}</span><button class="text-button" data-file="contact">${t("Contact me to learn more", "Contattami per saperne di più")}</button>`;
    const siteLabel =
      language === "it"
        ? p.siteLabel || "Visita il sito"
        : p.siteUrl?.includes("github.io")
          ? "Open demo on Pages"
          : p.slug === "cozy-terminal-portfolio"
            ? "Reopen workspace"
            : "Visit website";
    return `<article class="document project-document"><button class="project-back" data-file="projects">${this.icon("folder", 16)} projects /</button><span class="document-kicker">// README.MD</span><h2>${esc(p.name)}<span class="project-title-dot">.</span></h2><div class="tags">${p.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div><p class="document-text project-description">${esc(p.description)}</p><div class="repo-preview"><div class="repo-preview-head">${this.icon(repository ? "github" : "folder", 18)} ${repository ? `${esc(portfolio.handle)} / ${esc(repository.split("/").at(-1)!)}` : esc(p.name)}</div><div class="repo-preview-body">${preview}</div><footer><span>${p.language ? '<i class="language-dot"></i>' : ""}${esc(projectLabel(p))}</span><span>${p.visibility === "public" ? t("PUBLIC CODE", "CODICE PUBBLICO") : t("PRIVATE CODE", "CODICE PRIVATO")}</span></footer></div><div class="project-actions">${p.siteUrl ? `<a class="primary-link" href="${esc(p.siteUrl)}" target="_blank" rel="noopener noreferrer">${this.icon("external", 18)}${esc(siteLabel)}</a>` : ""}${repository ? `<a class="${p.siteUrl ? "secondary-link" : "primary-link"}" href="${esc(repository)}" target="_blank" rel="noopener noreferrer">${this.icon("github", 18)}${t("View source on GitHub", "Esplora il codice su GitHub")}</a>` : ""}</div></article>`;
  }
}
