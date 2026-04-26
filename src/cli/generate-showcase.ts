import { contentModes } from "../config/brand.js";
import { isTooSimilar } from "../content/dedupe.js";
import { generateWithOpenAi } from "../content/generator.js";
import { contentModeProfiles, showcaseSeedIdeas } from "../content/mode-profiles.js";
import { buildShowcaseFallback } from "../content/showcase-fallbacks.js";
import { loadPublished, loadQueue, savePreviewManifest, saveQueue } from "../queue/store.js";
import { renderQueueItem } from "../render/render-post.js";
import type { QueueItem } from "../types.js";
import { logStep, logWarn } from "../util/log.js";

const queue = await loadQueue();
const published = await loadPublished();
const generated: QueueItem[] = [];

for (const mode of contentModes) {
  const profile = contentModeProfiles[mode];
  let item: QueueItem | undefined;
  let generationError: unknown;

  try {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const candidate = await generateWithOpenAi({
        slot: profile.preferredSlot,
        queue,
        published,
        forcedContentMode: mode,
        seedIdea: showcaseSeedIdeas[mode],
        allowSoftPass: true
      });

      if (isTooSimilar(candidate, queue, published)) {
        logWarn(
          `Showcase candidate for ${mode} was too similar on attempt ${attempt}. Retrying.`
        );
        continue;
      }

      item = candidate;
      break;
    }
  } catch (error) {
    generationError = error;
  }

  if (!item) {
    const fallback = buildShowcaseFallback(mode);
    if (fallback) {
      item = fallback;
      logWarn(
        `Using curated showcase fallback for ${mode}${generationError ? ` after generation failed: ${generationError instanceof Error ? generationError.message : String(generationError)}` : "."}`
      );
    }
  }

  if (!item) {
    throw new Error(`Unable to generate or recover a showcase post for mode ${mode}.`);
  }

  await renderQueueItem(item);
  generated.push(item);
  queue.items.push(item);
  logStep(`Showcase ${mode}: ${item.title}`);
}

await saveQueue(queue);
await savePreviewManifest(queue.items);

logStep(`Generated and rendered ${generated.length} showcase post(s), one for each mode.`);
