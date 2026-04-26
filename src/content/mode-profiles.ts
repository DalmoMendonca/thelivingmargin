import type { ContentMode, PostKind, SlotName, TemplateFamily } from "../types.js";

export interface ContentModeProfile {
  label: string;
  objective: string;
  whyItWins: string;
  preferredSlot: SlotName;
  preferredKinds: PostKind[];
  preferredSlideCounts?: number[];
  preferredTemplates: TemplateFamily[];
  imageRules: string[];
  captionRules: string[];
  bannedMoves: string[];
  exampleImage: string;
  exampleCaptionHook: string;
}

export const contentModeProfiles: Record<ContentMode, ContentModeProfile> = {
  aphorism: {
    label: "Relatable Aphorism",
    objective: "Deliver one sharp sentence that people want to save, send, or borrow in conversation.",
    whyItWins: "Fast recognition, low reading friction, high quotability.",
    preferredSlot: "morning",
    preferredKinds: ["single"],
    preferredTemplates: ["highlight", "editorial", "signal"],
    imageRules: [
      "Lead with one sentence that feels newly true, not merely tidy.",
      "Keep the body to one clarifying move, not a mini-essay.",
      "Let one phrase carry memorable pressure or embarrassment.",
      "Whenever possible, anchor it in a concrete domain like work, dating, friendship, family, money, or habit."
    ],
    captionRules: [
      "Add consequence or context, not paraphrase.",
      "Keep the caption compact enough to feel authored, not generated.",
      "For this mode, the caption body should usually stay at two sentences or fewer.",
      "Do not repeat the card's main nouns if you can pivot to scene, cost, or implication instead."
    ],
    bannedMoves: [
      "Do not sound like a calendar quote.",
      "Do not use vague uplift or decorative paradox.",
      "Do not hide behind floating pronouns like 'it' or 'this' when a concrete object would improve the line."
    ],
    exampleImage:
      "You keep calling them busy\nbecause 'not interested'\nwould rearrange your hope.",
    exampleCaptionHook:
      "Temporary language is how a lot of one-sided dynamics stay emotionally open."
  },
  advice: {
    label: "Practical Advice",
    objective: "Give useful counsel that survives real life, not ideal conditions.",
    whyItWins: "People save what they can use this week.",
    preferredSlot: "midday",
    preferredKinds: ["single", "carousel"],
    preferredSlideCounts: [5],
    preferredTemplates: ["notebook", "highlight", "editorial"],
    imageRules: [
      "Make the advice specific enough to test in one conversation or one day.",
      "Prefer verbs and examples over abstractions.",
      "If using a carousel, each slide must introduce new utility."
    ],
    captionRules: [
      "Give one extra application, edge case, or consequence.",
      "Do not lecture."
    ],
    bannedMoves: [
      "Do not use management-speak or coach language.",
      "Do not present generic platitudes as tactics."
    ],
    exampleImage:
      "If the message matters,\nremove the sentence that asks for permission to matter.",
    exampleCaptionHook:
      "A lot of weak communication is just importance wearing an apology."
  },
  story: {
    label: "Heart-Tug Story",
    objective: "Create an emotionally legible micro-story that feels witnessed, plausible, and deeply saveable.",
    whyItWins: "Stories create completion pressure, comments, shares, and longer dwell time.",
    preferredSlot: "evening",
    preferredKinds: ["carousel"],
    preferredSlideCounts: [3],
    preferredTemplates: ["notebook", "broadside", "highlight"],
    imageRules: [
      "Start inside a concrete moment with stakes already in motion.",
      "Use at least two grounded details: place, object, role, distance, weather, time pressure, or quoted line.",
      "Page 1 hooks with disruption, page 2 turns with help or revelation, page 3 resolves with emotional afterglow.",
      "Keep the tone restrained. Let the events carry the emotion."
    ],
    captionRules: [
      "Do not retell every beat. Explain what made the moment matter.",
      "Name the human principle without calling the story 'heartwarming' or 'inspiring'."
    ],
    bannedMoves: [
      "Do not use melodramatic miracle language.",
      "Do not fake trauma porn or implausibly cinematic details.",
      "Do not moralize every slide."
    ],
    exampleImage:
      "The bus driver waited with the doors open\nwhile she searched the sidewalk\nfor the hearing aid she'd dropped.",
    exampleCaptionHook:
      "Sometimes care looks like a stranger deciding the schedule can survive one human minute."
  },
  quote: {
    label: "Sourced Quote",
    objective: "Use a real short quote and make it feel current through commentary.",
    whyItWins: "Borrowed authority plus fresh framing can travel well.",
    preferredSlot: "evening",
    preferredKinds: ["single", "carousel"],
    preferredTemplates: ["editorial", "signal", "highlight"],
    imageRules: [
      "The quote must be short, clean, and certainly attributed.",
      "If the quote is already famous, the framing angle must feel fresh.",
      "Image copy should emphasize the quote, not your explanation."
    ],
    captionRules: [
      "Explain why this quote still bites now.",
      "Keep commentary sharper than the usual quote-account reverence."
    ],
    bannedMoves: [
      "Do not fabricate attribution.",
      "Do not use long copyrighted excerpts.",
      "Do not sound like a fan page."
    ],
    exampleImage:
      "\"How we spend our days is, of course,\nhow we spend our lives.\"\n-Annie Dillard",
    exampleCaptionHook:
      "A lot of people admire this line and still treat Tuesday like a loophole."
  },
  encouragement: {
    label: "Unsentimental Encouragement",
    objective: "Offer relief without becoming syrupy or vague.",
    whyItWins: "Encouragement performs well when it feels earned instead of mass-produced.",
    preferredSlot: "morning",
    preferredKinds: ["single"],
    preferredTemplates: ["notebook", "highlight", "editorial"],
    imageRules: [
      "Write to the bruised adult, not the generic audience.",
      "Make the comfort specific: what burden softens, what permission arrives, what cost is reduced.",
      "Avoid infantile soothing."
    ],
    captionRules: [
      "Add one clarifying truth that keeps the encouragement from going soft.",
      "Let the question invite self-recognition, not dependency."
    ],
    bannedMoves: [
      "Do not use 'gentle reminder' language.",
      "Do not confuse encouragement with vagueness."
    ],
    exampleImage:
      "You do not need a catastrophe\nbefore you are allowed to go quiet for a day.",
    exampleCaptionHook:
      "A lot of people only trust rest when their body stages a revolt."
  },
  observation: {
    label: "Social Observation",
    objective: "Name a modern pattern people feel but rarely phrase well.",
    whyItWins: "Recognition posts drive shares and comments when they feel exact.",
    preferredSlot: "midday",
    preferredKinds: ["single", "carousel"],
    preferredTemplates: ["broadside", "editorial", "highlight"],
    imageRules: [
      "Anchor the observation in recognizable behavior, not floating theory.",
      "Prefer social texture over abstract psychology.",
      "Make the pattern feel current, not evergreen-sloppy."
    ],
    captionRules: [
      "Push the observation one click deeper than the card.",
      "Do not over-explain the obvious."
    ],
    bannedMoves: [
      "Do not use hollow 'we as a society' phrasing.",
      "Do not make the observation so broad it fits anything."
    ],
    exampleImage:
      "Half the people who say 'we should catch up'\nmean 'I still want the feeling of connection.'",
    exampleCaptionHook:
      "Modern closeness is full of phrases that preserve warmth while avoiding logistics."
  },
  question: {
    label: "Pressure-Bearing Question",
    objective: "Ask a question that reveals something costly if answered honestly.",
    whyItWins: "Questions pull comments when they feel uncomfortably specific.",
    preferredSlot: "morning",
    preferredKinds: ["single"],
    preferredTemplates: ["highlight", "notebook", "editorial"],
    imageRules: [
      "The question should expose a tradeoff, alibi, or misnamed behavior.",
      "Support text can sharpen the blade, not answer it.",
      "Avoid therapeutic vagueness."
    ],
    captionRules: [
      "Name why the question matters without diffusing it.",
      "The comment question can be the same core question if it is already strong enough."
    ],
    bannedMoves: [
      "Do not ask generic self-reflection prompts.",
      "Do not stack multiple questions."
    ],
    exampleImage:
      "What are you calling [[standards]]\nthat is really just fear\nwith a cleaner haircut?",
    exampleCaptionHook:
      "A polished explanation can still be an alibi."
  },
  reframe: {
    label: "Reframe",
    objective: "Take a familiar idea and replace the reader's interpretation with a sharper one.",
    whyItWins: "Reframes are highly saveable because they change language people use on themselves.",
    preferredSlot: "midday",
    preferredKinds: ["single", "carousel"],
    preferredTemplates: ["highlight", "editorial", "notebook"],
    imageRules: [
      "Use the old frame first, then break it cleanly.",
      "The replacement frame should feel more useful, not just more dramatic.",
      "Keep the turn memorable enough to repeat out loud."
    ],
    captionRules: [
      "Explain the practical consequence of adopting the new frame.",
      "Avoid sounding like a TED Talk slide."
    ],
    bannedMoves: [
      "Do not rely on hacky 'it's not X, it's Y' unless the Y is genuinely better.",
      "Do not swap labels without changing meaning."
    ],
    exampleImage:
      "Maybe it isn't procrastination.\nMaybe it's grief\nshowing up as errands.",
    exampleCaptionHook:
      "The label matters because it changes what kind of mercy or discipline actually helps."
  },
  dialogue: {
    label: "Dialogue",
    objective: "Use an exchange of lines to dramatize truth through voice and subtext.",
    whyItWins: "Dialogue feels human fast and creates screenshot-level shareability.",
    preferredSlot: "evening",
    preferredKinds: ["carousel", "single"],
    preferredSlideCounts: [3],
    preferredTemplates: ["notebook", "broadside", "highlight"],
    imageRules: [
      "Let at least one quoted line sound like a person actually said it.",
      "Use dialogue to reveal pressure, mismatch, tenderness, or misunderstanding.",
      "If carousel, each slide should move the exchange forward."
    ],
    captionRules: [
      "Explain what the exchange revealed, not just what was said.",
      "Keep the caption from becoming stage directions."
    ],
    bannedMoves: [
      "Do not write movie-trailer dialogue.",
      "Do not make every line perfectly aphoristic."
    ],
    exampleImage:
      "\"I'm not mad,\" she said.\n\"I know,\" he said. \"That's the problem.\"",
    exampleCaptionHook:
      "Some conversations end the moment one person stops asking to be met."
  },
  list: {
    label: "List / Signs / Rules",
    objective: "Deliver a compact sequence people can scan, send, and compare against their own life.",
    whyItWins: "List posts perform when each item carries fresh utility instead of filler.",
    preferredSlot: "midday",
    preferredKinds: ["carousel"],
    preferredSlideCounts: [5],
    preferredTemplates: ["notebook", "highlight", "editorial"],
    imageRules: [
      "Each item must add something distinct; no padding.",
      "Titles should be concrete: signs, rules, mistakes, ways, phrases, tests.",
      "Page 1 should make the promise irresistible and page 5 should land with synthesis."
    ],
    captionRules: [
      "Use the caption to add one omitted nuance or edge case.",
      "Do not restate every item."
    ],
    bannedMoves: [
      "Do not make a list of vague virtues.",
      "Do not use filler items to reach the slide count."
    ],
    exampleImage:
      "3 signs you're editing your life\nfor image,\nnot relief.",
    exampleCaptionHook:
      "A good list gives people language they can test tonight, not just nod at."
  }
};

export const showcaseSeedIdeas: Record<ContentMode, string> = {
  aphorism:
    "Start from this social truth and keep it sharp: 'You keep calling them busy because \"not interested\" would rearrange your hope.' Build a saveable single-image aphorism from that exact dynamic. Do not turn it into advice.",
  advice:
    "Practical advice about how to ask for something directly at work without padding the sentence with apology language.",
  story:
    "A 3-page emotionally resonant but plausible story about a stranger helping someone get where they need to be in a moment of family urgency. Avoid copying any reference account plot; keep it specific and restrained.",
  quote:
    "Use a real short quote from Annie Dillard about days and lives, then frame it freshly for modern attention and ordinary Tuesdays.",
  encouragement:
    "Encouragement for a tired adult who thinks rest only counts once they are already breaking down.",
  observation:
    "A social observation about how people preserve the feeling of closeness with future-tense language instead of actual plans.",
  question:
    "A hard question about what someone is still carrying just because they said yes to it once.",
  reframe:
    "A reframe that turns what looks like procrastination into something more precise and more useful to work with.",
  dialogue:
    "A short, human-sounding dialogue that reveals a painful mismatch in a relationship without melodrama.",
  list:
    "A 5-slide list about signs that someone is using self-improvement to avoid exposure, feedback, or real attempts."
};
