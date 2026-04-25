# One-Time Setup

## 1. Pick and create the Instagram account

Top handle candidates I checked against Instagram's public profile URLs on April 25, 2026. These did not resolve to existing public profile pages at the time of checking, so they are the strongest current candidates:

1. `thelivingmargin`
2. `schoolofmaybe`
3. `softcontrarian`
4. `thirdmeaning`
5. `sacredcontrarian`

Important: Instagram can still reject a handle during sign-up for reasons that are not visible from public profile checks, so treat these as best-effort verified candidates rather than a contractual guarantee.

### Create the account

1. Open Instagram and create a new account with one of the handles above.
2. Use a dedicated email you control.
3. Add a profile photo and short bio after sign-up.
4. Keep the account public.

Suggested starter bio:

`Thoughts for people who still think.`
`Literary, spiritual, contrarian, humane.`

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

1. In the Meta app dashboard, go to `Instagram` -> `API setup with Instagram business login`.
2. Click `Generate token`.
3. Log in with the new Instagram account.
4. Copy the generated token.

Meta's current docs say dashboard-generated tokens are long-lived and valid for 60 days, so plan to refresh them before expiry.

## 6. Find the Instagram user ID

Run this once with the token:

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
