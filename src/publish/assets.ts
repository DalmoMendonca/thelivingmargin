import { appEnv, publicAssetBase } from "../config/brand.js";
import type { QueueItem } from "../types.js";

export const publicUrlForRelativeAsset = (relativePath: string) => {
  const root = appEnv.PUBLIC_ASSET_ROOT.replaceAll("\\", "/");
  const clean = relativePath.replaceAll("\\", "/");
  const withoutRoot = clean.startsWith(`${root}/`) ? clean.slice(root.length + 1) : clean;
  return `${publicAssetBase()}/${withoutRoot}`;
};

export const publicUrlsForItem = (item: QueueItem) => {
  if (!item.renderedFiles?.length) {
    throw new Error(`Item ${item.id} has no rendered files.`);
  }

  return item.renderedFiles.map(publicUrlForRelativeAsset);
};
