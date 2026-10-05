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
  const linkedin = portrait ? [473, 224, 674, 398] : [1144, 13, 1301, 143];
  const mug = portrait ? [813, 1068, 939, 1184] : [1608, 461, 1740, 564];
  const bounds = ([left, top, right, bottom]: number[]) => ({ left, top, right, bottom });
  Object.assign(sceneConfig.photo, { width: w, height: h, src: asset(`assets/workspace-${profile}.webp`) });
  sceneConfig.photo.src = asset(`assets/workspace-${portrait ? "portrait" : "wide"}.webp`);
  sceneConfig.monitorBounds = { left: screen[0] / w, top: screen[1] / h, right: screen[2] / w, bottom: screen[3] / h };
  sceneConfig.monitorOutline = portrait
    ? "M172 654 H797 Q804 654 804 661 V1027 L520 1025 V1067 L577 1069 Q584 1070 585 1076 L587 1095 Q587 1101 579 1102 H370 Q366 1102 367 1095 L371 1075 Q372 1069 379 1069 L467 1067 V1026 L165 1025 V661 Q165 654 172 654 Z"
    : "M858 140 H1483 Q1490 140 1490 147 V471 Q1490 478 1483 478 H1200 V504 L1259 503 L1267 525 Q1267 531 1258 531 H1058 Q1053 531 1053 526 L1057 514 L1122 505 V478 H854 Q849 478 849 470 L851 147 Q851 140 858 140 Z";
  sceneConfig.linkedinObject = {
    bounds: bounds(linkedin),
    outline: portrait ? "M476 226 L674 223 L673 393 L474 398 Z" : "M1143 16 L1301 12 L1302 139 H1143 Z",
  };
  const silhouette = portrait
    ? "M815 1081 C813 1070 836 1067 860 1068 C885 1068 906 1074 907 1081 L907 1091 C923 1089 939 1105 939 1130 C939 1155 927 1170 906 1173 L905 1177 C903 1188 819 1186 814 1174 Z M908 1101 C920 1099 929 1113 929 1131 C929 1148 921 1161 908 1161 Z"
    : "M1609 465 C1625 460 1688 460 1705 466 L1705 476 C1724 473 1740 487 1740 512 C1740 535 1727 546 1705 547 L1705 555 C1703 568 1612 567 1609 552 Z M1706 486 C1719 480 1730 491 1730 512 C1730 528 1722 540 1706 539 Z";
  const rim = portrait
    ? "M815 1081 C828 1091 894 1095 907 1081"
    : "M1609 465 C1624 473 1688 474 1705 466";
  let axis = 0;
  const clipPath = silhouette.replace(/\d+(?:\.\d+)?/g, value => {
    const horizontal = axis++ % 2 === 0;
    return ((Number(value) - mug[horizontal ? 0 : 1]) / (mug[horizontal ? 2 : 3] - mug[horizontal ? 0 : 1])).toFixed(5);
  });
  sceneConfig.cvObject = { bounds: bounds(mug), outline: `${silhouette} ${rim}`, clipPath };
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
