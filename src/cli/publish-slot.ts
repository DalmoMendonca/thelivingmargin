import {
  appEnv,
  brand,
  files,
  hasInstagramPublish,
  projectRoot
} from "../config/brand.js";
import { queueTarget, topUpQueue } from "../content/generator.js";
import { reviewQueueItem } from "../content/quality.js";
import { isTooSimilar } from "../content/dedupe.js";
import { publicUrlsForItem } from "../publish/assets.js";
import { sendFailureAlert } from "../publish/alerts.js";
import { publishToInstagram } from "../publish/instagram.js";
import { findNextReadyItem, replaceQueueItem } from "../queue/selection.js";
import {
  loadIdeas,
  loadPublished,
  loadQueue,
  pendingIdeas,
  saveIdeas,
  savePreviewManifest,
  savePublished,
  saveQueue
} from "../queue/store.js";
import type { SlotName } from "../types.js";
import { commitAndPushIfChanged } from "../util/git.js";
import { pollUrl } from "../util/http.js";
import { logError, logStep, logWarn } from "../util/log.js";
import { nowIso } from "../util/time.js";
import { renderQueueItem } from "../render/render-post.js";
import { getFlag, hasFlag } from "./args.js";

const slot = (getFlag("slot") as SlotName | undefined) ?? "morning";
const dryRun = hasFlag("dry-run");

const queue = await loadQueue();
const published = await loadPublished();
const ideas = await loadIdeas();

const generated = await topUpQueue({
  queue,
  published,
  manualIdeas: pendingIdeas(ideas),
  desiredCount: queueTarget()
});

const usedIdeaIds = new Set<string>();
for (const item of generated) {
  if (isTooSimilar(item, queue, published)) {
    continue;
  }

  queue.items.push(item);
  if (item.source === "manual" && item.notes) {
    const match = item.notes.match(/manual idea ([\w-]+)/);
    if (match) {
      usedIdeaIds.add(match[1]);
    }
  }
}

for (const idea of ideas.ideas) {
  if (usedIdeaIds.has(idea.id)) {
    idea.status = "consumed";
  }
}

await saveIdeas(ideas);
await saveQueue(queue);

const target = findNextReadyItem(queue, slot);
if (!target) {
  logWarn("No ready item was available to publish.");
  process.exit(0);
}

const qualityReview = await reviewQueueItem(target);
if (!qualityReview.approved) {
  target.status = "blocked";
  target.lastError = `Pre-publish QC failed: ${qualityReview.review.reasons.join(" | ")}`;
  queue.items = replaceQueueItem(queue, target).items;
  await saveQueue(queue);
  throw new Error(target.lastError);
}

await renderQueueItem(target);
const renderedQueue = replaceQueueItem(queue, target);
queue.items = renderedQueue.items;
await saveQueue(queue);
await savePreviewManifest(queue.items);

if (process.env.GITHUB_ACTIONS === "true") {
  const commitPaths = [files.queue, files.previewManifest, target.renderDir]
    .filter((value): value is string => Boolean(value));
  await commitAndPushIfChanged(projectRoot, `chore: render ${target.id}`, [
    ...commitPaths
  ]);
}

if (!appEnv.PUBLIC_GITHUB_REPOSITORY) {
  if (dryRun || !hasInstagramPublish()) {
    logStep(
      `Rendered ${target.id} locally. Set PUBLIC_GITHUB_REPOSITORY once the code is pushed to GitHub.`
    );
    process.exit(0);
  }

  throw new Error("PUBLIC_GITHUB_REPOSITORY is required for live publishing.");
}

const publicUrls = publicUrlsForItem(target);
logStep(`Rendered public assets:\n${publicUrls.join("\n")}`);

if (!dryRun) {
  for (const url of publicUrls) {
    const reachable = await pollUrl(url, 20, 6000);
    if (!reachable) {
      throw new Error(`Rendered asset did not become reachable: ${url}`);
    }
  }
}

if (dryRun || !hasInstagramPublish()) {
  logStep(
    dryRun
      ? `Dry run complete. ${target.id} rendered and ready.`
      : `Instagram credentials are missing. ${target.id} is rendered and waiting.`
  );
  process.exit(0);
}

let instagramMediaId: string | undefined;
let lastError: string | undefined;

for (let attempt = 1; attempt <= brand.maxPublishAttempts; attempt += 1) {
  try {
    logStep(`Publishing attempt ${attempt} for ${target.id}.`);
    instagramMediaId = await publishToInstagram(target);
    target.publishAttempts = attempt;
    break;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastError = message;
    target.publishAttempts = attempt;
    target.lastError = message;
    logError(message);
  }
}

if (!instagramMediaId) {
  target.status = "blocked";
  target.lastError = lastError;
  queue.items = replaceQueueItem(queue, target).items;
  await saveQueue(queue);
  await sendFailureAlert(
    `Instagram publish failed for ${target.title}`,
    [
      `Slot: ${slot}`,
      `Item: ${target.id}`,
      `Title: ${target.title}`,
      `Error: ${lastError ?? "Unknown error"}`,
      "",
      "The queue item was left in blocked status so it will not silently repeat forever."
    ].join("\n")
  );

  if (process.env.GITHUB_ACTIONS === "true") {
    await commitAndPushIfChanged(projectRoot, `chore: block ${target.id}`, [files.queue]);
  }

  process.exit(1);
}

target.status = "published";
target.instagramMediaId = instagramMediaId;
target.publishedAt = nowIso();
queue.items = queue.items.map((item) => (item.id === target.id ? target : item));
published.entries.push({
  id: target.id,
  publishedAt: target.publishedAt,
  topic: target.topic,
  angle: target.angle,
  fingerprint: target.fingerprint,
  kind: target.kind,
  slot,
  instagramMediaId,
  title: target.title
});

await saveQueue(queue);
await savePublished(published);
await savePreviewManifest(queue.items);

if (process.env.GITHUB_ACTIONS === "true") {
  await commitAndPushIfChanged(projectRoot, `chore: publish ${target.id}`, [
    files.queue,
    files.publishedLog,
    files.previewManifest
  ]);
}

logStep(`Published ${target.title} to Instagram with media id ${instagramMediaId}.`);
