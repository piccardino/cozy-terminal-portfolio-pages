import { asset } from "./assets";
import { t } from "./i18n";

export class CvViewer {
  private dialog = document.createElement("dialog");
  private loaded = false;
  private zoomed = false;

  constructor() {
    this.dialog.className = "cv-dialog";
    this.dialog.setAttribute("aria-labelledby", "cv-title");
    this.dialog.innerHTML = `<header class="cv-header"><div><span class="cv-kicker">CURRICULUM VITAE</span><h2 id="cv-title">Alex Morra</h2></div><div class="cv-actions"><button class="cv-zoom" aria-pressed="false"></button><a class="cv-download" href="${asset("cv/Alex-Morra-CV.pdf")}" download="Alex-Morra-CV.pdf"></a><button class="cv-close" autofocus>×</button></div></header><div class="cv-pages" tabindex="0"></div>`;
    document.body.append(this.dialog);
    document.addEventListener("click", (event) => {
      const trigger = (event.target as Element).closest("[data-open-cv]");
      if (trigger && !trigger.closest("[inert]")) this.open();
    });
    this.dialog
      .querySelector(".cv-close")!
      .addEventListener("click", () => this.dialog.close());
    this.dialog.querySelector(".cv-zoom")!.addEventListener("click", () => {
      this.zoomed = !this.zoomed;
      this.dialog
        .querySelector(".cv-pages")!
        .classList.toggle("is-zoomed", this.zoomed);
      this.refreshLanguage();
    });
    this.dialog.addEventListener("click", (event) => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        this.dialog.close();
    });
    this.refreshLanguage();
  }

  get isOpen() {
    return this.dialog.open;
  }

  private open() {
    if (this.dialog.open) return;
    if (!this.loaded) {
      this.dialog.querySelector(".cv-pages")!.innerHTML = [1, 2]
        .map(
          (page) =>
            `<figure class="cv-page"><img src="${asset(`cv/cv-page-${page}.webp`)}" width="1800" height="2544" decoding="async" alt="" /><figcaption data-cv-page="${page}"></figcaption></figure>`,
        )
        .join("");
      this.loaded = true;
    }
    this.zoomed = false;
    const pages = this.dialog.querySelector(".cv-pages")!;
    pages.classList.remove("is-zoomed");
    this.refreshLanguage();
    this.dialog.showModal();
    pages.scrollTo(0, 0);
  }

  refreshLanguage() {
    const zoom = this.dialog.querySelector<HTMLButtonElement>(".cv-zoom")!;
    zoom.textContent = this.zoomed
      ? t("Fit", "Adatta")
      : t("Zoom", "Ingrandisci");
    zoom.setAttribute("aria-pressed", String(this.zoomed));
    this.dialog.querySelector(".cv-download")!.textContent = t(
      "Download PDF",
      "Scarica PDF",
    );
    this.dialog
      .querySelector(".cv-close")!
      .setAttribute("aria-label", t("Close CV", "Chiudi CV"));
    this.dialog
      .querySelector(".cv-pages")!
      .setAttribute("aria-label", t("CV pages", "Pagine del CV"));
    this.dialog
      .querySelectorAll<HTMLElement>("[data-cv-page]")
      .forEach((caption) => {
        const page = caption.dataset.cvPage;
        caption.textContent = t(`Page ${page} of 2`, `Pagina ${page} di 2`);
        caption.parentElement!.querySelector("img")!.alt = t(
          `Alex Morra's CV, page ${page} of 2, in Italian`,
          `CV di Alex Morra, pagina ${page} di 2`,
        );
      });
    document.querySelector(".cv-object-label small")!.textContent = t(
      "VIEW MY CV",
      "LEGGI IL MIO CV",
    );
    document
      .querySelector(".cv-hotspot")!
      .setAttribute(
        "aria-label",
        t(
          "Open Alex Morra's CV — coffee mug",
          "Apri il CV di Alex Morra — tazza di caffè",
        ),
      );
  }
}
