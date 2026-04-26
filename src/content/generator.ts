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
import { contentModeProfiles } from "./mode-profiles.js";
import { modePlaybooks } from "./mode-playbooks.js";
import { createOpenAiClient, parseStructuredResponse } from "./openai.js";
import {
  buildCandidatePrompt,
  buildPlanningPrompt,
  buildPolishPrompt,
  buildSelectionPrompt,
  deriveTargetMode
} from "./prompts.js";
import { reviewQueueItem, type ReviewResult } from "./quality.js";
import { isPublishableStatus } from "../queue/selection.js";

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
    hashtags: z.array(z.string()).max(4)
  })
});

const planningSchema = z.object({
  contentMode: z.enum(contentModeValues),
  slotPreference: z.enum(slotValues),
  kind: z.enum(["single", "carousel"]),
  slideCount: z.number().int().nullable(),
  templateFamily: z.enum(templateFamilyValues),
  palette: z.enum(paletteValues),
  surfaceStyle: z.enum(surfaceStyleValues),
  voiceMode: z.enum(["contrarian", "reflective", "sharp"]),
  title: z.string(),
  topic: z.string(),
  angle: z.string(),
  readerMoment: z.string(),
  emotionalCore: z.string(),
  imageIntent: z.string(),
  captionIntent: z.string(),
  concreteAnchors: z.array(z.string()).min(2).max(5),
  mustInclude: z.array(z.string()).max(5),
  mustAvoid: z.array(z.string()).min(3).max(6),
  cardBlueprint: z.array(z.string()).min(1).max(5),
  commentStyle: z.enum(["none", "reflective", "direct"])
});

const selectionSchema = z.object({
  winnerIndex: z.number().int().min(1).max(3),
  rationale: z.string(),
  preserve: z.array(z.string()).min(1).max(4),
  polishPriorities: z.array(z.string()).min(1).max(5)
});

type DraftPlan = z.infer<typeof planningSchema>;
type SelectionDecision = z.infer<typeof selectionSchema>;

interface CandidateRun {
  index: number;
  laneName: string;
  item: QueueItem;
  review: ReviewResult;
  score: number;
}

const buildQueueItem = (
  parsed: z.infer<typeof responseSchema>,
  manualIdea?: ManualIdea,
  pipelineNote?: string
): QueueItem => {
  const title = trimParagraphs(parsed.title);
  const angle = trimParagraphs(parsed.angle);
  const topic = trimParagraphs(parsed.topic);
  const createdAt = nowIso();
  const id = buildContentId(createdAt, title);
  const notes = [
    manualIdea ? `Seeded from manual idea ${manualIdea.id}` : undefined,
    pipelineNote
  ].filter((value): value is string => Boolean(value));

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
    notes: notes.length > 0 ? notes.join(" | ") : undefined
  });
};

const nextSlotForQueue = (items: QueueItem[]) => {
  const readyCounts = new Map(slotOrder.map((slot) => [slot, 0]));

  for (const item of items) {
    if (!isPublishableStatus(item.status)) {
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

export const countPublishableItems = (items: QueueItem[]) =>
  items.filter((item) => isPublishableStatus(item.status)).length;

export const fallbackPosts = () => sampleQueueItems();

const planToJson = (plan: DraftPlan) => JSON.stringify(plan, null, 2);

const scoreReview = (review: ReviewResult) =>
  review.review.overall * 2 +
  review.review.humanVoice * 2 +
  review.review.specificity * 1.4 +
  review.review.freshness * 1.4 +
  review.review.captionDelta * 1.1 +
  review.review.visualFit * 1.1 +
  review.review.modeFit * 1.4 +
  (review.approved ? 6 : 0);

const compactReasons = (review: ReviewResult) =>
  review.review.reasons.length > 0
    ? review.review.reasons
    : review.review.revisionBrief.slice(0, 3);

const stabilizePlan = (
  plan: DraftPlan,
  slot: SlotName,
  targetMode: ContentMode
) => {
  const profile = contentModeProfiles[targetMode];

  plan.slotPreference = slot;
  plan.contentMode = targetMode;

  if (plan.kind === "single") {
    plan.slideCount = null;
    return plan;
  }

  if (!plan.slideCount) {
    plan.slideCount = profile.preferredSlideCounts?.[0] ?? 3;
  }

  return plan;
};

const alignItemToPlan = (item: QueueItem, plan: DraftPlan) => {
  if (item.kind !== plan.kind) {
    throw new Error(`Draft ignored plan kind. Expected ${plan.kind}, received ${item.kind}.`);
  }

  if (plan.kind === "single" && !item.single) {
    throw new Error("Draft planned as single but single payload is missing.");
  }

  if (plan.kind === "carousel") {
    if (!item.carousel?.length) {
      throw new Error("Draft planned as carousel but carousel payload is missing.");
    }

    if (plan.slideCount && item.carousel.length !== plan.slideCount) {
      throw new Error(
        `Draft ignored planned slide count. Expected ${plan.slideCount}, received ${item.carousel.length}.`
      );
    }
  }

  item.slotPreference = plan.slotPreference;
  item.contentMode = plan.contentMode;
  item.templateFamily = plan.templateFamily;
  item.palette = plan.palette;
  item.surfaceStyle = plan.surfaceStyle;
  item.voiceMode = plan.voiceMode;
  return item;
};

const polishPrioritiesForRun = (
  winner: CandidateRun,
  decision: SelectionDecision
) => {
  const seen = new Set<string>();
  const merged = [...decision.polishPriorities, ...winner.review.review.revisionBrief];

  return merged.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const parseDraftFromPrompt = async ({
  client,
  prompt,
  manualIdea,
  pipelineNote
}: {
  client: ReturnType<typeof createOpenAiClient>;
  prompt: string;
  manualIdea?: ManualIdea;
  pipelineNote?: string;
}) => {
  const parsed = await parseStructuredResponse({
    client,
    schema: responseSchema,
    schemaName: "instagram_post_package",
    instructions:
      "You are a creative director and copywriter for a visually sophisticated Instagram account. Return JSON only.",
    input: prompt,
    maxOutputTokens: 2200
  });

  return buildQueueItem(parsed, manualIdea, pipelineNote);
};

const generatePlan = async ({
  client,
  slot,
  queue,
  published,
  manualIdea,
  forcedContentMode,
  seedIdea
}: {
  client: ReturnType<typeof createOpenAiClient>;
  slot: SlotName;
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdea?: ManualIdea;
  forcedContentMode?: ContentMode;
  seedIdea?: string;
}) =>
  parseStructuredResponse({
    client,
    schema: planningSchema,
    schemaName: "instagram_content_plan",
    instructions:
      "You are the planning brain for a premium text-first Instagram account. Build a concrete, specific plan before prose is written. Return JSON only.",
    input: buildPlanningPrompt({
      slot,
      recentPublished: published,
      queue,
      manualIdea,
      forcedContentMode,
      seedIdea
    }),
    maxOutputTokens: 1500
  });

const generateLaneCandidate = async ({
  client,
  laneName,
  laneInstruction,
  mode,
  planJson,
  manualIdea
}: {
  client: ReturnType<typeof createOpenAiClient>;
  laneName: string;
  laneInstruction: string;
  mode: ContentMode;
  planJson: string;
  manualIdea?: ManualIdea;
}) =>
  parseDraftFromPrompt({
    client,
    prompt: buildCandidatePrompt({
      planJson,
      laneName,
      laneInstruction,
      mode
    }),
    manualIdea,
    pipelineNote: `AI pipeline lane ${laneName}`
  });

const chooseWinner = async ({
  client,
  planJson,
  candidates
}: {
  client: ReturnType<typeof createOpenAiClient>;
  planJson: string;
  candidates: CandidateRun[];
}) => {
  const fallback = [...candidates].sort((left, right) => right.score - left.score)[0];

  if (candidates.length === 1) {
    return {
      winner: fallback,
      decision: {
        winnerIndex: fallback.index,
        rationale: "Only one candidate remained after review.",
        preserve: compactReasons(fallback.review).slice(0, 2),
        polishPriorities: fallback.review.review.revisionBrief.slice(0, 4)
      }
    };
  }

  try {
    const decision = await parseStructuredResponse({
      client,
      schema: selectionSchema,
      schemaName: "instagram_candidate_selection",
      instructions:
        "You are an editorial selector choosing the best candidate from multiple drafts. Return JSON only.",
      input: buildSelectionPrompt({
        planJson,
        candidates: candidates.map((candidate) => ({
          index: candidate.index,
          laneName: candidate.laneName,
          score: candidate.score,
          reviewSummary: compactReasons(candidate.review),
          item: candidate.item
        }))
      }),
      maxOutputTokens: 700
    });

    const winner =
      candidates.find((candidate) => candidate.index === decision.winnerIndex) ?? fallback;

    return {
      winner,
      decision
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWarn(`Comparative selection failed. Using top-scoring candidate. ${message}`);

    return {
      winner: fallback,
      decision: {
        winnerIndex: fallback.index,
        rationale: "Top-scoring draft selected by deterministic rubric fallback.",
        preserve: compactReasons(fallback.review).slice(0, 2),
        polishPriorities: fallback.review.review.revisionBrief.slice(0, 4)
      }
    };
  }
};

export const generateWithOpenAi = async ({
  slot,
  queue,
  published,
  manualIdea,
  forcedContentMode,
  seedIdea,
  allowSoftPass = false
}: {
  slot: SlotName;
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdea?: ManualIdea;
  forcedContentMode?: ContentMode;
  seedIdea?: string;
  allowSoftPass?: boolean;
}) => {
  if (!hasOpenAi() || !appEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const client = createOpenAiClient();
  const targetMode = forcedContentMode ?? deriveTargetMode(slot, queue);
  const playbook = modePlaybooks[targetMode];

  const rawPlan = await generatePlan({
    client,
    slot,
    queue,
    published,
    manualIdea,
    forcedContentMode: targetMode,
    seedIdea
  });
  const plan = stabilizePlan(rawPlan, slot, targetMode);
  const planJson = planToJson(plan);

  const candidateSettled = await Promise.allSettled(
    playbook.draftLanes.map((lane, index) =>
      generateLaneCandidate({
        client,
        laneName: lane.name,
        laneInstruction: lane.instruction,
        mode: targetMode,
        planJson,
        manualIdea
      }).then((item) => ({
        index: index + 1,
        laneName: lane.name,
        item: alignItemToPlan(item, plan)
      }))
    )
  );

  const parsedCandidates = candidateSettled.flatMap((result) => {
    if (result.status === "rejected") {
      logWarn(`Candidate generation failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      return [];
    }

    return [result.value];
  });

  if (parsedCandidates.length === 0) {
    throw new Error(`No candidate drafts were generated for mode ${targetMode}.`);
  }

  const reviewedCandidates: CandidateRun[] = [];
  for (const candidate of parsedCandidates) {
    const review = await reviewQueueItem(candidate.item, {
      planJson,
      laneName: candidate.laneName,
      rubricEmphasis: playbook.rubricEmphasis
    });

    reviewedCandidates.push({
      index: candidate.index,
      laneName: candidate.laneName,
      item: candidate.item,
      score: scoreReview(review),
      review
    });
  }

  const candidatePool = reviewedCandidates.some((candidate) => candidate.review.approved)
    ? reviewedCandidates.filter((candidate) => candidate.review.approved)
    : [...reviewedCandidates].sort((left, right) => right.score - left.score).slice(0, 2);

  const { winner, decision } = await chooseWinner({
    client,
    planJson,
    candidates: candidatePool
  });

  let polished = await parseDraftFromPrompt({
    client,
    prompt: buildPolishPrompt({
      planJson,
      draft: winner.item,
      preserve: decision.preserve,
      polishPriorities: polishPrioritiesForRun(winner, decision),
      rationale: decision.rationale
    }),
    manualIdea,
    pipelineNote: `AI pipeline winner ${winner.laneName}`
  });
  polished = alignItemToPlan(polished, plan);

  let lastFinalReview: ReviewResult | undefined;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const finalReview = await reviewQueueItem(polished, {
      planJson,
      laneName: `${winner.laneName}-polished`,
      rubricEmphasis: playbook.rubricEmphasis
    });
    lastFinalReview = finalReview;

    if (finalReview.approved) {
      polished.notes = [polished.notes, `Plan mode ${plan.contentMode}`]
        .filter((value): value is string => Boolean(value))
        .join(" | ");
      if (attempt > 1) {
        logStep(`Accepted polished draft for ${polished.title} on attempt ${attempt}.`);
      }
      return polished;
    }

    const revisionBrief =
      finalReview.review.revisionBrief.length > 0
        ? finalReview.review.revisionBrief
        : finalReview.review.reasons;

    logWarn(
      `Polish attempt ${attempt} failed for ${polished.title}: ${finalReview.review.reasons.join(" | ")}`
    );

    polished = await parseDraftFromPrompt({
      client,
      prompt: buildPolishPrompt({
        planJson,
        draft: polished,
        preserve: decision.preserve,
        polishPriorities: revisionBrief,
        rationale: `Further revision requested after editorial review of the selected ${winner.laneName} lane.`
      }),
      manualIdea,
      pipelineNote: `AI pipeline winner ${winner.laneName} revised`
    });
    polished = alignItemToPlan(polished, plan);
  }

  if (
    allowSoftPass &&
    lastFinalReview &&
    lastFinalReview.review.overall >= 5 &&
    lastFinalReview.review.humanVoice >= 5 &&
    lastFinalReview.review.specificity >= 5 &&
    lastFinalReview.review.freshness >= 5 &&
    lastFinalReview.review.visualFit >= 6 &&
    lastFinalReview.review.modeFit >= 5
  ) {
    polished.notes = [polished.notes, "Showcase soft-pass"]
      .filter((value): value is string => Boolean(value))
      .join(" | ");
    logWarn(`Soft-passing showcase draft for ${polished.title} after near-miss review.`);
    return polished;
  }

  throw new Error(
    `Unable to generate an approved post after planning, candidate fan-out, selection, and polish for mode ${targetMode}.`
  );
};

export const topUpQueue = async ({
  queue,
  published,
  manualIdeas,
  desiredCount,
  bestEffort = false
}: {
  queue: QueueFile;
  published: PublishedLogFile;
  manualIdeas: ManualIdea[];
  desiredCount: number;
  bestEffort?: boolean;
}) => {
  const publishableCount = countPublishableItems(queue.items);
  const missing = Math.max(desiredCount - publishableCount, 0);

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
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logWarn(`Queue top-up failed for ${slot}: ${message}`);

      if (!bestEffort) {
        throw error;
      }

      break;
    }
  }

  return generated;
};

export const queueTarget = () => brand.queueTarget;
