import type { PublishedLogFile, QueueFile, QueueItem } from "../types.js";
import { jaccardSimilarity } from "../util/text.js";

export const isTooSimilar = (
  candidate: Pick<QueueItem, "fingerprint" | "title">,
  queue: QueueFile,
  published: PublishedLogFile
) => {
  const queueHit = queue.items.some((item) => {
    if (item.status === "published") {
      return false;
    }

    return jaccardSimilarity(candidate.fingerprint, item.fingerprint) >= 0.52;
  });

  if (queueHit) {
    return true;
  }

  return published.entries
    .slice(-120)
    .some((entry) => jaccardSimilarity(candidate.fingerprint, entry.fingerprint) >= 0.52);
};
