import type { QueueFile, QueueItem, QueueStatus, SlotName } from "../types.js";

const publishableStatuses = new Set<QueueStatus>(["ready", "rendered"]);

export const isPublishableStatus = (status: QueueStatus) =>
  publishableStatuses.has(status);

export const findNextPublishableItem = (queue: QueueFile, slot: SlotName) =>
  queue.items.find(
    (item) => isPublishableStatus(item.status) && item.slotPreference === slot
  );

export const findNextPublishableItemAnySlot = (queue: QueueFile) =>
  queue.items.find((item) => isPublishableStatus(item.status));

export const replaceQueueItem = (queue: QueueFile, nextItem: QueueItem) => ({
  ...queue,
  items: queue.items.map((item) => (item.id === nextItem.id ? nextItem : item))
});
