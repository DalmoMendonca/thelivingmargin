import dotenv from "dotenv";
import { getFlag } from "./args.js";
import { assertOk } from "../util/http.js";

dotenv.config();

const required = (value: string | undefined, label: string) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

const cleanCode = (value: string | undefined) => {
  if (!value) {
    return value;
  }

  return value.replace(/#_$/, "").split("#", 1)[0];
};

const clientId =
  getFlag("client-id") ??
  process.env.INSTAGRAM_APP_ID ??
  process.env.INSTAGRAM_CLIENT_ID;
const clientSecret =
  getFlag("client-secret") ??
  process.env.INSTAGRAM_APP_SECRET ??
  process.env.INSTAGRAM_CLIENT_SECRET;
const redirectUri = getFlag("redirect-uri") ?? process.env.INSTAGRAM_REDIRECT_URI;
const code = cleanCode(getFlag("code"));

const shortLivedToken = async () => {
  const body = new URLSearchParams({
    client_id: required(clientId, "client id"),
    client_secret: required(clientSecret, "client secret"),
    grant_type: "authorization_code",
    redirect_uri: required(redirectUri, "redirect URI"),
    code: required(code, "authorization code")
  });

  const response = await assertOk(
    await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }),
    "Exchange authorization code for short-lived token"
  );

  return (await response.json()) as {
    access_token: string;
    user_id?: string;
  };
};

const longLivedToken = async (accessToken: string) => {
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", required(clientSecret, "client secret"));
  url.searchParams.set("access_token", accessToken);

  const response = await assertOk(
    await fetch(url),
    "Exchange short-lived token for long-lived token"
  );

  return (await response.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
};

const getProfile = async (accessToken: string) => {
  const url = new URL("https://graph.instagram.com/v25.0/me");
  url.searchParams.set("fields", "user_id,username");
  url.searchParams.set("access_token", accessToken);

  const response = await assertOk(await fetch(url), "Fetch Instagram profile");
  return (await response.json()) as {
    user_id: string;
    username: string;
  };
};

const main = async () => {
  const shortToken = await shortLivedToken();
  const longToken = await longLivedToken(shortToken.access_token);
  const profile = await getProfile(longToken.access_token);

  console.log("Instagram token exchange complete.\n");
  console.log(`Username: ${profile.username}`);
  console.log(`User ID: ${profile.user_id}`);
  console.log(`Expires In: ${longToken.expires_in} seconds\n`);
  console.log("Add these to your .env or GitHub secrets:");
  console.log(`INSTAGRAM_USER_ID=${profile.user_id}`);
  console.log(`INSTAGRAM_ACCESS_TOKEN=${longToken.access_token}`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Invalid platform app")) {
    console.error(
      [
        message,
        "",
        "Meta usually returns `Invalid platform app` when the code exchange uses the wrong app credentials.",
        "Use the `Instagram App ID` and `Instagram App Secret` from:",
        "`App Dashboard -> Instagram -> API setup with Instagram login -> 3. Set up Instagram business login -> Business login settings`",
        "Do not use the top-level Meta `App ID` in the header or `App settings -> Basic -> App Secret` for this step."
      ].join("\n")
    );
  } else {
    console.error(message);
  }

  process.exitCode = 1;
});
