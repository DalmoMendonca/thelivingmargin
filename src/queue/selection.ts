import type { QueueFile, QueueItem, SlotName } from "../types.js";

export const findNextReadyItem = (queue: QueueFile, slot: SlotName) => {
  const preferred = queue.items.find(
    (item) => item.status === "ready" && item.slotPreference === slot
  );

  if (preferred) {
    return preferred;
  }

  return queue.items.find((item) => item.status === "ready");
};

export const replaceQueueItem = (queue: QueueFile, nextItem: QueueItem) => ({
  ...queue,
  items: queue.items.map((item) => (item.id === nextItem.id ? nextItem : item))
});
