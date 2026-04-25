import { files } from "../config/brand.js";
import { sampleQueueItems } from "../content/fallback-posts.js";
import { ensureDir, writeJsonFile, writeYamlFile } from "../util/file.js";
import { logStep } from "../util/log.js";
import { nowIso } from "../util/time.js";

const sampleIdeas = {
  version: 1,
  updatedAt: nowIso(),
  ideas: [
    {
      id: "idea-001",
      idea: "A carousel about why taste matters more than being informed.",
      priority: "high",
      status: "pending",
      addedAt: nowIso()
    },
    {
      id: "idea-002",
      idea: "A quote card about how peace can become a disguise for avoidance.",
      priority: "normal",
      status: "pending",
      addedAt: nowIso()
    }
  ]
};

const sampleSwipeFile = {
  version: 1,
  updatedAt: nowIso(),
  notes: [
    "Reference account pattern: high-frequency quote cards, clean contrast, emotionally legible statements, carousel explainers, short captions with discussion prompts.",
    "Desired differentiation: warmer design, more literary voice, smarter contrarian edge, less generic spirituality, more intellectual texture."
  ]
};

const sampleQueue = {
  version: 1,
  updatedAt: nowIso(),
  items: sampleQueueItems()
};

const samplePublished = {
  version: 1,
  updatedAt: nowIso(),
  entries: []
};

const previewManifest = {
  updatedAt: nowIso(),
  items: []
};

await ensureDir("docs/assets");
await writeYamlFile(files.manualIdeas, sampleIdeas);
await writeYamlFile(files.swipeFile, sampleSwipeFile);
await writeYamlFile(files.queue, sampleQueue);
await writeYamlFile(files.publishedLog, samplePublished);
await writeJsonFile(files.previewManifest, previewManifest);

logStep("Bootstrapped queue, manual ideas, swipe notes, and preview manifest.");
