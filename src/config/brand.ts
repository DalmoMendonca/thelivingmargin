import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import type { ContentMode, SlotName, SurfaceStyle, TemplateFamily } from "../types.js";

dotenv.config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4"),
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
  "highlight",
  "editorial",
  "notebook",
  "broadside",
  "signal",
  "oracle"
];

export const contentModes: ContentMode[] = [
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
    "Editorial, tactile, and human-made. Use real photographed surfaces when possible: white wall, worn paper, notebook stock, dark grain. Keep layouts simple enough that the texture breathes and the copy stays legible.",
  audience:
    "Thoughtful adults who want emotionally precise, quotable writing that feels observed rather than generated.",
  tone:
    "Natural, intelligent, emotionally legible, and occasionally sharp. Never canned, guruish, therapy-template, pseudo-poetic for its own sake, or obviously engineered for engagement.",
  editorialRules: [
    "Start from a real friction, embarrassment, decision, or observed scene. Not a content theme.",
    "Let the image deliver the line worth saving. Let the caption deepen it with consequence, detail, or a second move.",
    "Prefer clarity over ornament. One clean turn is stronger than stacked intensity.",
    "Questions should expose a tradeoff, not ask for generic participation.",
    "Original writing is the default. Use quotations rarely and only with certain attribution.",
    "Stories can be composite or observed, but they must never masquerade as the account owner's literal autobiography unless explicitly seeded that way.",
    "Do not narrate tone, strategy, niche, posting slot, or audience inside the post.",
    "If a sentence sounds like it could belong to any self-help account, cut it."
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
    single: 0.6,
    carousel: 0.4
  },
  queueTarget: 30,
  queueTopUpPerRun: 2,
  maxPublishAttempts: 3,
  instagramContainerPollAttempts: 20,
  instagramContainerPollIntervalMs: 3000,
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
    "saveable aphorism",
    "hard question card",
    "observed scene",
    "story with a turn",
    "encouraging but unsentimental reminder",
    "five-slide mini-essay",
    "clean sourced quote plus commentary",
    "practical advice with one vivid phrase",
    "counterintuitive self-knowledge post",
    "relatable recognition post",
    "dialogue-driven slide",
    "reframe post",
    "short list carousel"
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
