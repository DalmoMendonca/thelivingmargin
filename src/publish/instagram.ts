import { appEnv, brand } from "../config/brand.js";
import type { QueueItem } from "../types.js";
import { normalizeQuoteAttribution } from "../util/post.js";
import { assertOk } from "../util/http.js";
import { logStep } from "../util/log.js";
import { sleep } from "../util/time.js";
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

const readyStatuses = new Set(["FINISHED", "READY", "PUBLISHED"]);
const failedStatuses = new Set(["ERROR", "EXPIRED"]);

const waitForContainerReady = async (containerId: string, label: string) => {
  for (
    let attempt = 1;
    attempt <= brand.instagramContainerPollAttempts;
    attempt += 1
  ) {
    const response = await assertOk(
      await fetch(`${graphBase}/${containerId}?fields=status_code,status`, {
        method: "GET",
        headers: authHeaders()
      }),
      "Fetch container status"
    );

    const json = (await response.json()) as {
      status_code?: string;
      status?: string;
    };
    const status = (json.status_code ?? json.status ?? "UNKNOWN").toUpperCase();
    logStep(
      `Instagram container ${label} (${containerId}) status ${attempt}/${brand.instagramContainerPollAttempts}: ${status}`
    );

    if (readyStatuses.has(status)) {
      return;
    }

    if (failedStatuses.has(status)) {
      throw new Error(
        `Instagram container ${label} (${containerId}) entered terminal status ${status}.`
      );
    }

    await sleep(brand.instagramContainerPollIntervalMs);
  }

  throw new Error(
    `Instagram container ${label} (${containerId}) was not ready after ${brand.instagramContainerPollAttempts} checks.`
  );
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
  const body = [item.caption.hook, item.caption.body, item.caption.callToComment]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
  const hashLine = item.caption.hashtags.join(" ");
  const source = normalizeQuoteAttribution(item.quoteAttribution);

  return [body, source ? `Source: ${source}` : undefined, hashLine]
    .filter(Boolean)
    .join("\n\n");
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

    await waitForContainerReady(containerId, item.id);
    return publishContainer(containerId);
  }

  const childIds: string[] = [];
  for (let index = 0; index < assetUrls.length; index += 1) {
    const childId = await createImageContainer({
      imageUrl: assetUrls[index],
      isCarouselItem: true
    });
    await waitForContainerReady(childId, `${item.id} child ${index + 1}`);
    childIds.push(childId);
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
  await waitForContainerReady(carouselJson.id, `${item.id} carousel`);
  return publishContainer(carouselJson.id);
};
