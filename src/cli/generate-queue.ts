import { queueTarget, topUpQueue } from "../content/generator.js";
import { isTooSimilar } from "../content/dedupe.js";
import { pendingIdeas, loadIdeas, loadPublished, loadQueue, saveIdeas, saveQueue } from "../queue/store.js";
import type { ManualIdea } from "../types.js";
import { logStep, logWarn } from "../util/log.js";

const queue = await loadQueue();
const published = await loadPublished();
const ideaFile = await loadIdeas();
const manualIdeas = pendingIdeas(ideaFile);

const generated = await topUpQueue({
  queue,
  published,
  manualIdeas,
  desiredCount: queueTarget()
});

const consumedIdeaIds = new Set<string>();

for (const item of generated) {
  if (isTooSimilar(item, queue, published)) {
    logWarn(`Skipped "${item.title}" because it overlaps too closely with recent content.`);
    continue;
  }

  queue.items.push(item);

  if (item.source === "manual" && item.notes) {
    const match = item.notes.match(/manual idea ([\w-]+)/);
    if (match) {
      consumedIdeaIds.add(match[1]);
    }
  }
}

for (const idea of ideaFile.ideas as ManualIdea[]) {
  if (consumedIdeaIds.has(idea.id)) {
    idea.status = "consumed";
  }
}

await saveQueue(queue);
await saveIdeas(ideaFile);

logStep(`Queue now contains ${queue.items.filter((item) => item.status === "ready").length} ready posts.`);
