import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { appEnv, brand, hasOpenAi, slotOrder } from "../config/brand.js";
import type {
  ContentMode,
  ManualIdea,
  PublishedLogFile,
  QueueFile,
  QueueItem,
  SlotName
} from "../types.js";
import { logStep, logWarn } from "../util/log.js";
import {
  normalizeHashtags,
  normalizeQuoteAttribution,
  sanitizeQueueItem,
  stripMetaLead
} from "../util/post.js";
import {
  buildContentId,
  makeFingerprint,
  trimParagraphs
} from "../util/text.js";
import { nowIso } from "../util/time.js";
import { sampleQueueItems } from "./fallback-posts.js";
import { buildPostPrompt, buildRevisionPrompt } from "./prompts.js";
import { reviewQueueItem } from "./quality.js";

const templateFamilyValues = [
  "oracle",
  "margin",
  "editorial",
  "signal",
  "lesson",
  "highlight",
  "notebook",
  "broadside"
] as const;
const paletteValues = [
  "emberParchment",
  "midnightPaper",
  "sageAsh",
  "brassInk",
  "bluePlaster",
  "roseLedger"
] as const;
const contentModeValues = [
  "aphorism",
  "advice",
  "story",
  "quote",
  "encouragement",
  "observation",
  "question",
  "reframe",
  "dialogue",
  "list"
] as const;
const surfaceStyleValues = [
  "paperWarm",
  "plasterBlue",
  "notebookCream",
  "charcoalGrain",
  "vellumRose"
] as const;
const slotValues = ["morning", "midday", "evening"] as const;

const slideSchema = z.object({
  kicker: z.string().optional().nullable(),
  headline: z.string(),
  body: z.string(),
  footer: z.string().optional().nullable()
});

const responseSchema = z.object({
  kind: z.enum(["single", "carousel"]),
  templateFamily: z.enum(templateFamilyValues),
  palette: z.enum(paletteValues),
  surfaceStyle: z.enum(surfaceStyleValues),
  contentMode: z.enum(contentModeValues),
  voiceMode: z.enum(["contrarian", "reflective", "sharp"]),
  slotPreference: z.enum(slotValues),
  title: z.string(),
  topic: z.string(),
  angle: z.string(),
  quoteAttribution: z.preprocess(
    (value) =>
      typeof value === "string" ? normalizeQuoteAttribution(value) ?? null : value,
    z.string().nullable().optional()
  ),
  altText: z.string(),
  single: z
    .object({
      headline: z.string(),
      body: z.string(),
      supportLine: z.string().optional().nullable(),
      footer: z.string().optional().nullable()
    })
    .nullable(),
  carousel: z.array(slideSchema).nullable(),
  caption: z.object({
    hook: z.string(),
    body: z.string(),
    callToComment: z.string().optional().nullable(),
    hashtags: z.array(z.string()).min(3).max(6)
  })
});

const buildQueueItem = (
  parsed: z.infer<typeof responseSchema>,
  manualIdea?: ManualIdea
): QueueItem => {
  const title = trimParagraphs(parsed.title);
  const angle = trimParagraphs(parsed.angle);
  const topic = trimParagraphs(parsed.topic);
  const createdAt = nowIso();
  const id = buildContentId(createdAt, title);

  return sanitizeQueueItem({
    id,
    createdAt,
    source: manualIdea ? "manual" : "ai",
    slotPreference: parsed.slotPreference as QueueItem["slotPreference"],
    kind: parsed.kind,
    templateFamily: parsed.templateFamily as QueueItem["templateFamily"],
    palette: parsed.palette,
    surfaceStyle: parsed.surfaceStyle,
    title,
    topic,
    angle,
    fingerprint: makeFingerprint(title, angle, topic),
    contentMode: parsed.contentMode,
    voiceMode: parsed.voiceMode,
    quoteAttribution: parsed.quoteAttribution ?? undefined,
    altText: trimParagraphs(parsed.altText),
    single:
      parsed.kind === "single" && parsed.single
        ? {
            headline: trimParagraphs(parsed.single.headline),
            body: trimParagraphs(parsed.single.body),
            supportLine: parsed.single.supportLine
              ? trimParagraphs(stripMetaLead(parsed.single.supportLine))
              : undefined,
            footer: parsed.single.footer
              ? trimParagraphs(stripMetaLead(parsed.single.footer))
              : undefined
          }
        : undefined,
    carousel:
      parsed.kind === "carousel" && parsed.carousel
        ? parsed.carousel.map((slide) => ({
            kicker: slide.kicker ? trimParagraphs(stripMetaLead(slide.kicker)) : undefined,
            headline: trimParagraphs(slide.headline),
            body: trimParagraphs(slide.body),
            footer: slide.footer ? trimParagraphs(stripMetaLead(slide.footer)) : undefined
          }))
        : undefined,
    caption: {
      hook: trimParagraphs(stripMetaLead(parsed.caption.hook)),
      body: trimParagraphs(stripMetaLead(parsed.caption.body)),
      callToComment: parsed.caption.callToComment
        ? trimParagraphs(stripMetaLead(parsed.caption.callToComment))
        : undefined,
      hashtags: normalizeHashtags(parsed.caption.hashtags)
    },
    publishAttempts: 0,
    status: "ready",
    notes: manualIdea ? `Seeded from manual idea ${manualIdea.id}` : undefined
  });
};

const reasoningEffortForModel = (model: string) => {
  if (model.startsWith("gpt-5.4")) {
    return "medium";
  }

  return "low";
};

const nextSlotForQueue = (items: QueueItem[]) => {
  const readyCounts = new Map(slotOrder.map((slot) => [slot, 0]));

  for (const item of items) {
    if (item.status !== "ready") {
      continue;
    }

    readyCounts.set(
      item.slotPreference,
      (readyCounts.get(item.slotPreference) ?? 0) + 1
    );
  }

  return [...slotOrder].sort((left, right) => {
    const countDifference =
      (readyCounts.get(left) ?? 0) - (readyCounts.get(right) ?? 0);

    if (countDifference !== 0) {
      return countDifference;
    }

    return slotOrder.indexOf(left) - slotOrder.indexOf(right);
  })[0];
};

export const fallbackPosts = () => sampleQueueItems();

const parseDraftFromPrompt = async ({
  prompt,
  manualIdea
}: {
  prompt: string;
  manualIdea?: ManualIdea;
}) => {
  if (!hasOpenAi() || !appEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({ apiKey: appEnv.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: appEnv.OPENAI_MODEL,
    instructions:
      "You are a creative director and copywriter for a visually sophisticated Instagram account. Return JSON only.",
    input: prompt,
    max_output_tokens: 2200,
    reasoning: {
      effort: reasoningEffortForModel(appEnv.OPENAI_MODEL)
    },
    text: {
      format: zodTextFormat(responseSchema, "instagram_post_package"),
      verbosity: "low"
    }
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return a parsed structured response.");
  }

  return buildQueueItem(parsed, manualIdea);
};

const generateDraft = async ({
  slot,
  queue,
  published,
  manualIdea,
  revisionNotes,
  forcedContentMode,
  seedIdea
}: {
  slot: SlotName;
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdea?: ManualIdea;
  revisionNotes?: string[];
  forcedContentMode?: ContentMode;
  seedIdea?: string;
}) => {
  if (!hasOpenAi() || !appEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const prompt = buildPostPrompt({
    slot,
    recentPublished: published,
    queue,
    manualIdea,
    revisionNotes,
    forcedContentMode,
    seedIdea
  });

  return parseDraftFromPrompt({ prompt, manualIdea });
};

export const generateWithOpenAi = async ({
  slot,
  queue,
  published,
  manualIdea,
  forcedContentMode,
  seedIdea
}: {
  slot: SlotName;
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdea?: ManualIdea;
  forcedContentMode?: ContentMode;
  seedIdea?: string;
}) => {
  let revisionNotes: string[] | undefined;
  let lastItem: QueueItem | undefined;
  let lastReasons: string[] = [];

  const firstDraft = await generateDraft({
    slot,
    queue,
    published,
    manualIdea,
    forcedContentMode,
    seedIdea
  });
  lastItem = firstDraft;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const item: QueueItem =
      attempt === 1
        ? firstDraft
        : await parseDraftFromPrompt({
            prompt: buildRevisionPrompt({
              draft: lastItem,
              revisionNotes: revisionNotes ?? lastReasons
            }),
            manualIdea
          });
    lastItem = item;

    const review = await reviewQueueItem(item);
    if (review.approved) {
      if (attempt > 1) {
        logStep(`Accepted revised draft for ${item.title} on attempt ${attempt}.`);
      }
      return item;
    }

    lastReasons = review.review.reasons;
    revisionNotes =
      review.review.revisionBrief.length > 0
        ? review.review.revisionBrief
        : review.review.reasons;
    logWarn(
      `Rejected draft attempt ${attempt} for ${item.title}: ${lastReasons.join(" | ")}`
    );
  }

  throw new Error(
    `Unable to generate an approved post after 3 attempts.${lastItem ? ` Last title: ${lastItem.title}.` : ""} ${lastReasons.join(" ")}`
  );
};

export const topUpQueue = async ({
  queue,
  published,
  manualIdeas,
  desiredCount
}: {
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdeas: ManualIdea[];
  desiredCount: number;
}) => {
  const readyCount = queue.items.filter((item) => item.status === "ready").length;
  const missing = Math.max(desiredCount - readyCount, 0);

  if (missing === 0) {
    logStep("Queue already meets target size.");
    return [];
  }

  const generated: QueueItem[] = [];

  if (!hasOpenAi()) {
    logWarn("OPENAI_API_KEY is not set. Seeding the queue with curated fallback examples.");
    return fallbackPosts().slice(0, missing);
  }

  for (let index = 0; index < missing; index += 1) {
    const slot = nextSlotForQueue([...queue.items, ...generated]);
    const manualIdea = manualIdeas[index];

    logStep(`Generating queue item ${index + 1} of ${missing} for ${slot}.`);
    const item = await generateWithOpenAi({
      slot,
      queue: {
        ...queue,
        items: [...queue.items, ...generated]
      },
      published,
      manualIdea,
      forcedContentMode: undefined,
      seedIdea: manualIdea?.idea
    });

    generated.push(item);
  }

  return generated;
};

export const queueTarget = () => brand.queueTarget;
