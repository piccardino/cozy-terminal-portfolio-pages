import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Reconstruct the supplied scene as coloured text. Crop away its caption/bar.
const width = 144;
const height = 78;
const palette = ["#5565ad", "#777acb", "#a581d3", "#d594c1", "#aad1e4", "#76c8da", "#839ded", "#e1b8d7"];
const ramp = " .:-=+*#%@";
const { data: pixels, info } = await sharp(fileURLToPath(new URL("../design/ascii-sunset-reference.png", import.meta.url)))
  .extract({ left: 7, top: 7, width: 497, height: 457 })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const rows = [], colors = [];
for (let y = 0; y < height; y++) {
  let row = "", tones = "";
  for (let x = 0; x < width; x++) {
    let total = 0, count = 0, peak = 0, r = 0, g = 0, b = 0;
    let mass = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    const startX = Math.floor(x * info.width / width), startY = Math.floor(y * info.height / height);
    // Preserve thin strokes instead of losing the palms/grid in a box average.
    for (let py = Math.floor(y * info.height / height); py < Math.floor((y + 1) * info.height / height); py++) {
      for (let px = Math.floor(x * info.width / width); px < Math.floor((x + 1) * info.width / width); px++) {
        const i = (py * info.width + px) * 3;
        const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
        const stroke = Math.max(0, Math.max(red, green, blue - 70) - 7);
        total += stroke; count++;
        if (stroke > peak) { peak = stroke; r = red; g = green; b = blue; }
        const weight = Math.max(0, stroke - 35) ** 2;
        const dx = px - startX, dy = py - startY;
        mass += weight; sx += dx * weight; sy += dy * weight;
        sxx += dx * dx * weight; syy += dy * dy * weight; sxy += dx * dy * weight;
      }
    }
    const ink = peak * 0.4 + total / count * 0.6;
    const level = ink < 11 ? 0 : Math.min(9, Math.max(1, Math.round((ink / 190) ** 0.72 * 9)));
    const color = r > g * 1.26 ? (r > 115 ? 3 : 2)
      : g > r * 1.23 ? (g > 95 ? 5 : 6)
      : r > 130 && g > 100 ? 7
      : g > 110 && b > 135 ? 4
      : b > 85 ? 1 : 0;
    const sourceX = (x + 0.5) * info.width / width + 7;
    const sourceY = (y + 0.5) * info.height / height + 7;
    const sun = ((sourceX - 255) / 72) ** 2 + ((sourceY - 218) / 72) ** 2 < 1;
    const palm = sourceX < 172 && sourceY > 80 && sourceY < 316;
    let glyph = ramp[level];
    if (level > 0 && mass > 0) {
      const vx = sxx / mass - (sx / mass) ** 2;
      const vy = syy / mass - (sy / mass) ** 2;
      const covariance = sxy / mass - sx * sy / mass ** 2;
      const direction = vx > vy * 1.8 ? "-" : vy > vx * 3 ? "|"
        : Math.abs(covariance) > Math.sqrt(vx * vy) * 0.25 ? (covariance > 0 ? "\\" : "/") : ":";
      if (sun && level >= 4) glyph = "0";
      else if (palm || sourceY > 351) glyph = level < 2 ? "." : direction;
      else if (sourceY < 60) glyph = level > 5 ? "+" : level > 2 ? "-" : ".";
      else if (sourceY < 170 || (sourceX > 172 && sourceY < 201)) glyph = level > 4 ? "=" : level > 2 ? "-" : ".";
      else glyph = level > 5 ? direction : level > 3 ? "=" : glyph;
    }
    row += glyph;
    tones += color;
  }
  rows.push(row);
  colors.push(tones);
}
// Clean perspective lines keep the foreground readable at monitor scale.
const floor = rows.map(row => [...row]);
const floorColors = colors.map(row => [...row]);
const horizon = 59;
for (let y = horizon; y < height; y++) floor[y].fill(" ");
const plot = (x, y, glyph, tone) => {
  if (x < 0 || x >= width || y < horizon || y >= height) return;
  floor[y][x] = floor[y][x] !== " " && floor[y][x] !== glyph ? "+" : glyph;
  floorColors[y][x] = String(tone);
};
for (const [i, y] of [59, 61, 64, 68, 72, 77].entries()) {
  for (let x = 0; x < width; x++) if (x % 3 !== 2) plot(x, y, "_", i % 2 ? 5 : 2);
}
for (let end = -216; end <= 360; end += 24) {
  for (let y = horizon; y < height; y++) {
    const x = Math.round(width / 2 + (end - width / 2) * (y - 51) / (height - 1 - 51));
    plot(x, y, end === width / 2 ? "|" : end < width / 2 ? "/" : "\\", end % 48 ? 5 : 4);
  }
}
for (let y = horizon; y < height; y++) {
  rows[y] = floor[y].join("");
  colors[y] = floorColors[y].join("");
}
await writeFile(new URL("../src/asciiData.json", import.meta.url), JSON.stringify({ width, height, palette, rows, colors }) + "\n");
console.log(`Sunset ASCII: ${width} columns, ${height} rows, ${palette.length} colours.`);
