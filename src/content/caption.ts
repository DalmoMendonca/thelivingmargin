import type { CaptionBundle, ContentMode } from "../types.js";
import { getCaptionPolicy } from "./mode-playbooks.js";

const genericPromptPattern =
  /\b(what do you think|thoughts\?|let me know|comment below|drop a comment|save this)\b/i;

const normalizeCaptionText = (value?: string) =>
  (value ?? "")
    .replace(/\[\[(.+?)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const sentenceUnits = (value?: string) =>
  normalizeCaptionText(value).match(/[^.!?]+(?:[.!?]+|$)/g)?.map((part) => part.trim()) ?? [];

export const countCaptionWords = (value?: string) =>
  normalizeCaptionText(value)
    .split(/\s+/)
    .filter(Boolean).length;

export const countCaptionSentences = (value?: string) => sentenceUnits(value).length;

const trimSentenceToWords = (value: string, maxWords: number) => {
  const words = normalizeCaptionText(value).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return normalizeCaptionText(value);
  }

  const trimmed = words.slice(0, maxWords).join(" ").replace(/[,:;\-]+$/, "").trim();
  return trimmed.length > 0 ? trimmed : words.slice(0, maxWords).join(" ").trim();
};

const restoreSentenceEnding = (value: string, source?: string) => {
  if (!value) {
    return value;
  }

  if (/[.!?]$/.test(value)) {
    return value;
  }

  if (source?.trim().endsWith("?")) {
    return `${value}?`;
  }

  if (source?.trim().endsWith("!")) {
    return `${value}!`;
  }

  return `${value}.`;
};

const compressHook = (value: string, maxWords: number) => {
  const firstSentence = sentenceUnits(value)[0] ?? normalizeCaptionText(value);
  const trimmed = trimSentenceToWords(firstSentence, maxWords);
  return restoreSentenceEnding(trimmed, firstSentence);
};

const compressBody = (
  value: string,
  {
    maxWords,
    maxSentences
  }: {
    maxWords: number;
    maxSentences: number;
  }
) => {
  const sentences = sentenceUnits(value).slice(0, maxSentences);
  if (sentences.length === 0) {
    return "";
  }

  let draft = sentences.join(" ");
  if (countCaptionWords(draft) <= maxWords) {
    return draft;
  }

  while (sentences.length > 1 && countCaptionWords(sentences.join(" ")) > maxWords) {
    sentences.pop();
  }

  draft = sentences.join(" ");
  if (countCaptionWords(draft) <= maxWords) {
    return draft;
  }

  return restoreSentenceEnding(trimSentenceToWords(draft, maxWords), draft);
};

export const compressCaptionBundle = (
  mode: ContentMode,
  caption: CaptionBundle
): CaptionBundle => {
  const policy = getCaptionPolicy(mode);
  const hook = compressHook(caption.hook, policy.hookMaxWords);
  const body = compressBody(caption.body, {
    maxWords: policy.bodyMaxWords,
    maxSentences: policy.bodyMaxSentences
  });

  let callToComment = normalizeCaptionText(caption.callToComment);
  if (!policy.allowCallToComment || genericPromptPattern.test(callToComment)) {
    callToComment = "";
  } else if (callToComment) {
    callToComment = restoreSentenceEnding(
      trimSentenceToWords(callToComment, policy.callToCommentMaxWords),
      callToComment
    );
  }

  return {
    hook,
    body,
    callToComment: callToComment || undefined,
    hashtags: caption.hashtags.slice(0, policy.maxHashtags)
  };
};

