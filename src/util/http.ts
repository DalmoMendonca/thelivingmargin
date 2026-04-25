import { sleep } from "./time.js";

export const assertOk = async (response: Response, context: string) => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${context} failed with ${response.status}: ${body}`);
  }

  return response;
};

export const pollUrl = async (url: string, attempts: number, intervalMs: number) => {
  for (let index = 0; index < attempts; index += 1) {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (response.ok) {
      return true;
    }

    await sleep(intervalMs);
  }

  return false;
};
