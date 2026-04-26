import {
  brand,
  contentModes,
  slotTimes,
  surfaceStyles,
  templateRotation
} from "../config/brand.js";
import type { ManualIdea, PublishedLogFile, QueueFile, SlotName } from "../types.js";
import { antiSlopRules, styleExamples, voicePrinciples } from "./style-examples.js";

const slotModePriorities = {
  morning: ["question", "encouragement", "aphorism", "advice"],
  midday: ["advice", "story", "observation", "question"],
  evening: ["story", "observation", "aphorism", "quote"]
} as const;

const slotTemplatePriorities = {
  morning: ["highlight", "notebook", "editorial", "oracle"],
  midday: ["notebook", "broadside", "highlight", "editorial"],
  evening: ["broadside", "signal", "editorial", "highlight"]
} as const;

const rankUnderused = <T extends string>(
  values: readonly T[],
  counts: Map<string, number>,
  preferred: readonly T[]
) =>
  [...values].sort((left, right) => {
    const countDifference = (counts.get(left) ?? 0) - (counts.get(right) ?? 0);

    if (countDifference !== 0) {
      return countDifference;
    }

    const leftPreference = preferred.indexOf(left);
    const rightPreference = preferred.indexOf(right);
    const normalizedLeft = leftPreference === -1 ? values.length : leftPreference;
    const normalizedRight = rightPreference === -1 ? values.length : rightPreference;

    if (normalizedLeft !== normalizedRight) {
      return normalizedLeft - normalizedRight;
    }

    return left.localeCompare(right);
  });

const fewShotBlock = styleExamples
  .map(
    (example, index) => `
Example ${index + 1}: ${example.name}
- Why it works: ${example.whyItWorks}
- Image copy:
${example.image}
- Caption hook: ${example.captionHook}
- Caption body: ${example.captionBody}
- Comment question: ${example.commentQuestion}
`.trim()
  )
  .join("\n\n");

export const buildPostPrompt = ({
  slot,
  recentPublished,
  queue,
  manualIdea,
  revisionNotes
}: {
  slot: SlotName;
  recentPublished: PublishedLogFile;
  queue: QueueFile;
  manualIdea?: ManualIdea;
  revisionNotes?: string[];
}) => {
  const recentTitles = recentPublished.entries
    .slice(-18)
    .map((entry) => `- ${entry.title}: ${entry.angle}`)
    .join("\n");

  const queuedTitles = queue.items
    .filter((item) => item.status !== "published")
    .slice(-12)
    .map((item) => `- ${item.title}: ${item.angle}`)
    .join("\n");

  const manualSection = manualIdea
    ? `Use this human-supplied seed as the raw material, but write with restraint and originality:\n${manualIdea.idea}`
    : "No human seed idea is available. Start from a sharp original observation.";

  const activeQueue = queue.items.filter((item) => item.status !== "published");
  const contentModeCounts = new Map<string, number>();
  const templateCounts = new Map<string, number>();

  for (const item of activeQueue) {
    contentModeCounts.set(
      item.contentMode,
      (contentModeCounts.get(item.contentMode) ?? 0) + 1
    );
    templateCounts.set(
      item.templateFamily,
      (templateCounts.get(item.templateFamily) ?? 0) + 1
    );
  }

  const suggestedModes = rankUnderused(
    contentModes,
    contentModeCounts,
    slotModePriorities[slot]
  )
    .slice(0, 3)
    .join(", ");
  const suggestedTemplates = rankUnderused(
    templateRotation,
    templateCounts,
    slotTemplatePriorities[slot]
  )
    .slice(0, 4)
    .join(", ");

  const revisionBlock =
    revisionNotes && revisionNotes.length > 0
      ? `Your previous attempt was rejected. Fix these issues directly:\n- ${revisionNotes.join("\n- ")}`
      : "No prior revision notes.";

  return `
You are creating one Instagram-ready content package for a premium writing account.

Brand target:
- Audience: ${brand.audience}
- Tone: ${brand.tone}
- Visual direction: ${brand.visualDirection}
- Preferred posting slot: ${slot} (${slotTimes[slot]})

Core strategy:
${brand.editorialRules.map((rule) => `- ${rule}`).join("\n")}

Voice principles:
${voicePrinciples.map((rule) => `- ${rule}`).join("\n")}

Anti-slop rules:
${antiSlopRules.map((rule) => `- ${rule}`).join("\n")}

Variety pressure for this generation:
- Underused content modes: ${suggestedModes}
- Underused template families: ${suggestedTemplates}
- For the ${slot} slot, lean toward: ${slotModePriorities[slot].join(", ")}
- This draft must widen the feed, not blend into the current queue.

Recent published posts to avoid repeating:
${recentTitles || "- none yet"}

Current queued ideas to avoid overlapping with:
${queuedTitles || "- none yet"}

${manualSection}

${revisionBlock}

Few-shot style references:
${fewShotBlock}

Planning instructions:
- Privately brainstorm 3 radically different directions before writing.
- Reject any direction that sounds like generic self-help, coaching copy, therapy-template language, or engagement farming.
- Pick the direction with the cleanest sentence music, strongest human specificity, and clearest save-worthy line.
- Keep the image copy tighter than the caption.
- Make the caption add a second move, not a restatement.

Do not use these phrases, or anything similarly self-descriptive, inside the post or caption:
${brand.forbiddenPhrases.map((phrase) => `- ${phrase}`).join("\n")}

Return valid JSON only with this exact shape:
{
  "kind": "single" | "carousel",
  "templateFamily": "oracle" | "margin" | "editorial" | "signal" | "lesson" | "highlight" | "notebook" | "broadside",
  "palette": "emberParchment" | "midnightPaper" | "sageAsh" | "brassInk" | "bluePlaster" | "roseLedger",
  "surfaceStyle": ${surfaceStyles.map((value) => `"${value}"`).join(" | ")},
  "contentMode": ${contentModes.map((value) => `"${value}"`).join(" | ")},
  "voiceMode": "contrarian" | "reflective" | "sharp",
  "slotPreference": "morning" | "midday" | "evening",
  "title": "short internal title",
  "topic": "specific theme",
  "angle": "one-sentence explanation of the idea",
  "quoteAttribution": "real source name only, otherwise null",
  "altText": "clear alt text",
  "single": {
    "headline": "required for single",
    "body": "required for single",
    "supportLine": "optional",
    "footer": "optional"
  },
  "carousel": [
    {
      "kicker": "optional short kicker",
      "headline": "required",
      "body": "required",
      "footer": "optional"
    }
  ],
  "caption": {
    "hook": "1 sentence",
    "body": "2 to 4 sentences",
    "callToComment": "1 precise question that earns comments naturally",
    "hashtags": ["3 to 6 concise hashtags"]
  }
}

Rules:
- Exactly one of "single" or "carousel" should be populated. The other must be null.
- If carousel is chosen, provide 5 slides.
- English only.
- Do not use emojis.
- Keep every field short enough to fit on the card beautifully.
- Original writing is preferred unless a quote genuinely improves the post.
- If using a quote, attribution must be certain and the quote must stay short.
- Never narrate the tone, strategy, posting slot, audience, or desired engagement inside the post or caption.
- The image should never contain meta labels, fake source labels, or page labels for a single-image post.
- If there is no real source, set "quoteAttribution" to null. Never output the string "null".
- Hashtags must be lowercase and begin with "#".
- You may wrap 1 to 3 exact phrases in [[double brackets]] to request visual highlighting on the card.
- "story" content must never pretend to be a true autobiographical confession from the account owner unless the seed idea explicitly says so.
- Prefer crisp endings over inspirational blur.
`.trim();
};

export const buildRevisionPrompt = ({
  draft,
  revisionNotes
}: {
  draft: unknown;
  revisionNotes: string[];
}) =>
  `
Revise this Instagram content package.

Goals:
- Make it sound more human, more singular, and less like a generated content artifact.
- Keep the strongest underlying idea.
- Shorten wherever the draft is over-explaining itself.
- Make the caption add a second move instead of repeating the card.
- Keep the final output visually renderable.

Required fixes:
- ${revisionNotes.join("\n- ")}

Candidate JSON to revise:
${JSON.stringify(draft, null, 2)}

Return valid JSON only in the exact same schema as the input package.
`.trim();
