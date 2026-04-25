import { brand, slotTimes } from "../config/brand.js";
import type { ManualIdea, PublishedLogFile, QueueFile, SlotName } from "../types.js";

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

Format guidance:
- Choose either a single-image quote/editorial post OR a carousel.
- Singles should feel punchy and memorable.
- Carousels should feel like miniature essays with momentum and a reason to swipe.

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
  "templateFamily": "oracle" | "margin" | "editorial" | "signal" | "lesson",
  "palette": "emberParchment" | "midnightPaper" | "sageAsh" | "brassInk",
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
`.trim();
};
