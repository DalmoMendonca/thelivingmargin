import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface LoadedFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
}

export const loadFonts = async (): Promise<LoadedFont[]> => {
  const files = [
    {
      path: require.resolve("@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"),
      name: "Instrument Serif",
      weight: 400 as const,
      style: "normal" as const
    },
    {
      path: require.resolve("@fontsource/newsreader/files/newsreader-latin-600-normal.woff"),
      name: "Newsreader",
      weight: 600 as const,
      style: "normal" as const
    },
    {
      path: require.resolve("@fontsource/newsreader/files/newsreader-latin-400-normal.woff"),
      name: "Newsreader",
      weight: 400 as const,
      style: "normal" as const
    },
    {
      path: require.resolve("@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff"),
      name: "Space Grotesk",
      weight: 700 as const,
      style: "normal" as const
    },
    {
      path: require.resolve("@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff"),
      name: "Space Grotesk",
      weight: 500 as const,
      style: "normal" as const
    }
  ];

  return Promise.all(
    files.map(async (font) => ({
      ...font,
      data: await readFile(font.path)
    }))
  );
};
