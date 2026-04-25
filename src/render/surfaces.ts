import { readFileSync } from "node:fs";
import type { SurfaceStyle } from "../types.js";

const surface = (fileName: string) =>
  `data:image/jpeg;base64,${readFileSync(
    new URL(`./assets/surfaces/${fileName}`, import.meta.url)
  ).toString("base64")}`;

const surfaces: Record<SurfaceStyle, string> = {
  paperWarm: surface("paper-warm.jpg"),
  plasterBlue: surface("plaster-blue.jpg"),
  notebookCream: surface("notebook-cream.jpg"),
  charcoalGrain: surface("charcoal-grain.jpg"),
  vellumRose: surface("vellum-rose.jpg")
};

export const surfaceDataUrl = (style: SurfaceStyle) => surfaces[style];
