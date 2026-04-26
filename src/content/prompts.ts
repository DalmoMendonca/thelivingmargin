import {
  brand,
  contentModes,
  slotTimes,
  surfaceStyles,
  templateRotation
} from "../config/brand.js";
import type {
  ContentMode,
  ManualIdea,
  PublishedLogFile,
  QueueFile,
  QueueItem,
  SlotName
} from "../types.js";
import { contentModeProfiles } from "./mode-profiles.js";

const slotModePriorities: Record<SlotName, ContentMode[]> = {
  morning: ["question", "encouragement", "aphorism", "reframe", "quote", "advice"],
  midday: ["advice", "observation", "reframe", "list", "question", "quote"],
  evening: ["story", "dialogue", "observation", "quote", "aphorism", "encouragement"]
};

const slotTemplatePriorities: Record<SlotName, (typeof templateRotation)[number][]> = {
  morning: ["highlight", "notebook", "editorial", "oracle"],
  midday: ["notebook", "highlight", "broadside", "editorial"],
  evening: ["notebook", "broadside", "signal", "editorial"]
};

const voicePrinciples = [
  "Write like a person with taste and lived language, not a content category.",
  "Prefer concrete nouns, observed behavior, and spoken-cadence sentences over abstract uplift.",
  "Let the image carry the sharpest line. Let the caption add consequence, scene, or a second move.",
  "Keep emotional restraint. Do not announce emotion the event itself already proves.",
  "A good post sounds authored in one sitting, not workshop-polished into generic safety.",
  "If the sentence could belong to any self-help account, it is not ready."
];

const antiSlopRules = [
  "Do not sound like a coach, therapist template, or productivity page.",
  "Avoid broad filler openers like 'Some people', 'A lot of people', 'In a world', or 'Maybe this is your sign'.",
  "Avoid stale reversals unless the replacement frame is genuinely more precise.",
  "Avoid generic uplift with no object, no tradeoff, no scene, and no consequence.",
  "Do not repeat the graphic verbatim in the caption.",
  "Do not narrate tone, engagement strategy, posting slot, or audience inside the post."
];

const modeStructureRules: Record<ContentMode, string[]> = {
  aphorism: [
    "Use a single-image post.",
    "Headline should usually be one sentence and 6 to 14 words.",
    "Body should be one short clarifying sentence or two very short lines, not a paragraph.",
    "Name the actual object when possible: job, text thread, promise, habit, room, friendship, schedule, apology, bill, visit.",
    "If the line cannot survive screenshotting on its own, start over."
  ],
  advice: [
    "Single-image advice should offer one tactic people can use this week.",
    "Carousel advice should be 5 slides unless the tactic is truly better compressed.",
    "Each slide must add utility, not atmosphere."
  ],
  story: [
    "Use a 3-slide carousel.",
    "Slide 1 opens inside the disruption, not before it.",
    "Slide 2 moves the event forward through a human action or revelation.",
    "Slide 3 resolves with emotional afterglow, not preachy moralizing."
  ],
  quote: [
    "Keep the quote short enough to fit beautifully on the card.",
    "The caption should explain why the line still matters now, not praise the author."
  ],
  encouragement: [
    "Use a single-image post.",
    "Lead with earned permission or relief, then add one clarifying truth.",
    "Keep the total copy tighter than a pep talk."
  ],
  observation: [
    "Anchor the post in a recognizable behavior, phrase, or social ritual.",
    "If using a carousel, each slide should sharpen the pattern instead of merely restating it."
  ],
  question: [
    "Use a single-image post.",
    "Headline should contain one question only.",
    "Body should sharpen the cost of the question in two short declarative moves."
  ],
  reframe: [
    "Name the old interpretation first, then replace it cleanly.",
    "The replacement frame must be more useful in lived life, not just more dramatic."
  ],
  dialogue: [
    "Prefer a 3-slide carousel.",
    "Each slide should move the exchange forward.",
    "Quoted lines should sound spoken, incomplete, and human rather than maxim-like."
  ],
  list: [
    "Use a 5-slide carousel.",
    "Slide 1 makes the promise; slides 2 to 4 deliver distinct items; slide 5 synthesizes or lands the turn.",
    "No filler items."
  ]
};

const modeOutputConstraints = (mode: ContentMode, profile = contentModeProfiles[mode]) => {
  const lines: string[] = [];

  if (profile.preferredKinds.length === 1) {
    lines.push(`For ${mode}, "kind" must be "${profile.preferredKinds[0]}".`);
  } else {
    lines.push(`For ${mode}, choose from: ${profile.preferredKinds.join(" or ")}.`);
  }

  if (profile.preferredSlideCounts?.length === 1) {
    lines.push(
      `If ${mode} uses a carousel, it must contain exactly ${profile.preferredSlideCounts[0]} slides.`
    );
  } else if (profile.preferredSlideCounts && profile.preferredSlideCounts.length > 1) {
    lines.push(
      `If ${mode} uses a carousel, choose exactly ${profile.preferredSlideCounts.join(" or ")} slides.`
    );
  }

  return lines;
};

const sharedExamples = [
  {
    name: "Recognition aphorism",
    whyItWorks:
      "Fast recognition, quotable phrasing, and a caption that deepens the cost instead of restating the line.",
    image:
      "You keep calling it temporary\nbecause 'pattern' would require a response.",
    captionHook:
      "A surprising number of expensive habits survive by borrowing short-term language."
  },
  {
    name: "Observed scene",
    whyItWorks:
      "Uses a small scene people can picture immediately, then lands with meaning instead of melodrama.",
    image:
      "At brunch, everyone said they were 'bad at texting.'\nNobody sounded guilty. Just booked.",
    captionHook:
      "The friendliest distance usually arrives with a reasonable explanation."
  },
  {
    name: "Hard question",
    whyItWorks:
      "Specific enough to sting, simple enough to screenshot, and costly enough to earn comments.",
    image:
      "What are you calling [[discernment]]\nthat is really just fear\nwith better lighting?",
    captionHook: "A polished explanation can still be an alibi."
  }
];

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

const deriveTargetMode = (slot: SlotName, queue: QueueFile) => {
  const contentModeCounts = new Map<string, number>();

  for (const item of queue.items) {
    if (item.status === "published") {
      continue;
    }

    contentModeCounts.set(
      item.contentMode,
      (contentModeCounts.get(item.contentMode) ?? 0) + 1
    );
  }

  return rankUnderused(contentModes, contentModeCounts, slotModePriorities[slot])[0];
};

const recentTitlesBlock = (recentPublished: PublishedLogFile) =>
  recentPublished.entries
    .slice(-18)
    .map((entry) => `- ${entry.title}: ${entry.angle}`)
    .join("\n");

const queuedTitlesBlock = (queue: QueueFile) =>
  queue.items
    .filter((item) => item.status !== "published")
    .slice(-14)
    .map((item) => `- ${item.title}: ${item.angle}`)
    .join("\n");

const fewShotBlock = sharedExamples
  .map(
    (example, index) => `
Example ${index + 1}: ${example.name}
- Why it works: ${example.whyItWorks}
- Image copy:
${example.image}
- Caption hook: ${example.captionHook}
`.trim()
  )
  .join("\n\n");

const modePromptBlock = ({
  mode,
  slot,
  queue
}: {
  mode: ContentMode;
  slot: SlotName;
  queue: QueueFile;
}) => {
  const profile = contentModeProfiles[mode];
  const templateCounts = new Map<string, number>();

  for (const item of queue.items) {
    if (item.status === "published") {
      continue;
    }

    templateCounts.set(
      item.templateFamily,
      (templateCounts.get(item.templateFamily) ?? 0) + 1
    );
  }

  const suggestedTemplates = rankUnderused(
    profile.preferredTemplates,
    templateCounts,
    slotTemplatePriorities[slot].filter((value) => profile.preferredTemplates.includes(value))
  );

  const slideCounts =
    profile.preferredSlideCounts && profile.preferredSlideCounts.length > 0
      ? profile.preferredSlideCounts.join(" or ")
      : "3 or 5";

  return `
Target content mode: ${mode} (${profile.label})

Mode objective:
- ${profile.objective}
- Why it wins: ${profile.whyItWins}

Mode format bias:
- Preferred posting slot: ${profile.preferredSlot}
- For this draft, the requested slot is ${slot} (${slotTimes[slot]}), so stay compatible with that slot's energy.
- Preferred kind(s): ${profile.preferredKinds.join(", ")}
- If carousel, preferred slide count: ${slideCounts}
- Preferred template families, in order of current variety pressure: ${suggestedTemplates.join(", ")}

Image rules for this mode:
${profile.imageRules.map((rule) => `- ${rule}`).join("\n")}

Structural rules for this mode:
${modeStructureRules[mode].map((rule) => `- ${rule}`).join("\n")}

Caption rules for this mode:
${profile.captionRules.map((rule) => `- ${rule}`).join("\n")}

Banned moves for this mode:
${profile.bannedMoves.map((rule) => `- ${rule}`).join("\n")}

Micro-example for tone calibration:
- Image direction:
${profile.exampleImage}
- Caption hook direction: ${profile.exampleCaptionHook}
`.trim();
};

const manualSeedBlock = ({
  manualIdea,
  seedIdea
}: {
  manualIdea?: ManualIdea;
  seedIdea?: string;
}) => {
  const seed = manualIdea?.idea ?? seedIdea;

  if (!seed) {
    return "No human seed idea is available. Start from a precise observed friction, decision, scene, or mismatch.";
  }

  return `Use this seed idea as raw material. If the seed already contains a strong human line, preserve its core and sharpen it rather than abstracting it into generic advice:\n${seed}`;
};

export const buildPostPrompt = ({
  slot,
  recentPublished,
  queue,
  manualIdea,
  revisionNotes,
  forcedContentMode,
  seedIdea
}: {
  slot: SlotName;
  recentPublished: PublishedLogFile;
  queue: QueueFile;
  manualIdea?: ManualIdea;
  revisionNotes?: string[];
  forcedContentMode?: ContentMode;
  seedIdea?: string;
}) => {
  const targetMode = forcedContentMode ?? deriveTargetMode(slot, queue);
  const profile = contentModeProfiles[targetMode];
  const modeCounts = new Map<string, number>();
  const templateCounts = new Map<string, number>();

  for (const item of queue.items) {
    if (item.status === "published") {
      continue;
    }

    modeCounts.set(item.contentMode, (modeCounts.get(item.contentMode) ?? 0) + 1);
    templateCounts.set(
      item.templateFamily,
      (templateCounts.get(item.templateFamily) ?? 0) + 1
    );
  }

  const underusedModes = rankUnderused(
    contentModes,
    modeCounts,
    slotModePriorities[slot]
  )
    .slice(0, 4)
    .join(", ");

  const underusedTemplates = rankUnderused(
    templateRotation,
    templateCounts,
    slotTemplatePriorities[slot]
  )
    .slice(0, 4)
    .join(", ");

  const revisionBlock =
    revisionNotes && revisionNotes.length > 0
      ? `Previous attempt failed review. Fix these issues directly:\n- ${revisionNotes.join("\n- ")}`
      : "No prior revision notes.";

  return `
You are creating one Instagram-ready content package for a premium writing account.

Brand target:
- Audience: ${brand.audience}
- Tone: ${brand.tone}
- Visual direction: ${brand.visualDirection}
- Requested posting slot: ${slot} (${slotTimes[slot]})

Core editorial rules:
${brand.editorialRules.map((rule) => `- ${rule}`).join("\n")}

Voice principles:
${voicePrinciples.map((rule) => `- ${rule}`).join("\n")}

Anti-slop rules:
${antiSlopRules.map((rule) => `- ${rule}`).join("\n")}

Variety pressure for this generation:
- Forced target mode for this draft: ${targetMode}
- This mode should feel materially different from the surrounding feed.
- Underused modes right now: ${underusedModes}
- Underused template families right now: ${underusedTemplates}
- This draft should widen the feed, not blend into it.

Recent published posts to avoid repeating:
${recentTitlesBlock(recentPublished) || "- none yet"}

Current queued ideas to avoid overlapping with:
${queuedTitlesBlock(queue) || "- none yet"}

${manualSeedBlock({ manualIdea, seedIdea })}

${revisionBlock}

Few-shot calibration references:
${fewShotBlock}

${modePromptBlock({ mode: targetMode, slot, queue })}

Writing process instructions:
- Privately generate 4 candidate directions before writing the final post:
  1. the obvious version people have seen before,
  2. the version anchored in a scene or spoken line,
  3. the version with the strongest save-worthy sentence,
  4. the version with the cleanest caption second move.
- Discard the obvious version.
- Choose the direction that feels most human, most precise, and least explain-y.
- Before finalizing, privately cut every sentence that is merely decorative, generic, or self-congratulatory.
- For story or dialogue posts, preserve plausibility and restraint.
- For list or advice posts, each slide must earn its place with new utility.

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
    "callToComment": "optional; only include when a question feels native to the post",
    "hashtags": ["3 to 6 concise hashtags"]
  }
}

Output rules:
- Set "contentMode" to "${targetMode}".
- Exactly one of "single" or "carousel" should be populated. The other must be null.
- If carousel is chosen, provide either 3 or 5 slides only.
- For ${targetMode}, prefer ${profile.preferredKinds.join(" over ")}.
- For ${targetMode}, prefer template families from this set first: ${profile.preferredTemplates.join(", ")}.
${modeOutputConstraints(targetMode, profile).map((rule) => `- ${rule}`).join("\n")}
- English only.
- Do not use emojis.
- Keep every field short enough to fit on the card beautifully.
- Original writing is preferred unless a quote genuinely improves the post.
- If using a quote, attribution must be certain and the quote must stay short.
- Never narrate the tone, strategy, posting slot, audience, or desired engagement inside the post or caption.
- The image must never contain meta labels, fake source labels, or any page label for a single-image post.
- If there is no real source, set "quoteAttribution" to null. Never output the string "null".
- "callToComment" is optional. Omit it or set it to null when the caption is stronger without a question.
- Hashtags must be lowercase and begin with "#".
- You may wrap 1 to 3 exact phrases in [[double brackets]] to request visual highlighting on the card.
- Story and dialogue posts must sound plausible enough that an ordinary person could believe them happened, even if composite.
- Story posts should feel emotionally true without sounding miraculous, preachy, or baitily tragic.
- Caption hook should not simply paraphrase the image headline.
- End with clarity, not mist.
`.trim();
};

const draftMode = (draft: unknown): ContentMode | undefined => {
  if (!draft || typeof draft !== "object") {
    return undefined;
  }

  const candidate = (draft as QueueItem).contentMode;
  return candidate && candidate in contentModeProfiles
    ? (candidate as ContentMode)
    : undefined;
};

export const buildRevisionPrompt = ({
  draft,
  revisionNotes
}: {
  draft: unknown;
  revisionNotes: string[];
}) => {
  const mode = draftMode(draft);
  const profile = mode ? contentModeProfiles[mode] : undefined;

  return `
Revise this Instagram content package.

Goals:
- Make it sound more human, more singular, and less like a generated content artifact.
- Keep the strongest underlying idea, but sharpen sentence music and specificity.
- Shorten wherever the draft is over-explaining itself.
- Make the caption add a second move instead of repeating the card.
- Keep the final output visually renderable.

${profile ? `Mode reminder for ${mode} (${profile.label}):\n- Objective: ${profile.objective}\n- Why it wins: ${profile.whyItWins}\n- Avoid: ${profile.bannedMoves.join(" | ")}` : ""}

Required fixes:
- ${revisionNotes.join("\n- ")}

Candidate JSON to revise:
${JSON.stringify(draft, null, 2)}

Return valid JSON only in the exact same schema as the input package.
`.trim();
};
