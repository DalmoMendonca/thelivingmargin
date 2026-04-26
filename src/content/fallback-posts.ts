import type { CaptionBundle, QueueItem } from "../types.js";
import { buildContentId, makeFingerprint } from "../util/text.js";
import { nowIso } from "../util/time.js";

const hashtags = (...values: string[]) => values;

const buildCaption = (
  hook: string,
  body: string,
  callToComment: string,
  tagValues: string[]
): CaptionBundle => ({
  hook,
  body,
  callToComment,
  hashtags: tagValues
});

const baseItem = (
  title: string,
  angle: string,
  topic: string
): Pick<
  QueueItem,
  | "id"
  | "createdAt"
  | "source"
  | "title"
  | "topic"
  | "angle"
  | "fingerprint"
  | "publishAttempts"
  | "status"
> => {
  const createdAt = nowIso();

  return {
    id: buildContentId(createdAt, title),
    createdAt,
    source: "manual",
    title,
    topic,
    angle,
    fingerprint: makeFingerprint(title, angle, topic),
    publishAttempts: 0,
    status: "ready"
  };
};

export const sampleQueueItems = (): QueueItem[] => [
  {
    ...baseItem(
      "Old Yeses",
      "A commitment can remain active long after the self who made it is gone.",
      "obligation and identity"
    ),
    slotPreference: "morning",
    kind: "single",
    templateFamily: "highlight",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    contentMode: "question",
    voiceMode: "reflective",
    altText:
      "Editorial wall card asking what obligations people still carry just because they once said yes.",
    single: {
      headline: "What are you still carrying just because you [[said yes once]]?",
      body:
        "A promise can outlive its reason.\n\nSometimes discipline is finishing.\nSometimes it's admitting the job has changed.",
      supportLine: "Old yeses can become expensive furniture.",
      footer: "Which obligation needs to be re-chosen?"
    },
    caption: buildCaption(
      "Not every unfinished thing deserves your loyalty.",
      "Some obligations began as honesty and stayed as inertia. The useful question is not whether you can endure them. It's whether they still belong in the life you're actually building.",
      "What's one commitment you need to re-choose instead of just carrying?",
      hashtags("#selfknowledge", "#decisionmaking", "#boundaries", "#writing", "#growth")
    )
  },
  {
    ...baseItem(
      "Clean Apology",
      "A real apology is usually shorter than the defense that tries to keep innocence intact.",
      "conflict and accountability"
    ),
    slotPreference: "morning",
    kind: "single",
    templateFamily: "editorial",
    palette: "emberParchment",
    surfaceStyle: "paperWarm",
    contentMode: "aphorism",
    voiceMode: "sharp",
    altText:
      "Warm paper quote card about how a clean apology is usually shorter than the defense.",
    single: {
      headline: "A clean apology is shorter than the defense.",
      body:
        "If it takes three minutes to explain why you hurt them, you are probably trying to keep your innocence, not repair the damage.",
      supportLine: "Repair starts when the self-portrait stops speaking.",
      footer: "Some honesty only fits in one sentence."
    },
    caption: buildCaption(
      "A lot of conflict survives because people want absolution more than repair.",
      "Explanation has its place. It just usually comes after the apology, not in its place. The first honest sentence is often the smallest one in the room.",
      "What makes an apology feel complete to you?",
      hashtags("#relationships", "#accountability", "#communication", "#innerwork")
    )
  },
  {
    ...baseItem(
      "Before the Crash",
      "Rest is allowed before exhaustion turns you into a worse version of yourself.",
      "rest and worthiness"
    ),
    slotPreference: "morning",
    kind: "single",
    templateFamily: "notebook",
    palette: "roseLedger",
    surfaceStyle: "notebookCream",
    contentMode: "encouragement",
    voiceMode: "reflective",
    altText:
      "Notebook-style card reminding people they can rest before they collapse.",
    single: {
      headline: "You are allowed to rest before you become impossible to live with.",
      body:
        "Exhaustion doesn't make you noble. It makes you less accurate, less kind, and more likely to mistake burnout for truth.",
      supportLine: "You do not need a collapse to justify a chair.",
      footer: "Rest is cheapest before the repair bill."
    },
    caption: buildCaption(
      "Waiting until you're wrecked is not discipline. It's expensive timing.",
      "A lot of people only grant themselves rest once their body has made the decision for them. Earlier mercy is usually smarter than dramatic recovery.",
      "What sign tells you you've waited too long to pause?",
      hashtags("#rest", "#selfrespect", "#burnout", "#habits", "#mentalclarity")
    )
  },
  {
    ...baseItem(
      "Clarity Sounds Rude",
      "In vague rooms, a specific sentence feels impolite because it creates actual owners.",
      "work and communication"
    ),
    slotPreference: "midday",
    kind: "carousel",
    templateFamily: "notebook",
    palette: "roseLedger",
    surfaceStyle: "notebookCream",
    contentMode: "advice",
    voiceMode: "sharp",
    altText:
      "Five-slide notebook carousel on why clarity feels rude in vague group settings.",
    carousel: [
      {
        kicker: "Meetings",
        headline: "Clarity is why half the room goes quiet.",
        body: "Vagueness lets everyone stay agreeable. Specifics create owners.",
        footer: "That is why they feel rude."
      },
      {
        kicker: "Try this",
        headline: "Replace 'we should' with a name, a verb, and a date.",
        body: "\"Can you send the draft by Thursday?\" moves more life than \"let's keep this moving.\"",
        footer: "Mood is not progress."
      },
      {
        kicker: "Notice",
        headline: "A vague room protects reputation.",
        body: "Nobody can fail a task nobody actually owns.",
        footer: "Fog is political."
      },
      {
        kicker: "Cost",
        headline: "The meeting after the meeting is the price.",
        body: "That is where people finally ask what was meant, who is doing it, and whether anyone agreed.",
        footer: "Say it once in the room."
      },
      {
        kicker: "Question",
        headline: "What sentence would make this concrete right now?",
        body: "Ask that before the conversation ends and watch how fast the air changes.",
        footer: "Clarity sounds rude until it saves time."
      }
    ],
    caption: buildCaption(
      "A vague room can confuse politeness with progress.",
      "If nobody leaves with a name, a decision, or a date, the conversation mostly served mood management. Clarity feels sharp because it stops people from borrowing each other's assumptions.",
      "What sentence cuts through fog fastest for you?",
      hashtags("#work", "#communication", "#leadership", "#meetings", "#clarity")
    )
  },
  {
    ...baseItem(
      "Tuesday Advice",
      "Advice that only works when you're rested, resourced, and inspired is decoration.",
      "useful advice"
    ),
    slotPreference: "midday",
    kind: "single",
    templateFamily: "highlight",
    palette: "bluePlaster",
    surfaceStyle: "plasterBlue",
    contentMode: "advice",
    voiceMode: "sharp",
    altText:
      "Blue wall text card saying to test advice in a Tuesday mood instead of an idealized mood.",
    single: {
      headline: "If the advice sounds elegant, test it in a [[Tuesday mood]].",
      body:
        "Good advice survives traffic, inboxes, family group chats, and low blood sugar.\n\nPretty advice mostly survives notebooks.",
      supportLine: "Usefulness is a rough environment.",
      footer: "Which belief only works when you're rested?"
    },
    caption: buildCaption(
      "A lot of beautiful advice has never met a tired person.",
      "The real test is not whether an idea sounds wise in silence. It's whether it still helps when your day is noisy, petty, inconvenient, and fully alive.",
      "What piece of advice got better once life got messier?",
      hashtags("#advice", "#realife", "#selfknowledge", "#habits", "#clarity")
    )
  },
  {
    ...baseItem(
      "Busy Language",
      "People sometimes use the language of busyness to soften a choice they do not want to name.",
      "intimacy and distance"
    ),
    slotPreference: "midday",
    kind: "single",
    templateFamily: "broadside",
    palette: "brassInk",
    surfaceStyle: "vellumRose",
    contentMode: "observation",
    voiceMode: "reflective",
    altText:
      "Broadside-style text card reflecting on how people use busy language to soften distance.",
    single: {
      headline: "At brunch, everyone said they were 'bad at texting.'",
      body:
        "Nobody sounded guilty. Just booked.\n\nWe have learned to describe neglect with the language of inconvenience.\n\nSometimes the problem is not modern life. Sometimes it's that we want intimacy on a schedule that protects us from it.",
      supportLine: "Busy can be true and still be a cover.",
      footer: "Some absences are logistical. Some are chosen."
    },
    caption: buildCaption(
      "The friendliest distance usually arrives with a reasonable explanation.",
      "That is what makes it hard to name. Nobody is cruel enough to indict. The relationship just starts living on intentions instead of contact.",
      "Where do you notice future plans replacing actual presence?",
      hashtags("#friendship", "#relationships", "#attention", "#modernlife")
    )
  },
  {
    ...baseItem(
      "Future Tense Intimacy",
      "Some relationships survive by promising future closeness instead of spending present attention.",
      "friendship and distance"
    ),
    slotPreference: "evening",
    kind: "single",
    templateFamily: "broadside",
    palette: "emberParchment",
    surfaceStyle: "paperWarm",
    contentMode: "story",
    voiceMode: "reflective",
    altText:
      "Warm paper story card about people using future tense to imitate closeness.",
    single: {
      headline: "Some people use [[future tense]] the way others use touch.",
      body:
        "We'll do dinner soon.\nWe should take a trip.\nLet's have a proper catch-up.\n\nPromise can simulate closeness for a long time when nobody asks it to become a date on the calendar.",
      supportLine: "Planned intimacy is still intimacy only when it lands.",
      footer: "Hope is not the same as contact."
    },
    caption: buildCaption(
      "The loneliest conversations are sometimes the warmest ones.",
      "Nobody is absent enough to accuse. Nobody is present enough to lean on. The relationship survives on future language and borrowed feeling.",
      "What phrase now makes you ask whether someone means it or just likes saying it?",
      hashtags("#friendship", "#loneliness", "#relationships", "#writing")
    )
  },
  {
    ...baseItem(
      "Warmth and Presence",
      "Warmth can imitate care even when actual availability never arrives.",
      "attention and care"
    ),
    slotPreference: "evening",
    kind: "single",
    templateFamily: "editorial",
    palette: "sageAsh",
    surfaceStyle: "plasterBlue",
    contentMode: "observation",
    voiceMode: "sharp",
    altText:
      "Editorial text card about the difference between warmth and real presence.",
    single: {
      headline: "Warmth is not always presence.",
      body:
        "Some people know how to sound close without ever becoming available.\n\nYou leave the conversation feeling held for twelve seconds and alone for the week.",
      supportLine: "Tone can imitate care.",
      footer: "Attention has a calendar."
    },
    caption: buildCaption(
      "A gentle voice can still leave you carrying the whole relationship.",
      "This is what makes the dynamic confusing. Nothing feels obviously cold. The problem is not the temperature. It's the absence of weight-bearing contact.",
      "What tells you the difference between warmth and reliability now?",
      hashtags("#care", "#relationships", "#boundaries", "#selfrespect")
    )
  },
  {
    ...baseItem(
      "Private Rehearsal",
      "What you rehearse in private usually becomes your public face under stress.",
      "character and habit"
    ),
    slotPreference: "evening",
    kind: "single",
    templateFamily: "signal",
    palette: "midnightPaper",
    surfaceStyle: "charcoalGrain",
    contentMode: "aphorism",
    voiceMode: "sharp",
    altText:
      "Dark textured quote card about private language turning into public character under stress.",
    single: {
      headline: "What you rehearse in private becomes your face under stress.",
      body:
        "Character is often just your most practiced sentence arriving before your values do.",
      supportLine: "Private language builds public reflex.",
      footer: "Listen to what shows up when you're late, hurt, or cornered."
    },
    caption: buildCaption(
      "People usually meet your habits before they meet your ideals.",
      "That is why the small private rehearsal matters. Not because it is dramatic, but because stress has a way of sending the deepest groove to the surface first.",
      "What line do you hear yourself reaching for when pressure hits?",
      hashtags("#character", "#habits", "#selfawareness", "#mindset")
    )
  }
];
