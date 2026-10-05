/** Bounds are measured in the supplied photograph, never viewport pixels.
 *  Change these values to calibrate a replacement photograph. */
import { asset } from "./assets";

const mugBounds = { left: 1427, top: 621, right: 1608, bottom: 779 };
const mugSilhouette =
  "M1429 631 C1433 621 1534 620 1556 633 C1560 636 1561 641 1561 650 C1590 651 1608 667 1608 696 C1608 725 1596 747 1560 752 L1559 763 C1558 781 1434 782 1429 761 L1427 641 Q1427 635 1429 631 Z " +
  "M1560 670 C1566 659 1586 659 1593 680 C1600 703 1587 740 1570 740 Q1561 740 1560 733 Q1559 706 1560 670 Z";
const mugRim = "M1428 631 C1447 642 1536 644 1558 637";
// Absolute XY commands let the glow and HTML hit area share the same curves.
let coordinate = 0;
const mugClipPath = mugSilhouette.replace(/\d+(?:\.\d+)?/g, (value) => {
  const horizontal = coordinate++ % 2 === 0;
  const origin = horizontal ? mugBounds.left : mugBounds.top;
  const size = horizontal ? mugBounds.right - mugBounds.left : mugBounds.bottom - mugBounds.top;
  return ((Number(value) - origin) / size).toFixed(5);
});

export const sceneConfig = {
  photo: {
    width: 1672,
    height: 941,
    worldWidth: 16,
    src: asset("assets/workspace.webp"),
  },
  monitorBounds: {
    left: 424 / 1672,
    top: 194 / 941,
    right: 1263 / 1672,
    bottom: 626 / 941,
  },
  // Physical silhouette measured in photo pixels: bezel, neck, and desk base.
  monitorOutline:
    "M 425 185 H 1263 Q 1274 185 1274 197 V 638 Q 1274 649 1263 649 H 888 V 681 H 962 Q 969 681 972 691 L 979 713 Q 983 728 969 729 H 700 Q 688 729 691 716 L 701 690 Q 704 681 713 681 H 783 V 649 H 425 Q 414 649 414 638 V 197 Q 414 185 425 185 Z",
  linkedinObject: {
    bounds: { left: 813, top: 17, right: 1021, bottom: 184 },
    outline: "M 813 20 L 1021 17 L 1020 184 L 814 184 Z",
  },
  cvObject: {
    bounds: mugBounds,
    outline: `${mugSilhouette} ${mugRim}`,
    clipPath: mugClipPath,
  },
  camera: { fov: 42, near: 0.05, far: 80 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  zoomTarget: { fov: 34, overscan: 1.035 },
  monitorPlane: { z: 0.012, glow: 0.045 },
  motion: { duration: 1.85 },
  performance: { maxDpr: 1.5, mobileBreakpoint: 760 },
};

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const originalScene = structuredClone(sceneConfig);
export let photoProfile = "standard";

/** Keep photograph, hit areas and transition geometry in the same coordinate space. */
export function selectPhoto(width: number, height: number) {
  const profile = width / height < 1 ? "portrait" : width / height >= 16 / 9 ? "wide" : "standard";
  if (profile === photoProfile) return false;
  photoProfile = profile;
  Object.assign(sceneConfig, structuredClone(originalScene));
  if (profile === "standard") return true;
  const portrait = profile === "portrait";
  const w = portrait ? 941 : 2365;
  const h = portrait ? 1672 : 665;
  const screen = portrait ? [177, 661, 795, 1007] : [878, 147, 1471, 460];
  const frame = portrait ? [165, 653, 805, 1027] : [849, 139, 1491, 478];
  const linkedin = portrait ? [473, 224, 674, 398] : [1144, 13, 1301, 143];
  const mug = portrait ? [813, 1069, 939, 1200] : [1604, 461, 1740, 567];
  const rectPath = ([l, t, r, b]: number[]) => `M ${l} ${t} H ${r} V ${b} H ${l} Z`;
  const bounds = ([left, top, right, bottom]: number[]) => ({ left, top, right, bottom });
  Object.assign(sceneConfig.photo, { width: w, height: h, src: asset(`assets/workspace-${profile}.webp`) });
  sceneConfig.photo.src = asset(`assets/workspace-${portrait ? "portrait" : "wide"}.webp`);
  sceneConfig.monitorBounds = { left: screen[0] / w, top: screen[1] / h, right: screen[2] / w, bottom: screen[3] / h };
  sceneConfig.monitorOutline = rectPath(frame);
  sceneConfig.linkedinObject = { bounds: bounds(linkedin), outline: rectPath(linkedin) };
  sceneConfig.cvObject = { bounds: bounds(mug), outline: rectPath(mug), clipPath: "M0 0 H1 V1 H0 Z" };
  return true;
}

selectPhoto(window.innerWidth, window.innerHeight);

export function photoScreenRect(width: number, height: number): ScreenRect {
  const { photo, monitorBounds: b } = sceneConfig;
  const scale = Math.max(width / photo.width, height / photo.height);
  const photoW = photo.width * scale;
  const photoH = photo.height * scale;
  return {
    left: (width - photoW) / 2 + b.left * photoW,
    top: (height - photoH) / 2 + b.top * photoH,
    width: (b.right - b.left) * photoW,
    height: (b.bottom - b.top) * photoH,
  };
}
