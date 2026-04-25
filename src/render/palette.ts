import { palettes } from "../config/brand.js";

export const resolvePalette = (name: string) => {
  const match = palettes[name as keyof typeof palettes];
  if (!match) {
    return palettes.emberParchment;
  }

  return match;
};
