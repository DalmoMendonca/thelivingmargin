import {
  appEnv,
  brand,
  files,
  hasInstagramPublish,
  projectRoot
} from "../config/brand.js";
import {
  countPublishableItems,
  generateWithOpenAi,
  queueTarget,
  topUpQueue
} from "../content/generator.js";
import { reviewQueueItem } from "../content/quality.js";
import { isTooSimilar } from "../content/dedupe.js";
import { buildFallbackQueueItemForSlot } from "../content/fallback-posts.js";
import { publicUrlsForItem } from "../publish/assets.js";
import { sendFailureAlert } from "../publish/alerts.js";
import { publishToInstagram } from "../publish/instagram.js";
import {
  replaceQueueItem
} from "../queue/selection.js";
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
import type { QueueItem, SlotName } from "../types.js";
import { commitAndPushIfChanged } from "../util/git.js";
import { pollUrl } from "../util/http.js";
import { logError, logStep, logWarn } from "../util/log.js";
import { nowIso } from "../util/time.js";
import { renderQueueItem } from "../render/render-post.js";
import { getFlag, hasFlag } from "./args.js";

const slot = (getFlag("slot") as SlotName | undefined) ?? "morning";
const dryRun = hasFlag("dry-run");
const scheduledRun = process.env.GITHUB_EVENT_NAME === "schedule";
const runningInGitHubActions = process.env.GITHUB_ACTIONS === "true";

const queue = await loadQueue();
const published = await loadPublished();
const ideas = await loadIdeas();

const usedFingerprints = () =>
  new Set([
    ...queue.items.map((item) => item.fingerprint),
    ...published.entries.map((entry) => entry.fingerprint)
  ]);

const findCandidateForSlot = (excludedIds: Set<string>) =>
  queue.items.find(
    (item) =>
      !excludedIds.has(item.id) &&
      item.slotPreference === slot &&
      (item.status === "ready" || item.status === "rendered")
  );

const findCandidateAnySlot = (excludedIds: Set<string>) =>
  queue.items.find(
    (item) =>
      !excludedIds.has(item.id) &&
      (item.status === "ready" || item.status === "rendered")
  );

const saveQueueState = async () => {
  await saveQueue(queue);
  await saveIdeas(ideas);
  await savePreviewManifest(queue.items);
};

const syncGeneratedItems = async (generated: QueueItem[]) => {
  if (generated.length === 0) {
    return;
  }

  const usedIdeaIds = new Set<string>();

  for (const item of generated) {
    if (isTooSimilar(item, queue, published)) {
      logWarn(`Skipped generated duplicate ${item.title}.`);
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

  await saveQueueState();
};

const isRetriableMediaError = (message?: string) => {
  const value = message?.toLowerCase() ?? "";
  return (
    value.includes("media id is not available") ||
    value.includes("media is not ready for publishing")
  );
};

const reviveRetriableBlockedItems = () => {
  let revived = 0;

  for (const item of queue.items) {
    if (item.status !== "blocked" || !isRetriableMediaError(item.lastError)) {
      continue;
    }

    item.status = item.renderedFiles?.length ? "rendered" : "ready";
    item.publishAttempts = 0;
    item.lastError = undefined;
    revived += 1;
  }

  return revived;
};

const saveRenderCommit = async (target: QueueItem) => {
  if (process.env.GITHUB_ACTIONS !== "true") {
    return;
  }

  const commitPaths = [
    files.queue,
    files.manualIdeas,
    files.previewManifest,
    target.renderDir
  ].filter((value): value is string => Boolean(value));

  await commitAndPushIfChanged(projectRoot, `chore: render ${target.id}`, commitPaths);
};

const ensureRendered = async (target: QueueItem) => {
  if (target.renderedFiles?.length) {
    return;
  }

  if (target.source === "ai") {
    const qualityReview = await reviewQueueItem(target);
    if (!qualityReview.approved) {
      target.status = "blocked";
      target.lastError = `Pre-publish QC failed: ${qualityReview.review.reasons.join(" | ")}`;
      queue.items = replaceQueueItem(queue, target).items;
      await saveQueueState();
      throw new Error(target.lastError);
    }
  }

  await renderQueueItem(target);
  queue.items = replaceQueueItem(queue, target).items;
  await saveQueueState();
  await saveRenderCommit(target);
};

const ensurePublicAssets = async (target: QueueItem) => {
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

  if (dryRun) {
    return;
  }

  for (const url of publicUrls) {
    const reachable = await pollUrl(url, 20, 6000);
    if (!reachable) {
      throw new Error(`Rendered asset did not become reachable: ${url}`);
    }
  }
};

const tryGenerateTarget = async () => {
  const manualIdea = pendingIdeas(ideas)[0];

  for (let attempt = 1; attempt <= brand.maxPublishAttempts; attempt += 1) {
    try {
      const generatedTarget = await generateWithOpenAi({
        slot,
        queue,
        published,
        manualIdea,
        seedIdea: manualIdea?.idea
      });

      if (isTooSimilar(generatedTarget, queue, published)) {
        logWarn(
          `Generated ${slot} item was too similar on attempt ${attempt}. Retrying.`
        );
        continue;
      }

      await syncGeneratedItems([generatedTarget]);
      return generatedTarget;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logWarn(`On-demand ${slot} generation attempt ${attempt} failed: ${message}`);
    }
  }

  return undefined;
};

const buildEmergencyFallback = async ({
  allowDuplicate = false
}: {
  allowDuplicate?: boolean;
} = {}) => {
  const fallback = buildFallbackQueueItemForSlot({
    slot,
    usedFingerprints: allowDuplicate ? new Set<string>() : usedFingerprints()
  });

  if (!fallback) {
    return undefined;
  }

  if (!allowDuplicate && isTooSimilar(fallback, queue, published)) {
    return undefined;
  }

  queue.items.push(fallback);
  await saveQueueState();
  logWarn(
    `Using curated emergency fallback for ${slot}: ${fallback.title}${allowDuplicate ? " (duplicate allowed for reliability)." : "."}`
  );
  return fallback;
};

const resolveTarget = async (excludedIds = new Set<string>()) => {
  const revived = reviveRetriableBlockedItems();
  if (revived > 0) {
    logWarn(`Revived ${revived} blocked item(s) that failed only on media readiness.`);
    await saveQueueState();
  }

  let target = findCandidateForSlot(excludedIds);
  if (target) {
    return target;
  }

  if (scheduledRun) {
    target = findCandidateAnySlot(excludedIds);
    if (target) {
      logWarn(
        `No publishable ${slot} item was available. Scheduled run is using ${target.slotPreference} inventory to preserve cadence.`
      );
      return target;
    }
  }

  logWarn(`No publishable ${slot} item was available. Generating one on demand.`);
  target = await tryGenerateTarget();
  if (target) {
    return target;
  }

  target = await buildEmergencyFallback();
  if (target) {
    return target;
  }

  if (scheduledRun) {
    target = findCandidateAnySlot(excludedIds);
    if (target) {
      logWarn(
        `Falling back to ${target.slotPreference} inventory after ${slot} generation failed.`
      );
      return target;
    }
  }

  return undefined;
};

const bestEffortTopUp = async () => {
  if (runningInGitHubActions) {
    logStep("Skipping queue top-up during GitHub Actions publish run to reduce state churn.");
    return;
  }

  const currentCount = countPublishableItems(queue.items);
  const desiredCount = Math.min(queueTarget(), currentCount + brand.queueTopUpPerRun);

  if (desiredCount <= currentCount) {
    return;
  }

  const generated = await topUpQueue({
    queue,
    published,
    manualIdeas: pendingIdeas(ideas),
    desiredCount,
    bestEffort: true
  });

  await syncGeneratedItems(generated);
};

const resolveRenderableTarget = async () => {
  const attemptedIds = new Set<string>();

  while (true) {
    const target = await resolveTarget(attemptedIds);
    if (!target) {
      const fallback = await buildEmergencyFallback({ allowDuplicate: true });
      if (!fallback) {
        return undefined;
      }

      await ensureRendered(fallback);
      return fallback;
    }

    attemptedIds.add(target.id);

    try {
      await ensureRendered(target);
      return target;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logWarn(`Primary target ${target.title} was blocked before publish: ${message}`);

      const replacement = await resolveTarget(attemptedIds);
      if (replacement) {
        continue;
      }

      const fallback =
        (await buildEmergencyFallback()) ??
        (await buildEmergencyFallback({ allowDuplicate: true }));
      if (fallback) {
        await ensureRendered(fallback);
        return fallback;
      }

      throw error;
    }
  }
};

const target = await resolveRenderableTarget();
if (!target) {
  throw new Error(`Unable to resolve a publishable item for ${slot}.`);
}

await ensurePublicAssets(target);

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
    target.lastError = undefined;
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
  target.status = isRetriableMediaError(lastError) && target.renderedFiles?.length
    ? "rendered"
    : "blocked";
  target.lastError = lastError;
  queue.items = replaceQueueItem(queue, target).items;
  await saveQueueState();
  await sendFailureAlert(
    `Instagram publish failed for ${target.title}`,
    [
      `Slot: ${slot}`,
      `Item: ${target.id}`,
      `Title: ${target.title}`,
      `Error: ${lastError ?? "Unknown error"}`,
      "",
      target.status === "rendered"
        ? "The queue item was returned to rendered status so the automation can retry it."
        : "The queue item was left in blocked status so it will not silently repeat forever."
    ].join("\n")
  );

  if (process.env.GITHUB_ACTIONS === "true") {
    await commitAndPushIfChanged(projectRoot, `chore: mark ${target.id}`, [
      files.queue,
      files.manualIdeas,
      files.previewManifest
    ]);
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

await bestEffortTopUp();
await saveQueueState();
await savePublished(published);

if (process.env.GITHUB_ACTIONS === "true") {
  await commitAndPushIfChanged(projectRoot, `chore: publish ${target.id}`, [
    files.queue,
    files.manualIdeas,
    files.publishedLog,
    files.previewManifest
  ]);
}

logStep(`Published ${target.title} to Instagram with media id ${instagramMediaId}.`);
