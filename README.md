# Instagram Content Machine

This project generates, renders, and publishes thoughtful Instagram posts three times a day with a zero-cost stack:

- `OpenAI` for topic ideation and caption writing
- `Node + TypeScript` for queueing, rendering, and publishing
- `GitHub Actions` for scheduling
- `raw.githubusercontent.com` for free public media hosting at publish time
- `Instagram Graph API` for posting

## Stack choice

The key constraint is Meta's current publishing requirement: media must be publicly reachable when Instagram pulls it. GitHub gives us both scheduled automation and a free public URL for rendered assets as long as the repository is public.

## Commands

- `npm install`
- `npm run bootstrap`
- `npm run preview`
- `npm run generate:queue`
- `npm run publish:slot -- --slot morning`
- `npm run publish:slot -- --slot midday`
- `npm run publish:slot -- --slot evening`
- `npm run publish:slot -- --slot morning --dry-run`

## Project structure

- `content-queue/manual-ideas.yaml`: your human-supplied post seeds
- `content-queue/queue.yaml`: ready and rendered posts waiting to publish
- `content-queue/published-log.yaml`: dedupe memory for previously published posts
- `docs/assets/posts/`: rendered images
- `docs/index.html`: preview gallery
- `.github/workflows/instagram-publish.yml`: 3x/day automation

## What the engine does

1. Tops up the queue to a target size.
2. Rotates topics and avoids near-duplicate angles.
3. Renders polished quote cards or 5-slide carousels.
4. Pushes assets so they become publicly reachable.
5. Publishes the selected item to Instagram.
6. Retries up to 3 times.
7. Emails a failure alert if SMTP is configured.

## Notes

- The repository needs to be `public` on GitHub Free so the rendered image URLs are publicly accessible.
- The preview page is optional. The publishing flow itself uses raw GitHub asset URLs.
- Tokens and credentials belong in repository secrets, never in files.

Read [SETUP.md](./SETUP.md) for the one-time account steps.
