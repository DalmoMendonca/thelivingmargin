import type { ContentMode, QueueItem, SurfaceStyle, TemplateFamily } from "../types.js";

const nullishText = new Set([
  "",
  "null",
  "none",
  "n/a",
  "na",
  "unknown",
  "optional source name or null"
]);

const leadingMetaPatterns = [
  /^(morning|midday|evening)\s+(prompt|reminder|practice)\s*[:,-]?\s*/i,
  /^quick litmus test\s*:\s*/i,
  /^contrarian (premise|take|thought)\s*[:,-]?\s*/i,
  /^reflective (prompt|question)\s*[:,-]?\s*/i
];

export const normalizeOptionalText = (value?: string | null) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return nullishText.has(trimmed.toLowerCase()) ? undefined : trimmed;
};

export const normalizeQuoteAttribution = (value?: string | null) =>
  normalizeOptionalText(value);

export const stripMetaLead = (value: string) =>
  leadingMetaPatterns
    .reduce((current, pattern) => current.replace(pattern, ""), value.trim())
    .replace(/^\s*([a-z])/, (_, first: string) => first.toUpperCase());

export const normalizeHashtag = (value: string) => {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9_]/g, "");

  return cleaned ? `#${cleaned}` : undefined;
};

export const normalizeHashtags = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map(normalizeHashtag)
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 6);

const defaultSurfaceByTemplate: Record<TemplateFamily, SurfaceStyle> = {
  oracle: "paperWarm",
  margin: "paperWarm",
  editorial: "paperWarm",
  signal: "charcoalGrain",
  lesson: "notebookCream",
  highlight: "plasterBlue",
  notebook: "notebookCream",
  broadside: "vellumRose"
};

export const normalizeSurfaceStyle = (
  value?: string | null,
  fallback: SurfaceStyle = "paperWarm"
): SurfaceStyle => {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return fallback;
  }

  if (
    normalized === "paperWarm" ||
    normalized === "plasterBlue" ||
    normalized === "notebookCream" ||
    normalized === "charcoalGrain" ||
    normalized === "vellumRose"
  ) {
    return normalized;
  }

  return fallback;
};

const surfaceFallbackForItem = (item: Partial<QueueItem>) => {
  if (item.palette === "midnightPaper") {
    return "charcoalGrain";
  }

  if (item.palette === "bluePlaster") {
    return "plasterBlue";
  }

  if (item.palette === "roseLedger") {
    return "vellumRose";
  }

  if (item.templateFamily) {
    return defaultSurfaceByTemplate[item.templateFamily];
  }

  return "paperWarm";
};

export const normalizeContentMode = (
  value?: string | null,
  fallback: ContentMode = "aphorism"
): ContentMode => {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return fallback;
  }

  if (
    normalized === "aphorism" ||
    normalized === "advice" ||
    normalized === "story" ||
    normalized === "quote" ||
    normalized === "encouragement" ||
    normalized === "observation" ||
    normalized === "question"
  ) {
    return normalized;
  }

  return fallback;
};

const contentModeFallbackForItem = (item: Partial<QueueItem>): ContentMode => {
  if (item.quoteAttribution) {
    return "quote";
  }

  if (item.templateFamily === "lesson" || item.templateFamily === "notebook") {
    return "advice";
  }

  if (item.templateFamily === "broadside") {
    return "story";
  }

  if (item.voiceMode === "reflective") {
    return "observation";
  }

  return item.kind === "carousel" ? "advice" : "aphorism";
};

export const sanitizeQueueItem = (item: QueueItem): QueueItem => ({
  ...item,
  surfaceStyle: normalizeSurfaceStyle(item.surfaceStyle, surfaceFallbackForItem(item)),
  quoteAttribution: normalizeQuoteAttribution(item.quoteAttribution),
  contentMode: normalizeContentMode(item.contentMode, contentModeFallbackForItem(item)),
  single: item.single
    ? {
        ...item.single,
        supportLine: item.single.supportLine
          ? stripMetaLead(item.single.supportLine)
          : undefined,
        footer: item.single.footer ? stripMetaLead(item.single.footer) : undefined
      }
    : undefined,
  carousel: item.carousel?.map((slide) => ({
    ...slide,
    kicker: slide.kicker ? stripMetaLead(slide.kicker) : undefined,
    footer: slide.footer ? stripMetaLead(slide.footer) : undefined
  })),
  caption: {
    ...item.caption,
    hook: stripMetaLead(item.caption.hook),
    body: stripMetaLead(item.caption.body),
    callToComment: stripMetaLead(item.caption.callToComment),
    hashtags: normalizeHashtags(item.caption.hashtags)
  }
});
