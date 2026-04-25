import type { QueueItem } from "../types.js";

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

export const sanitizeQueueItem = (item: QueueItem): QueueItem => ({
  ...item,
  quoteAttribution: normalizeQuoteAttribution(item.quoteAttribution),
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
