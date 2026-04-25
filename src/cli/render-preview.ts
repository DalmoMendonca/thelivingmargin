import { loadQueue, savePreviewManifest, saveQueue } from "../queue/store.js";
import { renderQueueItem } from "../render/render-post.js";
import { logStep } from "../util/log.js";

const queue = await loadQueue();
const targets = queue.items.filter((item) => item.status === "ready").slice(0, 6);

for (const item of targets) {
  await renderQueueItem(item);
}

await saveQueue(queue);
await savePreviewManifest(queue.items);
logStep(`Rendered ${targets.length} queue item(s) into docs/assets/posts.`);
