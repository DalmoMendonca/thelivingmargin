import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import type { ContentMode, SlotName, SurfaceStyle, TemplateFamily } from "../types.js";

dotenv.config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5"),
  INSTAGRAM_USER_ID: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  PUBLIC_GITHUB_REPOSITORY: z.string().optional(),
  PUBLIC_GITHUB_BRANCH: z.string().default("main"),
  PUBLIC_ASSET_ROOT: z.string().default("docs/assets/posts"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z
    .string()
    .default("true")
    .transform((value) => value !== "false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ALERT_FROM: z.string().optional(),
  ALERT_TO: z.string().default("dalmomendonca@gmail.com")
});

const env = envSchema.parse(process.env);

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);

export const files = {
  queue: path.join(projectRoot, "content-queue", "queue.yaml"),
  manualIdeas: path.join(projectRoot, "content-queue", "manual-ideas.yaml"),
  publishedLog: path.join(projectRoot, "content-queue", "published-log.yaml"),
  swipeFile: path.join(projectRoot, "content-queue", "swipe-file.yaml"),
  previewManifest: path.join(projectRoot, "docs", "assets", "manifest.json")
};

export const slotTimes: Record<SlotName, string> = {
  morning: "09:00",
  midday: "13:00",
  evening: "18:30"
};

export const slotOrder: SlotName[] = ["morning", "midday", "evening"];

export const templateRotation: TemplateFamily[] = [
  "oracle",
  "margin",
  "editorial",
  "signal",
  "lesson",
  "highlight",
  "notebook",
  "broadside"
];

export const contentModes: ContentMode[] = [
  "aphorism",
  "advice",
  "story",
  "quote",
  "encouragement",
  "observation",
  "question"
];

export const surfaceStyles: SurfaceStyle[] = [
  "paperWarm",
  "plasterBlue",
  "notebookCream",
  "charcoalGrain",
  "vellumRose"
];

export const palettes = {
  emberParchment: {
    name: "emberParchment",
    background: "#f2e8d9",
    secondary: "#d7c3a4",
    text: "#1f1812",
    accent: "#9f5536",
    accentSoft: "#d48a62",
    marker: "#ead2a9",
    markerText: "#241914"
  },
  midnightPaper: {
    name: "midnightPaper",
    background: "#141313",
    secondary: "#302d2c",
    text: "#f6efe5",
    accent: "#d9ad62",
    accentSoft: "#90785d",
    marker: "#685f3c",
    markerText: "#f7f0e4"
  },
  sageAsh: {
    name: "sageAsh",
    background: "#e9ece4",
    secondary: "#c8d0c0",
    text: "#172018",
    accent: "#51664e",
    accentSoft: "#8ea087",
    marker: "#cfe0b6",
    markerText: "#1c261b"
  },
  brassInk: {
    name: "brassInk",
    background: "#f6f0e6",
    secondary: "#e2d6c2",
    text: "#221c17",
    accent: "#8a6237",
    accentSoft: "#bc9567",
    marker: "#eed8b2",
    markerText: "#241b14"
  },
  bluePlaster: {
    name: "bluePlaster",
    background: "#dfe8ea",
    secondary: "#bccdd1",
    text: "#1d1b18",
    accent: "#62784f",
    accentSoft: "#93a985",
    marker: "#d2e1b8",
    markerText: "#1d241a"
  },
  roseLedger: {
    name: "roseLedger",
    background: "#f1e7df",
    secondary: "#d9cac0",
    text: "#231a17",
    accent: "#875c4d",
    accentSoft: "#b88d7f",
    marker: "#ecdcbc",
    markerText: "#261b17"
  }
} as const;

export const brand = {
  name: "The Living Margin",
  visualDirection:
    "Warm, editorial, humane, and literary. Texture matters: plaster walls, notebook paper, soft grain, taped notes, highlighted phrases, and layouts that feel assembled by a tasteful human rather than procedurally generated.",
  audience:
    "Thoughtful people who like shareable writing with real texture: part literary, part relatable, part sharp insight, part emotional recognition.",
  tone:
    "Direct, intimate, observant, sometimes contrarian, sometimes encouraging. Never corny, preachy, therapeutic in a canned way, guruish, or obviously engagement-seeking.",
  editorialRules: [
    "Write like one sharp human making a real claim, not like a content system performing a niche.",
    "Let the image carry the strongest sentence. Let the caption add context, tension, or consequence instead of repeating the graphic.",
    "Prefer one clean insight to a stack of dramatic lines, but allow denser blocks of text when the writing earns it.",
    "Questions should invite recognition or disagreement, not announce that comments are desired.",
    "Original writing is the default. Use quotations sparingly and only with certain attribution.",
    "Stories can be scenes, parables, observed moments, or composite vignettes. Never present invented events as the account owner's personal biography.",
    "Cut self-description. Never narrate the tone, strategy, posting slot, or audience inside the post."
  ],
  forbiddenPhrases: [
    "thoughtful contrarian feed",
    "comment bait, but honest",
    "uncomfortable, but useful",
    "comment if this is too harsh",
    "argue with this in the comments",
    "morning prompt",
    "midday reminder",
    "evening practice"
  ],
  postMix: {
    single: 0.55,
    carousel: 0.45
  },
  queueTarget: 15,
  maxPublishAttempts: 3,
  topics: [
    "grief and repair",
    "intimacy and distance",
    "family patterns",
    "ego and status",
    "attention and distraction",
    "ambition and peace",
    "rest and worthiness",
    "reading and intelligence",
    "loneliness and friendship",
    "desire and self-respect",
    "aging and identity",
    "betrayal and dignity",
    "truth and performance",
    "modern spirituality",
    "discipline and softness",
    "beauty and taste",
    "technology and soul",
    "belief and doubt",
    "language and meaning",
    "mortality and urgency",
    "identity and masks",
    "work and vocation",
    "habits and character",
    "paradox and wisdom"
  ],
  contentArchetypes: [
    "hot-take quote card",
    "highlighted advice wall",
    "dense story card",
    "encouraging reminder",
    "relatable aphorism",
    "clean quote with commentary",
    "paradox statement",
    "reflective question",
    "mini-lesson carousel",
    "quote plus commentary",
    "cultural observation",
    "counterintuitive self-knowledge post"
  ]
};

export const appEnv = env;

const normalizeGithubRepository = (value: string) => {
  const trimmed = value.trim().replace(/\.git$/i, "");
  const githubPrefix = "https://github.com/";

  if (trimmed.startsWith(githubPrefix)) {
    return trimmed.slice(githubPrefix.length);
  }

  return trimmed.replace(/^github\.com\//i, "");
};

export const publicAssetBase = () => {
  if (!env.PUBLIC_GITHUB_REPOSITORY) {
    throw new Error(
      "PUBLIC_GITHUB_REPOSITORY is required. Set it to owner/repo for raw GitHub asset URLs."
    );
  }

  const repository = normalizeGithubRepository(env.PUBLIC_GITHUB_REPOSITORY);
  return `https://raw.githubusercontent.com/${repository}/${env.PUBLIC_GITHUB_BRANCH}/${env.PUBLIC_ASSET_ROOT}`;
};

export const hasOpenAi = () => Boolean(env.OPENAI_API_KEY);
export const hasInstagramPublish = () =>
  Boolean(env.INSTAGRAM_USER_ID && env.INSTAGRAM_ACCESS_TOKEN);
export const hasEmailAlerts = () =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.ALERT_FROM);
