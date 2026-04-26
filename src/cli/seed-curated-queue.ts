import { sampleQueueItems } from "../content/fallback-posts.js";
import { savePreviewManifest, saveQueue } from "../queue/store.js";
import { logStep } from "../util/log.js";
import { nowIso } from "../util/time.js";

const items = sampleQueueItems();

await saveQueue({
  version: 1,
  updatedAt: nowIso(),
  items
});

await savePreviewManifest([]);
logStep(`Seeded curated queue with ${items.length} posts.`);
