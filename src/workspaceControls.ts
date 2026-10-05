import { t } from "./i18n";

export class WorkspaceControls {
  private busy = false;
  private clickTimer?: ReturnType<typeof setTimeout>;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private buttons =
    document.querySelectorAll<HTMLButtonElement>(".fullscreen-toggle");

  constructor(
    private root: HTMLElement,
    private icon: (name: string, size?: number) => string,
  ) {
    this.buttons.forEach((button) =>
      button.addEventListener("click", () => void this.toggleFullscreen()),
    );
    document.addEventListener("fullscreenchange", () => this.refreshLanguage());
    const photo = root.querySelector<HTMLAnchorElement>(".linkedin-hotspot")!;
    // Start feedback on the press so it is visible before the native new tab opens.
    photo.addEventListener("pointerdown", (event) => {
      if (event.button === 0) this.animatePhoto();
    });
    photo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.repeat) this.animatePhoto();
    });
    photo.addEventListener("click", () => {
      if (!this.root.classList.contains("linkedin-clicked"))
        this.animatePhoto();
    });
    this.refreshLanguage();
  }

  refreshLanguage() {
    const active = !!document.fullscreenElement;
    const supported =
      !!document.fullscreenEnabled &&
      typeof document.documentElement.requestFullscreen === "function";
    const label = active
      ? t("Exit fullscreen", "Esci da schermo intero")
      : t("Enter fullscreen", "Apri a schermo intero");
    this.buttons.forEach((button) => {
      button.hidden = !supported;
      button.disabled = this.busy;
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", label);
      button.title = label;
      button.innerHTML = this.icon(active ? "minimize" : "maximize", 16);
    });
  }

  private async toggleFullscreen() {
    if (this.busy) return;
    this.busy = true;
    this.refreshLanguage();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      const toast = this.root.querySelector<HTMLElement>(".toast")!;
      toast.textContent = t(
        "Fullscreen is unavailable in this browser.",
        "Lo schermo intero non è disponibile in questo browser.",
      );
      toast.classList.add("visible");
      setTimeout(() => toast.classList.remove("visible"), 3500);
    } finally {
      this.busy = false;
      this.refreshLanguage();
    }
  }

  private animatePhoto() {
    if (this.reduced.matches) return;
    clearTimeout(this.clickTimer);
    this.root.classList.remove("linkedin-clicked");
    // Restart a single, short animation for repeated clicks, without moving the camera.
    void this.root
      .querySelector(".linkedin-click-art")!
      .getBoundingClientRect();
    this.root.classList.add("linkedin-clicked");
    this.clickTimer = setTimeout(
      () => this.root.classList.remove("linkedin-clicked"),
      820,
    );
  }
}
