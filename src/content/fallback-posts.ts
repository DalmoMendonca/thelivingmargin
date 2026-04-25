import type { QueueItem } from "../types.js";
import { makeFingerprint, slugify } from "../util/text.js";
import { nowIso } from "../util/time.js";

const baseCaption = (body: string): QueueItem["caption"] => ({
  hook: body,
  body:
    "The internet rewards certainty, but the mind grows through friction. Keep the part that stings. Drop the part that performs.",
  callToComment: "What part of this feels true to you, and where do you disagree?",
  hashtags: [
    "#thoughtprovoking",
    "#selfinquiry",
    "#modernwisdom",
    "#mindset",
    "#deepthoughts"
  ]
});

export const sampleQueueItems = (): QueueItem[] => {
  const createdAt = nowIso();

  return [
    {
      id: `sample-${slugify("A lot of people call confusion")}`,
      createdAt,
      source: "ai",
      slotPreference: "morning",
      kind: "single",
      templateFamily: "oracle",
      palette: "emberParchment",
      title: "Confusion Is Often The Start",
      topic: "belief and doubt",
      angle: "Confusion is not failure. It is often the tax you pay for thinking for yourself.",
      fingerprint: makeFingerprint("confusion", "thinking for yourself", "belief", "doubt"),
      voiceMode: "contrarian",
      altText:
        "Editorial quote card on warm parchment tones reading: A lot of people call it confusion when their borrowed certainty starts to crack.",
      single: {
        headline: "A lot of people call it confusion",
        body: "when their borrowed certainty starts to crack.",
        supportLine: "Thinking for yourself is rarely clean at the beginning.",
        footer: "Remember this the next time doubt feels like failure."
      },
      caption: baseCaption(
        "A lot of people call it confusion when their borrowed certainty starts to crack."
      ),
      publishAttempts: 0,
      status: "ready"
    },
    {
      id: `sample-${slugify("The smartest people are not")}`,
      createdAt,
      source: "ai",
      slotPreference: "midday",
      kind: "carousel",
      templateFamily: "lesson",
      palette: "sageAsh",
      title: "Intelligence Without Taste",
      topic: "reading and intelligence",
      angle: "Being informed is not the same as being thoughtful.",
      fingerprint: makeFingerprint("intelligence", "taste", "thoughtful", "informed"),
      voiceMode: "sharp",
      altText:
        "Five-slide educational carousel about the difference between information, intelligence, taste, discernment, and wisdom.",
      carousel: [
        {
          kicker: "Slide 1",
          headline: "Being informed is cheap now.",
          body: "Discernment is not.",
          footer: "Access is not depth."
        },
        {
          kicker: "Slide 2",
          headline: "Intelligence can win arguments.",
          body: "Taste decides which arguments are worth having.",
          footer: "Not every sharp point deserves your life."
        },
        {
          kicker: "Slide 3",
          headline: "A clever mind can justify anything.",
          body: "A serious mind learns what should not be justified.",
          footer: "That is the beginning of character."
        },
        {
          kicker: "Slide 4",
          headline: "Reading more helps.",
          body: "But reading better changes you faster than reading constantly.",
          footer: "Curate harder."
        },
        {
          kicker: "Slide 5",
          headline: "What actually matters?",
          body: "Not how many ideas you can repeat. Which ones reshaped your life?",
          footer: "One book changed your standards. Which one?"
        }
      ],
      caption: {
        hook: "Being informed is cheap now. Discernment is not.",
        body:
          "There is a difference between collecting ideas and becoming harder to fool. The feed is built for the first one.",
        callToComment: "What raised your standards more: one serious book, or a thousand short posts?",
        hashtags: [
          "#lifelonglearning",
          "#discernment",
          "#wisdom",
          "#criticalthinking",
          "#bookish"
        ]
      },
      publishAttempts: 0,
      status: "ready"
    },
    {
      id: `sample-${slugify("Peace is not always proof")}`,
      createdAt,
      source: "ai",
      slotPreference: "evening",
      kind: "single",
      templateFamily: "editorial",
      palette: "midnightPaper",
      title: "Peace And Avoidance",
      topic: "discipline and softness",
      angle: "Peace can be maturity, but it can also be a sophisticated form of avoidance.",
      fingerprint: makeFingerprint("peace", "avoidance", "maturity", "discipline"),
      voiceMode: "reflective",
      altText:
        "Dark editorial quote card reading: Peace is not always proof that you healed. Sometimes it is proof that you stopped asking the dangerous question.",
      single: {
        headline: "Peace is not always proof that you healed.",
        body: "Sometimes it is proof that you stopped asking the dangerous question.",
        supportLine: "Silence can be medicine. It can also be surrender.",
        footer: "The difference is honesty."
      },
      caption: {
        hook:
          "Peace is not always proof that you healed. Sometimes it is proof that you stopped asking the dangerous question.",
        body:
          "Some calm is hard-earned. Some calm is just a prettier form of self-betrayal. Learning the difference takes time and brutal self-respect.",
        callToComment: "Have you ever mistaken numbness for peace?",
        hashtags: [
          "#selfknowledge",
          "#healing",
          "#innerwork",
          "#awareness",
          "#truth"
        ]
      },
      publishAttempts: 0,
      status: "ready"
    }
  ];
};
