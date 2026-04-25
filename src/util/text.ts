const stopwords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "with",
  "that",
  "this",
  "is",
  "are",
  "be",
  "on",
  "it",
  "you",
  "your",
  "we",
  "our"
]);

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

export const normalizeForFingerprint = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const makeFingerprint = (...parts: string[]) => {
  const tokens = normalizeForFingerprint(parts.join(" "))
    .split(" ")
    .filter((token) => token && !stopwords.has(token));
  return Array.from(new Set(tokens)).sort().join(" ");
};

export const jaccardSimilarity = (left: string, right: string) => {
  const leftSet = new Set(left.split(" ").filter(Boolean));
  const rightSet = new Set(right.split(" ").filter(Boolean));
  const intersection = Array.from(leftSet).filter((value) => rightSet.has(value))
    .length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
};

export const trimParagraphs = (value: string) =>
  value
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
