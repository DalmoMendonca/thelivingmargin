import { writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { appEnv, projectRoot } from "../config/brand.js";
import type { QueueItem } from "../types.js";
import { ensureDir } from "../util/file.js";
import { slugify } from "../util/text.js";
import { todayStamp } from "../util/time.js";
import { loadFonts } from "./fonts.js";
import { renderItemCard } from "./templates.js";

export const renderQueueItem = async (item: QueueItem) => {
  const fonts = await loadFonts();
  const cards = renderItemCard(item);
  const slug = slugify(item.title || item.id);
  const renderDir = path.join(
    projectRoot,
    appEnv.PUBLIC_ASSET_ROOT,
    `${todayStamp()}-${slug}`
  );

  await ensureDir(renderDir);

  const renderedFiles: string[] = [];

  for (let index = 0; index < cards.length; index += 1) {
    const svg = await satori(cards[index], {
      width: 1080,
      height: 1350,
      fonts
    });

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 1080
      }
    });

    const pngData = resvg.render().asPng();
    const fileName =
      item.kind === "carousel"
        ? `slide-${String(index + 1).padStart(2, "0")}.png`
        : "post.png";
    const absolutePath = path.join(renderDir, fileName);

    await writeFile(absolutePath, pngData);

    const relative = path
      .relative(projectRoot, absolutePath)
      .replaceAll("\\", "/");

    renderedFiles.push(relative);
  }

  item.renderDir = path.relative(projectRoot, renderDir).replaceAll("\\", "/");
  item.renderedFiles = renderedFiles;
  item.status = "rendered";
  return item;
};
