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
  /^reflective (prompt|question)\s*[:,-]?\s*/i,
  /^source\s*:\s*(null|none|n\/a|na|unknown)\s*/i
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

export const normalizeTypography = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/\u00ad/g, "")
    .replace(/\u2026/g, "...")
    .replace(/\uFFFD/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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
    normalized === "question" ||
    normalized === "reframe" ||
    normalized === "dialogue" ||
    normalized === "list"
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
  title: normalizeTypography(item.title),
  topic: normalizeTypography(item.topic),
  angle: normalizeTypography(item.angle),
  surfaceStyle: normalizeSurfaceStyle(item.surfaceStyle, surfaceFallbackForItem(item)),
  quoteAttribution: normalizeQuoteAttribution(item.quoteAttribution),
  contentMode: normalizeContentMode(item.contentMode, contentModeFallbackForItem(item)),
  altText: normalizeTypography(item.altText),
  single: item.single
    ? {
        headline: normalizeTypography(item.single.headline),
        body: normalizeTypography(item.single.body),
        supportLine: item.single.supportLine
          ? normalizeTypography(stripMetaLead(item.single.supportLine))
          : undefined,
        footer: item.single.footer
          ? normalizeTypography(stripMetaLead(item.single.footer))
          : undefined
      }
    : undefined,
  carousel: item.carousel?.map((slide) => ({
    kicker: slide.kicker
      ? normalizeTypography(stripMetaLead(slide.kicker))
      : undefined,
    headline: normalizeTypography(slide.headline),
    body: normalizeTypography(slide.body),
    footer: slide.footer
      ? normalizeTypography(stripMetaLead(slide.footer))
      : undefined
  })),
  caption: {
    hook: normalizeTypography(stripMetaLead(item.caption.hook)),
    body: normalizeTypography(stripMetaLead(item.caption.body)),
    callToComment: item.caption.callToComment
      ? normalizeTypography(stripMetaLead(item.caption.callToComment))
      : undefined,
    hashtags: normalizeHashtags(item.caption.hashtags)
  }
});
