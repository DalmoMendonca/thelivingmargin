import type { QueueFile, QueueItem, SlotName } from "../types.js";

export const findNextReadyItem = (queue: QueueFile, slot: SlotName) =>
  queue.items.find((item) => item.status === "ready" && item.slotPreference === slot);

export const replaceQueueItem = (queue: QueueFile, nextItem: QueueItem) => ({
  ...queue,
  items: queue.items.map((item) => (item.id === nextItem.id ? nextItem : item))
});
