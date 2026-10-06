import scene from "./asciiData.json";
import mountains from "./mountainData.json";

export type Wallpaper = "mountains" | "sunset";

// Both views share one fixed text scene and use their terminal's text color.
export function sunsetLandscape() {
  const escapeGlyphs = (text: string) =>
    text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
  const html = scene.rows.map(escapeGlyphs).join("\n");
  return { text: scene.rows.join("\n"), html, width: scene.width, height: scene.height };
}

export function wallpaperLandscape(wallpaper: Wallpaper) {
  if (wallpaper === "sunset") return sunsetLandscape();
  const escape = (text: string) => text.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
  const html = mountains.rows.map((row, y) => {
    let line = "", start = 0;
    for (let x = 1; x <= row.length; x++) {
      if (x === row.length || mountains.tones[y][x] !== mountains.tones[y][start]) {
        line += `<span style="color:${mountains.palette[Number(mountains.tones[y][start])]}">${escape(row.slice(start, x))}</span>`;
        start = x;
      }
    }
    return line;
  }).join("\n");
  return { text: mountains.rows.join("\n"), html, width: mountains.width, height: mountains.height };
}
