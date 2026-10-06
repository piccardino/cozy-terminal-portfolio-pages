import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Rebuild the photographed monitor's mountain landscape as terminal text.
// Character cells are taller than they are wide: keep the moon circular.
const width = 144, height = 52;
const ramp = " .:-=+*#%@";
const palette = ["#0c3327", "#155640", "#248969", "#39bf97", "#64e4bf", "#9affdf"];
const { data, info } = await sharp(fileURLToPath(new URL("../public/assets/workspace.webp", import.meta.url)))
  .extract({ left: 666, top: 236, width: 375, height: 226 })
  .removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rows = [], tones = [];
for (let y = 0; y < height; y++) {
  let row = "", colors = "";
  for (let x = 0; x < width; x++) {
    let total = 0, peak = 0, count = 0;
    for (let py = Math.floor(y * info.height / height); py < Math.floor((y + 1) * info.height / height); py++) {
      for (let px = Math.floor(x * info.width / width); px < Math.floor((x + 1) * info.width / width); px++) {
        const i = (py * info.width + px) * info.channels;
        const green = Math.max(0, data[i + 1] - data[i] * 0.6 - data[i + 2] * 0.08);
        total += green; peak = Math.max(peak, green); count++;
      }
    }
    const ink = (peak * 0.7 + total / count * 0.3) / 185;
    const level = Math.min(9, Math.max(0, Math.round(ink * 9)));
    row += ramp[level];
    colors += Math.min(5, Math.floor(ink * 6));
  }
  rows.push(row); tones.push(colors);
}
await writeFile(new URL("../src/mountainData.json", import.meta.url), JSON.stringify({ width, height, palette, rows, tones }) + "\n");
console.log(`Mountain ASCII: ${width} columns, ${height} rows.`);
