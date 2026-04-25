# One-Time Setup

## 1. Pick and create the Instagram account
@thelivingmargin

### Create the account

1. Open Instagram and create a new account with one of the handles above.
2. Use a dedicated email you control.
3. Add a profile photo and short bio after sign-up.
4. Keep the account public.

Starter bio: `Thoughts for people who still think.`

## 2. Convert it to a professional account

1. In Instagram, open `Settings and privacy`.
2. Go to `Account type and tools`.
3. Choose `Switch to professional account`.
4. Pick a category close to `Personal blog`, `Education`, or `Digital creator`.
5. Keep `Creator` unless Instagram forces a different flow you prefer.

## 3. Create and connect a Facebook Page

Meta's publishing flow still expects the Instagram professional account to be connected to a Facebook Page.

1. In Facebook, create a new Page just for this account.
2. In Instagram, open `Edit profile`.
3. Go to `Page`.
4. Connect the new Facebook Page.

## 4. Create the Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a new app.
3. Choose the `Business` app type.
4. Add the Instagram product using `Instagram API with Instagram Login`.

## 5. Generate the Instagram access token

1. In the Meta app dashboard, go to `Instagram` -> `API setup with Instagram login`.
2. In Meta's current UI, click `Add account` in the `Generate access tokens` section. This is the same flow older guides call `Generate token`.
3. Before you continue, confirm all of these are true:
   - The Instagram account is `public`.
   - The Instagram account is a `professional` account.
   - If Meta shows `Unable to add a user with a role on the app's owning business`, do not use `App roles` -> `Add People` for your personal profile. Use `App roles` -> `Edit roles in Business Manager` and assign yourself access there first.
   - In the roles flow, make sure you grant the `Instagram Tester` role, not just the generic app `Tester` role.
4. After adding the Instagram account as `Instagram Tester`, go to the Instagram account itself and accept the invite. Meta will show the account as `Pending` until you do this.
   - On the web, open `https://www.instagram.com/accounts/manage_access/` while logged in as the Instagram account.
   - Or in Instagram settings, go to `Website permissions` -> `Apps and websites` -> `Tester Invites`.
   - Accept the invite for your Meta app.
5. Return to the Meta app dashboard and confirm the `Instagram Tester` entry is no longer `Pending`.
6. Log in with the new Instagram account and approve the prompt.
7. If the popup lands on a blank `instagram.com/accounts/profile_selection` page after the account is already listed in `Generate access tokens`, treat it as a browser or session problem first:
   - Log out of Instagram in all tabs.
   - Use a fresh browser profile or a clean browser window with extensions disabled.
   - Allow popups and cookies for both `developers.facebook.com` and `instagram.com`.
   - Log in to `instagram.com` as the Instagram account in that same clean browser session first, then return to the Meta dashboard and click `Generate token`.
   - If Chrome still fails, retry once in another browser.
   - If the dashboard popup still fails, use the manual OAuth fallback below.
8. Copy the generated token.

### Manual OAuth fallback

If Meta's `Generate token` popup still fails even though the Instagram account is already listed, use the product's OAuth flow directly.

1. In `Instagram` -> `API setup with Instagram login`, expand `3. Set up Instagram business login`.
2. Open `https://webhook.site/` in a new tab. It will generate a unique HTTPS URL for you.
3. Copy the value labeled `Your unique URL`. It will look like:

```text
https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

4. Paste that exact full URL into Meta as the `Redirect URL` and save it.
5. Open `Business login settings` and make sure the exact same URL is listed in `OAuth Redirect URIs`.
6. Copy the generated `Embed URL`. Use that URL directly instead of hand-building the login link.
7. Open the `Embed URL` in a clean browser session where only the Instagram account is signed in.
8. After you approve the login, you will be redirected to your Webhook.site URL with a `code=...` query parameter.
9. Copy the `code` value from the browser address bar. If the URL ends with `#_`, do not include that part in the code. If needed, Webhook.site will also show the redirected request in its request list.
10. Exchange that code for a long-lived token:

Use the `Instagram App ID` and `Instagram App Secret` shown at the top of the same page:

`App Dashboard -> Instagram -> API setup with Instagram login`

They appear above `1. Generate access tokens` as:
- `Instagram app ID`
- `Instagram app secret`

The `Business login settings` modal is only for redirect and callback URLs. It does not show the secret.

Do not use the top-level Meta app `App ID` from the dashboard header or `App settings -> Basic -> App Secret` for this step.

```bash
npm run instagram:exchange-code -- \
  --client-id YOUR_INSTAGRAM_APP_ID \
  --client-secret YOUR_INSTAGRAM_APP_SECRET \
  --redirect-uri YOUR_EXACT_REDIRECT_URI \
  --code YOUR_CODE
```

8. The script prints the final values for:
   - `INSTAGRAM_USER_ID`
   - `INSTAGRAM_ACCESS_TOKEN`

Use those in `.env` locally and in GitHub Actions secrets later.

Meta's current docs say dashboard-generated tokens are long-lived and valid for 60 days, so plan to refresh them before expiry.

## 6. Find the Instagram user ID

Run this once with the token:

```bash
curl "https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=YOUR_TOKEN"
```

```bash
curl "https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=YOUR_TOKEN"
```

Copy `user_id`.

## 7. Create the GitHub repository

For the zero-cost publishing flow, use a `public` repository.

1. Create a new public GitHub repository.
2. Push this project to that repository.
3. Add these repository secrets:
   - `OPENAI_API_KEY`
   - `INSTAGRAM_USER_ID`
   - `INSTAGRAM_ACCESS_TOKEN`
4. Add these optional secrets for email alerts:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `ALERT_FROM`
   - `ALERT_TO`

Optional repository variable:

- `OPENAI_MODEL` = `gpt-5`

## 8. Gmail alerts

If you want failure emails:

1. Turn on 2-factor authentication for the Gmail account.
2. Create an App Password in Google Account security settings.
3. Use:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_SECURE=true`
   - `SMTP_USER=your-gmail-address`
   - `SMTP_PASS=your-app-password`
   - `ALERT_FROM=your-gmail-address`
   - `ALERT_TO=dalmomendonca@gmail.com`

## 9. First local run

```bash
npm install
npm run bootstrap
npm run preview
npm run publish:slot -- --slot morning --dry-run
```

## 10. Enable the scheduler

After the repository is pushed:

1. Open the `Actions` tab and enable workflows.
2. Confirm `.github/workflows/instagram-publish.yml` exists on the default branch.
3. The workflow is already set to run at:
   - `9:00 AM` America/Chicago
   - `1:00 PM` America/Chicago
   - `6:30 PM` America/Chicago
4. You can also trigger it manually with `workflow_dispatch`.

## 11. Manual idea queue

Add ideas to `content-queue/manual-ideas.yaml` using this shape:

```yaml
version: 1
updatedAt: 2026-04-25T00:00:00.000Z
ideas:
  - id: idea-123
    idea: A carousel about how taste protects you from information overload.
    priority: high
    status: pending
    addedAt: 2026-04-25T00:00:00.000Z
```
