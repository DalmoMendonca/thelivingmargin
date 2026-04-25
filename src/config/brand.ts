import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import type { SlotName, TemplateFamily } from "../types.js";

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
  "lesson"
];

export const palettes = {
  emberParchment: {
    name: "emberParchment",
    background: "#f2e8d9",
    secondary: "#d7c3a4",
    text: "#1f1812",
    accent: "#9f5536",
    accentSoft: "#d48a62"
  },
  midnightPaper: {
    name: "midnightPaper",
    background: "#141313",
    secondary: "#302d2c",
    text: "#f6efe5",
    accent: "#d9ad62",
    accentSoft: "#90785d"
  },
  sageAsh: {
    name: "sageAsh",
    background: "#e9ece4",
    secondary: "#c8d0c0",
    text: "#172018",
    accent: "#51664e",
    accentSoft: "#8ea087"
  },
  brassInk: {
    name: "brassInk",
    background: "#f6f0e6",
    secondary: "#e2d6c2",
    text: "#221c17",
    accent: "#8a6237",
    accentSoft: "#bc9567"
  }
} as const;

export const brand = {
  name: "Thoughtful Contrarian Feed",
  visualDirection:
    "Warm, editorial, humane, literary, slightly mystical. It should feel made by a sharp human with taste, not a generic AI quote account.",
  audience:
    "Curious lifelong learners first, then high-agency intellectuals, then mystic-aesthetic quote lovers.",
  tone:
    "Mostly contrarian-but-fair, sometimes reflective, occasionally sharp. Never corny, preachy, or guruish.",
  postMix: {
    single: 0.55,
    carousel: 0.45
  },
  queueTarget: 15,
  maxPublishAttempts: 3,
  topics: [
    "ego and status",
    "attention and distraction",
    "ambition and peace",
    "reading and intelligence",
    "loneliness and friendship",
    "desire and self-respect",
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
