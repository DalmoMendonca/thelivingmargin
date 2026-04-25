export type SlotName = "morning" | "midday" | "evening";
export type PostKind = "single" | "carousel";
export type ContentMode =
  | "aphorism"
  | "advice"
  | "story"
  | "quote"
  | "encouragement"
  | "observation"
  | "question";
export type SurfaceStyle =
  | "paperWarm"
  | "plasterBlue"
  | "notebookCream"
  | "charcoalGrain"
  | "vellumRose";
export type TemplateFamily =
  | "oracle"
  | "margin"
  | "editorial"
  | "signal"
  | "lesson"
  | "highlight"
  | "notebook"
  | "broadside";
export type QueueStatus = "ready" | "rendered" | "published" | "blocked";

export interface ManualIdea {
  id: string;
  idea: string;
  priority?: "normal" | "high";
  status: "pending" | "consumed";
  addedAt: string;
}

export interface CarouselSlide {
  kicker?: string;
  headline: string;
  body: string;
  footer?: string;
}

export interface SinglePostContent {
  headline: string;
  body: string;
  supportLine?: string;
  footer?: string;
}

export interface CaptionBundle {
  hook: string;
  body: string;
  callToComment: string;
  hashtags: string[];
}

export interface QueueItem {
  id: string;
  createdAt: string;
  source: "ai" | "manual";
  slotPreference: SlotName;
  kind: PostKind;
  templateFamily: TemplateFamily;
  palette: string;
  surfaceStyle: SurfaceStyle;
  title: string;
  topic: string;
  angle: string;
  fingerprint: string;
  contentMode: ContentMode;
  voiceMode: "contrarian" | "reflective" | "sharp";
  quoteAttribution?: string;
  altText: string;
  single?: SinglePostContent;
  carousel?: CarouselSlide[];
  caption: CaptionBundle;
  renderDir?: string;
  renderedFiles?: string[];
  publishAttempts: number;
  status: QueueStatus;
  notes?: string;
  lastError?: string;
  instagramMediaId?: string;
  publishedAt?: string;
}

export interface QueueFile {
  version: number;
  updatedAt: string;
  items: QueueItem[];
}

export interface PublishedLogEntry {
  id: string;
  publishedAt: string;
  topic: string;
  angle: string;
  fingerprint: string;
  kind: PostKind;
  slot: SlotName;
  instagramMediaId?: string;
  title: string;
}

export interface PublishedLogFile {
  version: number;
  updatedAt: string;
  entries: PublishedLogEntry[];
}

export interface IdeaQueueFile {
  version: number;
  updatedAt: string;
  ideas: ManualIdea[];
}

export interface PreviewManifestEntry {
  id: string;
  title: string;
  kind: PostKind;
  topic: string;
  angle: string;
  createdAt: string;
  renderedFiles: string[];
}

export interface PreviewManifest {
  updatedAt: string;
  items: PreviewManifestEntry[];
}
