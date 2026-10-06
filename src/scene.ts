import { gsap } from "gsap";
import { photoScreenRect, sceneConfig, selectPhoto, photoProfile } from "./sceneConfig";
import type { ScreenRect } from "./sceneConfig";
import type * as THREE from "three";

type Three = typeof THREE;
export type WorkspaceView = "desk" | "monitor" | "terminal";

export class WorkspaceScene {
  private three?: Three;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private glow?: THREE.ShaderMaterial;
  private texture?: THREE.Texture;
  private geometry?: THREE.PlaneGeometry;
  private photoMaterial?: THREE.MeshBasicMaterial;
  private monitorGeometry?: THREE.PlaneGeometry;
  private raf = 0;
  private progress = { value: 0 };
  private disposed = false;
  private webglLost = false;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  private compact = matchMedia(
    `(max-width: ${sceneConfig.performance.mobileBreakpoint}px), (pointer: coarse)`,
  );
  private tween?: gsap.core.Tween;
  private observer: ResizeObserver;
  private lastTime = 0;
  private elapsed = 0;
  private engineReady?: Promise<void>;
  private outline: SVGElement;
  private wallpaperToggle: HTMLElement;

  constructor(
    private root: HTMLElement,
    private photo: HTMLImageElement,
    private screen: HTMLElement,
    private hotspot: HTMLButtonElement,
    private onSettled: (view: WorkspaceView) => void,
  ) {
    this.outline = root.querySelector<SVGElement>(".monitor-outline")!;
    this.wallpaperToggle = root.querySelector<HTMLElement>(".wallpaper-toggle")!;
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(root);
    document.addEventListener("visibilitychange", this.visibility);
    this.compact.addEventListener("change", this.modeChange);
    this.reduced.addEventListener("change", this.modeChange);
    this.resize();
  }

  private initialize = async () => {
    try {
      const T = await import("three");
      if (this.disposed) return;
      this.three = T;
      const renderer = new T.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
      this.renderer = renderer;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, sceneConfig.performance.maxDpr),
      );
      renderer.domElement.className = "scene-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.addEventListener(
        "webglcontextlost",
        this.contextLost,
      );
      this.root.insertBefore(renderer.domElement, this.screen);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(
        sceneConfig.camera.fov,
        1,
        sceneConfig.camera.near,
        sceneConfig.camera.far,
      );
      const texture = await new T.TextureLoader().loadAsync(
        sceneConfig.photo.src,
      );
      if (this.disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = T.SRGBColorSpace;
      this.texture = texture;
      const photoH = this.worldHeight;
      this.geometry = new T.PlaneGeometry(sceneConfig.photo.worldWidth, photoH);
      this.photoMaterial = new T.MeshBasicMaterial({ map: texture });
      this.scene.add(new T.Mesh(this.geometry, this.photoMaterial));
      const bounds = this.monitorWorld;
      this.monitorGeometry = new T.PlaneGeometry(bounds.width, bounds.height);
      this.glow = new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uStrength: { value: sceneConfig.monitorPlane.glow },
        },
        vertexShader:
          "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uStrength;
          void main(){float scan=0.5+0.5*sin(vUv.y*1100.0);float edge=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);
          float flicker=0.97+0.03*sin(uTime*1.8);gl_FragColor=vec4(0.15,1.0,0.55,uStrength*(0.4+scan*0.2+edge*0.3)*flicker);}`,
      });
      const monitor = new T.Mesh(this.monitorGeometry, this.glow);
      monitor.position.set(bounds.x, bounds.y, sceneConfig.monitorPlane.z);
      this.scene.add(monitor);
      this.resize();
      this.root.dataset.engine = "webgl";
      if (
        !this.compact.matches &&
        !this.reduced.matches &&
        !document.hidden &&
        this.progress.value < 1
      )
        this.resume();
      this.draw();
    } catch {
      this.releaseRenderer();
      this.root.dataset.engine = "css";
      this.applyFallback();
    }
  };

  private get worldHeight() {
    return (
      (sceneConfig.photo.worldWidth * sceneConfig.photo.height) /
      sceneConfig.photo.width
    );
  }
  private get monitorWorld() {
    const b = sceneConfig.monitorBounds;
    return {
      x: ((b.left + b.right) / 2 - 0.5) * sceneConfig.photo.worldWidth,
      y: (0.5 - (b.top + b.bottom) / 2) * this.worldHeight,
      width: (b.right - b.left) * sceneConfig.photo.worldWidth,
      height: (b.bottom - b.top) * this.worldHeight,
    };
  }
  private get useWebGL() {
    return (
      !!this.renderer &&
      !!this.texture &&
      !this.webglLost &&
      !this.compact.matches &&
      !this.reduced.matches
      && photoProfile === "standard"
    );
  }

  private resize = () => {
    if (this.disposed) return;
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    if (selectPhoto(w, h)) {
      this.photo.src = sceneConfig.photo.src;
      const svg = this.root.querySelector<SVGElement>(".monitor-outline")!;
      svg.setAttribute("viewBox", `0 0 ${sceneConfig.photo.width} ${sceneConfig.photo.height}`);
      for (const [selector, path] of [
        [".monitor-highlight path, .monitor-hit-target", sceneConfig.monitorOutline],
        [".linkedin-highlight path, #linkedin-photo-clip path", sceneConfig.linkedinObject.outline],
        [".cv-highlight path", sceneConfig.cvObject.outline],
        ["#cv-mug-hit-clip path", sceneConfig.cvObject.clipPath],
        [".speaker-highlight path", sceneConfig.speakerObject.outline],
        ["#speaker-hit-clip path", sceneConfig.speakerObject.clipPath],
      ]) svg.querySelectorAll(selector).forEach(el => el.setAttribute("d", path));
      const image = svg.querySelector("image")!;
      image.setAttribute("href", sceneConfig.photo.src);
      image.setAttribute("width", String(sceneConfig.photo.width));
      image.setAttribute("height", String(sceneConfig.photo.height));
      const b = sceneConfig.linkedinObject.bounds;
      (svg.querySelector(".linkedin-click-art") as SVGElement).style.transformOrigin = `${(b.left + b.right) / 2}px ${(b.top + b.bottom) / 2}px`;
    }
    const scale = Math.max(
      w / sceneConfig.photo.width,
      h / sceneConfig.photo.height,
    );
    const outline = this.root.querySelector<SVGElement>(".monitor-outline")!;
    const photoW = sceneConfig.photo.width * scale;
    const photoH = sceneConfig.photo.height * scale;
    Object.assign(outline.style, {
      width: `${photoW}px`,
      height: `${photoH}px`,
      left: `${(w - photoW) / 2}px`,
      top: `${(h - photoH) / 2}px`,
    });
    for (const [selector, b] of [
      [".linkedin-hotspot", sceneConfig.linkedinObject.bounds],
      [".cv-hotspot", sceneConfig.cvObject.bounds],
      [".speaker-hotspot", sceneConfig.speakerObject.bounds],
    ] as const) {
      const object = this.root.querySelector<HTMLElement>(selector)!;
      Object.assign(object.style, {
        left: `${(w - photoW) / 2 + b.left * scale}px`,
        top: `${(h - photoH) / 2 + b.top * scale}px`,
        width: `${(b.right - b.left) * scale}px`,
        height: `${(b.bottom - b.top) * scale}px`,
      });
      if (selector === ".speaker-hotspot") {
        // Keep the caption readable when object-fit crops the left speaker.
        const left = (w - photoW) / 2 + b.left * scale;
        object.style.setProperty("--speaker-label-left", `${Math.max(8 - left, (b.right - b.left) * scale * 0.04)}px`);
      }
    }
    this.renderer?.setSize(w, h);
    this.draw();
    if (photoProfile === "standard" && !this.compact.matches && !this.reduced.matches && !this.engineReady)
      this.engineReady = this.initialize();
  };

  private modeChange = () => {
    this.pause();
    if (photoProfile === "standard" && !this.compact.matches && !this.reduced.matches && !this.engineReady)
      this.engineReady = this.initialize();
    this.draw();
    if (this.useWebGL && this.progress.value < 1 && !document.hidden)
      this.resume();
  };
  private visibility = () => {
    if (document.hidden) this.pause();
    else if (this.progress.value < 1 && this.useWebGL) this.resume();
  };
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.webglLost = true;
    this.pause();
    this.root.dataset.engine = "css";
    this.applyFallback();
  };

  go(view: WorkspaceView) {
    this.tween?.kill();
    if (view === "terminal") {
      this.root.dataset.view = view;
      this.draw();
      this.pause();
      this.onSettled(view);
      return;
    }
    this.root.dataset.view = view === "monitor" ? "entering" : "leaving";
    this.root.classList.remove("monitor-hovered");
    if (this.useWebGL) this.resume();
    const target = view === "monitor" ? 1 : 0;
    this.tween = gsap.to(this.progress, {
      value: target,
      duration: this.reduced.matches
        ? 0.01
        : sceneConfig.motion.duration *
          Math.max(0.25, Math.abs(target - this.progress.value)),
      ease: "power3.inOut",
      onUpdate: () => this.draw(),
      onComplete: () => {
        this.root.dataset.view = view;
        if (view === "monitor") this.pause();
        this.onSettled(view);
      },
    });
  }

  private draw = () => {
    if (this.disposed) return;
    const p = this.progress.value;
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    if (!w || !h) return;
    let rect: ScreenRect;
    if (
      this.useWebGL &&
      this.camera &&
      this.renderer &&
      this.scene &&
      this.three
    ) {
      const T = this.three;
      const aspect = w / h;
      const m = this.monitorWorld;
      const startHeight = Math.min(
        this.worldHeight,
        sceneConfig.photo.worldWidth / aspect,
      );
      const startZ =
        startHeight /
        (2 * Math.tan(T.MathUtils.degToRad(sceneConfig.camera.fov / 2)));
      // Keep the photographed bezel in view instead of zooming past the screen.
      const endHeight =
        Math.max(m.height, m.width / aspect) /
        sceneConfig.zoomTarget.screenCoverage;
      const endZ =
        endHeight /
        (2 * Math.tan(T.MathUtils.degToRad(sceneConfig.zoomTarget.fov / 2)));
      this.camera.aspect = aspect;
      this.camera.fov = T.MathUtils.lerp(
        sceneConfig.camera.fov,
        sceneConfig.zoomTarget.fov,
        p,
      );
      this.camera.position.set(
        T.MathUtils.lerp(sceneConfig.cameraTarget.x, m.x, p),
        T.MathUtils.lerp(sceneConfig.cameraTarget.y, m.y, p),
        T.MathUtils.lerp(startZ, endZ, p),
      );
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
      const topLeft = new T.Vector3(
        m.x - m.width / 2,
        m.y + m.height / 2,
        0,
      ).project(this.camera);
      const bottomRight = new T.Vector3(
        m.x + m.width / 2,
        m.y - m.height / 2,
        0,
      ).project(this.camera);
      rect = {
        left: ((topLeft.x + 1) * w) / 2,
        top: ((1 - topLeft.y) * h) / 2,
        width: ((bottomRight.x - topLeft.x) * w) / 2,
        height: ((topLeft.y - bottomRight.y) * h) / 2,
      };
      this.glow!.uniforms.uTime.value = this.elapsed;
      this.glow!.uniforms.uStrength.value =
        sceneConfig.monitorPlane.glow + Math.sin(p * Math.PI) * 0.08;
      this.renderer.render(this.scene, this.camera);
      this.root.dataset.engine = "webgl";
      this.renderer.domElement.style.display = "";
      this.photo.style.opacity = "0";
    } else {
      rect = this.applyFallback();
    }
    // The object outlines travel with the photograph throughout the close-up.
    const original = photoScreenRect(w, h);
    const zoom = rect.width / original.width;
    const photoScale = Math.max(w / sceneConfig.photo.width, h / sceneConfig.photo.height);
    const photoLeft = (w - sceneConfig.photo.width * photoScale) / 2;
    const photoTop = (h - sceneConfig.photo.height * photoScale) / 2;
    const outlineX = rect.left - photoLeft - (original.left - photoLeft) * zoom;
    const outlineY = rect.top - photoTop - (original.top - photoTop) * zoom;
    this.outline.style.transform = `translate(${outlineX}px, ${outlineY}px) scale(${zoom})`;
    // A portrait close-up crops the monitor's sides. Keep its content inside the
    // visible screen while retaining the photographed bezel above and below it.
    const left = Math.max(0, rect.left);
    const right = Math.min(w, rect.left + rect.width);
    // Keep the preview attached to the physical screen, including when a
    // portrait close-up crops its sides. The interactive terminal can reflow.
    this.screen.style.setProperty("--mini-scale", String(rect.width / 840));
    this.screen.style.setProperty("--mini-offset", `${rect.left - left}px`);
    this.screen.style.setProperty("--mini-quote-size", `${Math.min(14, (right - left - 40) / (24 * 0.6 * rect.width / 840))}px`);
    rect = {
      ...rect,
      left,
      width: Math.max(0, right - left),
    };
    for (const element of [this.screen, this.hotspot]) {
      Object.assign(element.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    }
    const inset = Math.max(7, Math.min(14, rect.width * 0.018));
    this.wallpaperToggle.style.left = `${rect.left + rect.width - inset}px`;
    this.wallpaperToggle.style.top = `${rect.top + rect.height - inset}px`;
    this.root.style.setProperty("--journey", String(p));
    this.root.style.setProperty(
      "--desk-opacity",
      String(Math.max(0, 1 - p * 3)),
    );
    const terminalOpen = this.root.dataset.view === "terminal";
    this.root.style.setProperty("--mini-opacity", terminalOpen ? "0" : "1");
    this.root.style.setProperty("--terminal-opacity", terminalOpen ? "1" : "0");
    this.root.dataset.progress = p.toFixed(3);
  };

  private applyFallback(): ScreenRect {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    const rect = photoScreenRect(w, h);
    const p = this.progress.value;
    const zoom = photoProfile === "portrait"
      ? h / rect.height
      : Math.min(w / rect.width, h / rect.height);
    const scale =
      1 + (zoom * sceneConfig.zoomTarget.screenCoverage - 1) * p;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const tx = (w / 2 - cx) * p;
    const ty = (h / 2 - cy) * p;
    this.photo.style.opacity = "1";
    this.photo.style.transformOrigin = `${cx}px ${cy}px`;
    this.photo.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (this.renderer) this.renderer.domElement.style.display = "none";
    this.root.dataset.engine = "css";
    return {
      left: cx + tx - (rect.width * scale) / 2,
      top: cy + ty - (rect.height * scale) / 2,
      width: rect.width * scale,
      height: rect.height * scale,
    };
  }

  private tick = (time: number) => {
    this.raf = 0;
    const delta = Math.min(50, this.lastTime ? time - this.lastTime : 16.7);
    this.lastTime = time;
    this.elapsed += delta / 1000;
    this.draw();
    if (this.progress.value < 1 && this.useWebGL && !document.hidden)
      this.raf = requestAnimationFrame(this.tick);
  };
  private resume() {
    if (this.disposed || this.raf || document.hidden) return;
    this.lastTime = 0;
    this.root.dataset.renderState = "running";
    this.raf = requestAnimationFrame(this.tick);
  }
  private pause() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.root.dataset.renderState = "paused";
  }
  private releaseRenderer() {
    this.pause();
    this.texture?.dispose();
    this.geometry?.dispose();
    this.monitorGeometry?.dispose();
    this.photoMaterial?.dispose();
    this.glow?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = undefined;
  }
  dispose() {
    this.disposed = true;
    this.tween?.kill();
    this.observer.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.compact.removeEventListener("change", this.modeChange);
    this.reduced.removeEventListener("change", this.modeChange);
    this.releaseRenderer();
  }
}
