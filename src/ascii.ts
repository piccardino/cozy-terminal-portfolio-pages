import scene from "./asciiData.json";

// Both views share one fixed text scene and use their terminal's text color.
export function sunsetLandscape() {
  const escapeGlyphs = (text: string) =>
    text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
  const html = scene.rows.map(escapeGlyphs).join("\n");
  return { text: scene.rows.join("\n"), html, width: scene.width, height: scene.height };
}
