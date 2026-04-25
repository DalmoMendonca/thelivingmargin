import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { appEnv, brand, hasOpenAi, slotOrder } from "../config/brand.js";
import type { ManualIdea, PublishedLogFile, QueueFile, QueueItem, SlotName } from "../types.js";
import { logStep, logWarn } from "../util/log.js";
import { makeFingerprint, slugify, trimParagraphs } from "../util/text.js";
import { nowIso } from "../util/time.js";
import { sampleQueueItems } from "./fallback-posts.js";
import { buildPostPrompt } from "./prompts.js";

const templateFamilyValues = [
  "oracle",
  "margin",
  "editorial",
  "signal",
  "lesson"
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
  palette: z.enum(["emberParchment", "midnightPaper", "sageAsh", "brassInk"]),
  voiceMode: z.enum(["contrarian", "reflective", "sharp"]),
  slotPreference: z.enum(slotValues),
  title: z.string(),
  topic: z.string(),
  angle: z.string(),
  quoteAttribution: z.string().nullable().optional(),
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
    callToComment: z.string(),
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
  const id = `${createdAt.slice(0, 10)}-${slugify(title)}`;

  return {
    id,
    createdAt,
    source: manualIdea ? "manual" : "ai",
    slotPreference: parsed.slotPreference as QueueItem["slotPreference"],
    kind: parsed.kind,
    templateFamily: parsed.templateFamily as QueueItem["templateFamily"],
    palette: parsed.palette,
    title,
    topic,
    angle,
    fingerprint: makeFingerprint(title, angle, topic),
    voiceMode: parsed.voiceMode,
    quoteAttribution: parsed.quoteAttribution ?? undefined,
    altText: trimParagraphs(parsed.altText),
    single:
      parsed.kind === "single" && parsed.single
        ? {
            headline: trimParagraphs(parsed.single.headline),
            body: trimParagraphs(parsed.single.body),
            supportLine: parsed.single.supportLine
              ? trimParagraphs(parsed.single.supportLine)
              : undefined,
            footer: parsed.single.footer ? trimParagraphs(parsed.single.footer) : undefined
          }
        : undefined,
    carousel:
      parsed.kind === "carousel" && parsed.carousel
        ? parsed.carousel.map((slide) => ({
            kicker: slide.kicker ? trimParagraphs(slide.kicker) : undefined,
            headline: trimParagraphs(slide.headline),
            body: trimParagraphs(slide.body),
            footer: slide.footer ? trimParagraphs(slide.footer) : undefined
          }))
        : undefined,
    caption: {
      hook: trimParagraphs(parsed.caption.hook),
      body: trimParagraphs(parsed.caption.body),
      callToComment: trimParagraphs(parsed.caption.callToComment),
      hashtags: parsed.caption.hashtags.map((tag) => tag.trim())
    },
    publishAttempts: 0,
    status: "ready",
    notes: manualIdea ? `Seeded from manual idea ${manualIdea.id}` : undefined
  };
};

export const fallbackPosts = () => sampleQueueItems();

export const generateWithOpenAi = async ({
  slot,
  queue,
  published,
  manualIdea
}: {
  slot: SlotName;
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdea?: ManualIdea;
}) => {
  if (!hasOpenAi() || !appEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = new OpenAI({ apiKey: appEnv.OPENAI_API_KEY });
  const prompt = buildPostPrompt({
    slot,
    recentPublished: published,
    queue,
    manualIdea
  });

  const response = await client.responses.parse({
    model: appEnv.OPENAI_MODEL,
    instructions:
      "You are a creative director and copywriter for a visually sophisticated Instagram account. Return JSON only.",
    input: prompt,
    max_output_tokens: 2200,
    reasoning: {
      effort: "minimal"
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
    const slot = slotOrder[(readyCount + index) % slotOrder.length];
    const manualIdea = manualIdeas[index];

    logStep(`Generating queue item ${index + 1} of ${missing} for ${slot}.`);
    const item = await generateWithOpenAi({
      slot,
      queue: {
        ...queue,
        items: [...queue.items, ...generated]
      },
      published,
      manualIdea
    });

    generated.push(item);
  }

  return generated;
};

export const queueTarget = () => brand.queueTarget;
