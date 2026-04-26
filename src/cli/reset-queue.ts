import { savePreviewManifest, saveQueue } from "../queue/store.js";
import { logStep } from "../util/log.js";
import { nowIso } from "../util/time.js";

await saveQueue({
  version: 1,
  updatedAt: nowIso(),
  items: []
});

await savePreviewManifest([]);
logStep("Queue and preview manifest reset. Published history was preserved.");
