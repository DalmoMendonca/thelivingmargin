import { appEnv } from "../config/brand.js";
import type { QueueItem } from "../types.js";
import { assertOk } from "../util/http.js";
import { logStep } from "../util/log.js";
import { publicUrlsForItem } from "./assets.js";

const graphBase = "https://graph.instagram.com/v25.0";

const authHeaders = () => ({
  Authorization: `Bearer ${appEnv.INSTAGRAM_ACCESS_TOKEN}`,
  "Content-Type": "application/json"
});

const createImageContainer = async ({
  imageUrl,
  caption,
  altText,
  isCarouselItem = false
}: {
  imageUrl: string;
  caption?: string;
  altText?: string;
  isCarouselItem?: boolean;
}) => {
  const body: Record<string, unknown> = {
    image_url: imageUrl
  };

  if (caption) {
    body.caption = caption;
  }

  if (altText && !isCarouselItem) {
    body.alt_text = altText;
  }

  if (isCarouselItem) {
    body.is_carousel_item = true;
  }

  const response = await assertOk(
    await fetch(`${graphBase}/${appEnv.INSTAGRAM_USER_ID}/media`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body)
    }),
    "Create image container"
  );

  const json = (await response.json()) as { id: string };
  return json.id;
};

const publishContainer = async (containerId: string) => {
  const response = await assertOk(
    await fetch(`${graphBase}/${appEnv.INSTAGRAM_USER_ID}/media_publish`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        creation_id: containerId
      })
    }),
    "Publish container"
  );

  const json = (await response.json()) as { id: string };
  return json.id;
};

const buildCaption = (item: QueueItem) => {
  const body = [item.caption.hook, item.caption.body, item.caption.callToComment].join("\n\n");
  const hashLine = item.caption.hashtags.join(" ");
  const quoteLine = item.quoteAttribution
    ? `\n\nSource: ${item.quoteAttribution}`
    : "";
  return `${body}${quoteLine}\n\n${hashLine}`;
};

export const publishToInstagram = async (item: QueueItem) => {
  if (!appEnv.INSTAGRAM_USER_ID || !appEnv.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("Instagram publishing secrets are missing.");
  }

  const assetUrls = publicUrlsForItem(item);
  const caption = buildCaption(item);
  logStep(`Publishing ${item.id} to Instagram.`);

  if (item.kind === "single") {
    const containerId = await createImageContainer({
      imageUrl: assetUrls[0],
      caption,
      altText: item.altText
    });

    return publishContainer(containerId);
  }

  const childIds: string[] = [];
  for (const assetUrl of assetUrls) {
    childIds.push(
      await createImageContainer({
        imageUrl: assetUrl,
        isCarouselItem: true
      })
    );
  }

  const carouselResponse = await assertOk(
    await fetch(`${graphBase}/${appEnv.INSTAGRAM_USER_ID}/media`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption,
        children: childIds.join(",")
      })
    }),
    "Create carousel container"
  );

  const carouselJson = (await carouselResponse.json()) as { id: string };
  return publishContainer(carouselJson.id);
};
