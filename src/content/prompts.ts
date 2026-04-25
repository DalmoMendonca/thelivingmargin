import {
  brand,
  contentModes,
  slotTimes,
  surfaceStyles,
  templateRotation
} from "../config/brand.js";
import type { ManualIdea, PublishedLogFile, QueueFile, SlotName } from "../types.js";

const slotModePriorities = {
  morning: ["encouragement", "question", "aphorism", "advice"],
  midday: ["advice", "story", "observation", "question"],
  evening: ["aphorism", "quote", "observation", "story"]
} as const;

const slotTemplatePriorities = {
  morning: ["highlight", "oracle", "signal", "notebook"],
  midday: ["notebook", "lesson", "highlight", "broadside"],
  evening: ["broadside", "editorial", "oracle", "highlight"]
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

export const buildPostPrompt = ({
  slot,
  recentPublished,
  queue,
  manualIdea
}: {
  slot: SlotName;
  recentPublished: PublishedLogFile;
  queue: QueueFile;
  manualIdea?: ManualIdea;
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
    ? `Use this human-supplied seed idea as the starting point without copying it too literally:\n${manualIdea.idea}`
    : "No human seed idea is available for this post. Generate a fresh idea from scratch.";

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

  return `
You are creating a single Instagram-ready content package for a highly curated account.

Brand target:
- Audience: ${brand.audience}
- Tone: ${brand.tone}
- Visual direction: ${brand.visualDirection}
- Preferred posting slot: ${slot} (${slotTimes[slot]})

Account goals:
- Optimize for resonance, saves, shares, and the kind of comments that come from recognition or disagreement.
- Feel genuinely human, literary, and intentional.
- Avoid generic self-help sludge, vague platitudes, therapy-speak, hustle-bro cliches, or fake mysticism.
- English only.
- If using a quote, attribution must be certain and the quote must stay short.
- Original writing is preferred unless a quote genuinely improves the post.
- Avoid politics, medical claims, financial claims, adult content, and copyrighted long excerpts.

Editorial strategy:
${brand.editorialRules.map((rule) => `- ${rule}`).join("\n")}

Variety pressure for this generation:
- Underused content modes in the active queue: ${suggestedModes}
- Underused template families in the active queue: ${suggestedTemplates}
- For the ${slot} slot, especially consider: ${slotModePriorities[slot].join(", ")}
- Let this post widen the feed instead of blending into the existing queue.

Format guidance:
- Choose either a single-image quote/editorial post OR a carousel.
- Singles should feel punchy and memorable.
- Carousels should feel like miniature essays with momentum and a reason to swipe.
- Build a better mix than a pure "thinking account." Some posts should feel quotable, some useful, some emotionally precise, some story-driven, some encouraging.
- Use visual variety without losing the brand: textured surfaces, highlighted phrases, denser text blocks, occasional quieter minimalist cards.
- Do not imitate or paraphrase specific reference-account posts. Be original.

Recent published posts to avoid repeating:
${recentTitles || "- none yet"}

Current queued ideas to avoid overlapping with:
${queuedTitles || "- none yet"}

${manualSection}

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
    "body": "2 to 5 sentences",
    "callToComment": "1 precise question that earns comments naturally",
    "hashtags": ["3 to 6 concise hashtags"]
  }
}

Rules:
- Exactly one of "single" or "carousel" should be populated. The other must be null.
- If carousel is chosen, provide 5 slides.
- Do not use emojis.
- Keep copy tight enough to fit on beautifully designed slides.
- Make the post arguable enough that smart people may disagree in the comments.
- Never narrate the tone, strategy, posting slot, audience, or desired engagement inside the post or caption.
- The image should never contain meta labels such as "contrarian," "comment bait," "morning prompt," or generic engagement instructions.
- The caption should sound authored, not automated. No filler, no AI hedging, and no fake citation lines.
- If there is no real, verifiable source, set "quoteAttribution" to null. Never output the string "null".
- Hashtags must be lowercase and begin with "#".
- You may wrap 1 to 3 exact phrases in [[double brackets]] to request visual highlighting on the card. Use that sparingly and only when it improves rhythm or emphasis.
- "story" content must never pretend to be a true autobiographical confession from the account owner unless the seed idea explicitly says so.
- Prefer "highlight", "notebook", or "broadside" when the copy benefits from denser text, vivid emphasis, or a more human-made poster feel.
`.trim();
};
