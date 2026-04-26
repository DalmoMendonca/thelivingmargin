import type { CaptionBundle, ContentMode, QueueItem } from "../types.js";
import { sampleQueueItems } from "./fallback-posts.js";
import { buildContentId, makeFingerprint } from "../util/text.js";
import { nowIso } from "../util/time.js";

const buildCaption = (
  hook: string,
  body: string,
  hashtags: string[],
  callToComment?: string
): CaptionBundle => ({
  hook,
  body,
  callToComment,
  hashtags
});

const buildItem = (
  item: Omit<
    QueueItem,
    | "id"
    | "createdAt"
    | "fingerprint"
    | "publishAttempts"
    | "status"
    | "renderDir"
    | "renderedFiles"
    | "lastError"
    | "instagramMediaId"
    | "publishedAt"
  >
): QueueItem => {
  const createdAt = nowIso();

  return {
    ...item,
    id: buildContentId(createdAt, item.title),
    createdAt,
    fingerprint: makeFingerprint(item.title, item.angle, item.topic),
    publishAttempts: 0,
    status: "ready",
    notes: "Showcase fallback"
  };
};

const curatedShowcaseFallbacks: Partial<Record<ContentMode, QueueItem>> = {
  aphorism: buildItem({
    source: "manual",
    slotPreference: "morning",
    kind: "single",
    templateFamily: "highlight",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    title: "Hope's Favorite Translation",
    topic: "dating and denial",
    angle:
      "People often call one-sided interest bad timing because the cleaner explanation would force them to change direction.",
    contentMode: "aphorism",
    voiceMode: "sharp",
    altText:
      "Blue plaster editorial card about calling someone busy because not interested would hurt more.",
    single: {
      headline:
        "You keep calling them busy\nbecause [[not interested]]\nwould rearrange your hope.",
      body:
        "Temporary language is how a lot of one-sided situations stay emotionally open.",
      supportLine: "Some confusion is borrowed optimism."
    },
    caption: buildCaption(
      "A vague maybe can keep a door open longer than a clean no.",
      "That is why people reread the politeness and ignore the pattern. Uncertainty can feel gentler than truth while it is still collecting time.",
      ["#dating", "#relationships", "#selfrespect", "#discernment"]
    )
  }),
  story: buildItem({
    source: "manual",
    slotPreference: "evening",
    kind: "carousel",
    templateFamily: "notebook",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    title: "Eleven Minutes",
    topic: "care and urgency",
    angle:
      "A small act of institutional mercy can matter for years when it prevents a hard day from becoming a permanent regret.",
    contentMode: "story",
    voiceMode: "reflective",
    altText:
      "Three-slide blue notebook story about a nurse helping a late visitor see his mother after surgery.",
    carousel: [
      {
        kicker: "Hospital",
        headline: "He was ten minutes late for visiting hours.",
        body:
          "Still in paint-stained work clothes, holding a charger and a paper cup. 'My mother had surgery this morning,' he said. 'She doesn't know where I am.'",
        footer: "The window had already closed."
      },
      {
        kicker: "Desk",
        headline: "The night nurse heard him from the desk.",
        body:
          "She looked at the clock, looked at his hands, and said, 'Give me two minutes.' She came back with a badge and walked him upstairs herself.",
        footer: "Some care arrives as a small rule bending."
      },
      {
        kicker: "After",
        headline: "He sat with his mother for eleven minutes.",
        body:
          "Long enough to plug in her phone, fix the blanket at her feet, and let her see his face before the medication pulled her back under. He cried in the elevator because someone refused to let eleven minutes become zero.",
        footer: "Mercy is often a small defiance."
      }
    ],
    caption: buildCaption(
      "A lot of people remember the crisis. They never forget who made room inside it.",
      "Care does not always arrive as rescue. Sometimes it arrives as a person who knows exactly which rule can bend without breaking what matters.",
      ["#story", "#kindness", "#care", "#writing"]
    )
  }),
  quote: buildItem({
    source: "manual",
    slotPreference: "evening",
    kind: "single",
    templateFamily: "editorial",
    palette: "emberParchment",
    surfaceStyle: "paperWarm",
    title: "Tuesday Is the Life",
    topic: "attention and ordinary life",
    angle:
      "A well-known line about days and lives becomes useful again when it is aimed at ordinary repetition instead of abstract admiration.",
    contentMode: "quote",
    voiceMode: "sharp",
    quoteAttribution: "Annie Dillard",
    altText:
      "Warm editorial card featuring a short Annie Dillard quote about days and lives with a pointed subline about Tuesday.",
    single: {
      headline:
        "\"How we spend our days is, of course,\nhow we spend our lives.\"",
      body: "- Annie Dillard",
      supportLine: "People quote this line and still treat Tuesday like a loophole."
    },
    caption: buildCaption(
      "Admiration is easy. Tuesday is the real biography.",
      "Most people agree with this quote in the abstract and then hand the ordinary hours to drift, resentment, and convenience. The life is usually hiding in the repeat, not the vow.",
      ["#quote", "#anniedillard", "#attention", "#habits"]
    )
  }),
  reframe: buildItem({
    source: "manual",
    slotPreference: "midday",
    kind: "single",
    templateFamily: "highlight",
    palette: "roseLedger",
    surfaceStyle: "vellumRose",
    title: "Planner-Shaped Resentment",
    topic: "work and misdiagnosis",
    angle:
      "What gets called procrastination is sometimes resentment toward a role or obligation that was never honestly chosen.",
    contentMode: "reframe",
    voiceMode: "sharp",
    altText:
      "Rose editorial card reframing procrastination as resentment with office clothes on.",
    single: {
      headline:
        "Maybe it isn't procrastination.\nMaybe it's [[resentment]]\nwith office clothes on.",
      body:
        "If the task belongs to a version of you that never fully agreed, delay may be information before it is disobedience.",
      supportLine: "The label matters because the remedy changes."
    },
    caption: buildCaption(
      "You cannot solve the right problem with the wrong diagnosis.",
      "Sometimes the next move is discipline. Sometimes it is admitting you built your week around an obligation your deeper self has been refusing in private for months.",
      ["#work", "#reframe", "#selfknowledge", "#motivation"]
    )
  }),
  dialogue: buildItem({
    source: "manual",
    slotPreference: "evening",
    kind: "carousel",
    templateFamily: "notebook",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    title: "What I'll Try Means",
    topic: "ambiguity and commitment",
    angle:
      "A short exchange can expose the difference between warmth and commitment when one person relies on ambiguity.",
    contentMode: "dialogue",
    voiceMode: "reflective",
    altText:
      "Three-slide notebook carousel about how 'I'll try' can mean very different things in a relationship.",
    carousel: [
      {
        kicker: "Kitchen",
        headline: "\"Are you still coming?\"",
        body:
          "'I said I'd try,' he said.\n\nThat was the sentence she finally heard correctly.",
        footer: "Some ambiguity is policy."
      },
      {
        kicker: "Translation",
        headline: "\"I'll try\" can mean two different things.",
        body:
          "One person hears hope.\nThe other person has already protected their evening.",
        footer: "Warmth and commitment are not synonyms."
      },
      {
        kicker: "After",
        headline: "She stopped arguing with the wording.",
        body:
          "From then on, she listened for dates, not tone. It hurt less than guessing and ended sooner.",
        footer: "Clarity can feel colder than fantasy."
      }
    ],
    caption: buildCaption(
      "A lot of painful relationships are built on sentences nobody translates in time.",
      "Language can divide responsibility very neatly. One person gets to sound kind. The other person carries the labor of interpretation.",
      ["#dialogue", "#relationships", "#communication", "#clarity"]
    )
  }),
  list: buildItem({
    source: "manual",
    slotPreference: "midday",
    kind: "carousel",
    templateFamily: "highlight",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    title: "Improvement as Camouflage",
    topic: "self-improvement and avoidance",
    angle:
      "Self-improvement language can hide from exposure, feedback, and real attempts when it never risks embarrassment.",
    contentMode: "list",
    voiceMode: "sharp",
    altText:
      "Five-slide blue carousel listing signs that self-improvement has become image management instead of growth.",
    carousel: [
      {
        kicker: "List",
        headline: "5 signs your self-improvement plan is protecting you from being seen.",
        body:
          "Growth can be honest. It can also be the prettier cousin of avoidance.",
        footer: "The difference is contact."
      },
      {
        kicker: "Sign 1",
        headline: "You keep preparing for a conversation you could already have.",
        body:
          "Reading more about honesty can feel safer than saying one unpolished true sentence out loud.",
        footer: "Research is not always readiness."
      },
      {
        kicker: "Sign 2",
        headline: "You buy systems where feedback would be cheaper.",
        body:
          "A new routine can look productive while it quietly replaces exposure with equipment.",
        footer: "Tools can become camouflage."
      },
      {
        kicker: "Sign 3",
        headline: "You call it standards when you mean insulation.",
        body:
          "If the plan only counts once it can protect your image, the plan is serving fear first.",
        footer: "Perfection often has a bodyguard."
      },
      {
        kicker: "Turn",
        headline: "If improvement never risks embarrassment, it may be image management.",
        body:
          "Real growth usually includes a visible draft, an awkward ask, or a day you are seen mid-process.",
        footer: "The proof is contact, not vocabulary."
      }
    ],
    caption: buildCaption(
      "Some glow-ups are just better-lit hiding places.",
      "Self-improvement becomes honest again the moment it touches a real attempt, a real witness, or a real consequence. Until then, a lot of it is beautifully organized delay.",
      ["#selfimprovement", "#avoidance", "#growth", "#selfknowledge"]
    )
  })
};

export const buildShowcaseFallback = (mode: ContentMode) => {
  const template =
    curatedShowcaseFallbacks[mode] ??
    sampleQueueItems().find((item) => item.contentMode === mode);

  if (!template) {
    return undefined;
  }

  const {
    id: _id,
    createdAt: _createdAt,
    fingerprint: _fingerprint,
    publishAttempts: _publishAttempts,
    status: _status,
    renderDir: _renderDir,
    renderedFiles: _renderedFiles,
    lastError: _lastError,
    instagramMediaId: _instagramMediaId,
    publishedAt: _publishedAt,
    ...rest
  } = template;

  return buildItem({
    ...rest,
    single: template.single ? { ...template.single } : undefined,
    carousel: template.carousel?.map((slide) => ({ ...slide })),
    caption: {
      ...template.caption,
      hashtags: [...template.caption.hashtags]
    }
  });
};
