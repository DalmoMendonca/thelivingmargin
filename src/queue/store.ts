import { files } from "../config/brand.js";
import type {
  IdeaQueueFile,
  ManualIdea,
  PreviewManifest,
  PublishedLogFile,
  QueueFile,
  QueueItem
} from "../types.js";
import { readJsonFile, readYamlFile, writeJsonFile, writeYamlFile } from "../util/file.js";
import { nowIso } from "../util/time.js";

const defaultQueue = (): QueueFile => ({
  version: 1,
  updatedAt: nowIso(),
  items: []
});

const defaultPublished = (): PublishedLogFile => ({
  version: 1,
  updatedAt: nowIso(),
  entries: []
});

const defaultIdeas = (): IdeaQueueFile => ({
  version: 1,
  updatedAt: nowIso(),
  ideas: []
});

const defaultPreview = (): PreviewManifest => ({
  updatedAt: nowIso(),
  items: []
});

async function safeReadYaml<T>(targetPath: string, fallback: () => T): Promise<T> {
  try {
    return await readYamlFile<T>(targetPath);
  } catch {
    return fallback();
  }
}

export const loadQueue = () => safeReadYaml(files.queue, defaultQueue);
export const loadPublished = () => safeReadYaml(files.publishedLog, defaultPublished);
export const loadIdeas = () => safeReadYaml(files.manualIdeas, defaultIdeas);

export const saveQueue = async (value: QueueFile) => {
  value.updatedAt = nowIso();
  await writeYamlFile(files.queue, value);
};

export const savePublished = async (value: PublishedLogFile) => {
  value.updatedAt = nowIso();
  await writeYamlFile(files.publishedLog, value);
};

export const saveIdeas = async (value: IdeaQueueFile) => {
  value.updatedAt = nowIso();
  await writeYamlFile(files.manualIdeas, value);
};

export const consumeManualIdea = async (ideaId: string) => {
  const ideaFile = await loadIdeas();
  const idea = ideaFile.ideas.find((entry) => entry.id === ideaId);
  if (!idea) {
    return undefined;
  }

  idea.status = "consumed";
  await saveIdeas(ideaFile);
  return idea;
};

export const pendingIdeas = (ideas: IdeaQueueFile): ManualIdea[] =>
  ideas.ideas.filter((entry) => entry.status === "pending");

export const loadPreviewManifest = async () => {
  try {
    return await readJsonFile<PreviewManifest>(files.previewManifest);
  } catch {
    return defaultPreview();
  }
};

export const savePreviewManifest = async (items: QueueItem[]) => {
  const manifest: PreviewManifest = {
    updatedAt: nowIso(),
    items: items
      .filter((item) => item.renderedFiles && item.renderedFiles.length > 0)
      .slice(-40)
      .map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        topic: item.topic,
        angle: item.angle,
        createdAt: item.createdAt,
        renderedFiles:
          item.renderedFiles?.map((file) =>
            file.replace(/^docs\//, "")
          ) ?? []
      }))
  };

  await writeJsonFile(files.previewManifest, manifest);
};
