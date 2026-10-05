/** Resolve public assets inside the document's deployment folder, including GitHub Pages. */
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
