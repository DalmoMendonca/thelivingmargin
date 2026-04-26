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
- `npm run reset:queue`
- `npm run seed:curated`
- `npm run sync:remote-state`
- `npm run ship:code -- --message "refactor: tighten captions"`

## Project structure

- `content-queue/manual-ideas.yaml`: your human-supplied post seeds
- `content-queue/queue.yaml`: ready and rendered posts waiting to publish
- `content-queue/published-log.yaml`: dedupe memory for previously published posts
- `docs/assets/posts/`: rendered images
- `docs/index.html`: preview gallery
- `.github/workflows/instagram-publish.yml`: 3x/day automation

## Local Git workflow

GitHub Actions continuously updates automation-owned state. In practice, `origin/main` will usually have newer queue and publish data than your local checkout.

Automation-owned paths:

- `content-queue/queue.yaml`
- `content-queue/published-log.yaml`
- `docs/assets/manifest.json`
- `docs/assets/posts/`

Recommended flow when you are changing code locally:

1. Make your code changes normally.
2. Run `npm run sync:remote-state` to rebase onto `origin/<current-branch>` while preserving your code/manual-content edits and refreshing automation-owned state from remote.
3. Run `npm run ship:code -- --message "your commit message"` to sync again, typecheck, commit only user-owned changes, and push.

Notes:

- `ship:code` intentionally excludes automation-owned paths from your commit.
- `manual-ideas.yaml` and `swipe-file.yaml` are treated as user-owned content and will still be committed.
- Add `--dry-run` to `ship:code` to preview what would be staged.
- Add `--skip-typecheck` if you need to bypass the typecheck step temporarily.

## What the engine does

1. Tops up the queue to a target size.
2. Uses a multi-pass prompt and reviewer loop to reject generic drafts.
3. Runs copy and layout linting before items enter the queue or publish.
4. Renders polished quote cards or 5-slide carousels on top of real-photo textures.
5. Pushes assets so they become publicly reachable.
6. Publishes the selected item to Instagram.
7. Retries up to 3 times.
8. Emails a failure alert if SMTP is configured.

## Notes

- The repository needs to be `public` on GitHub Free so the rendered image URLs are publicly accessible.
- The preview page is optional. The publishing flow itself uses raw GitHub asset URLs.
- Tokens and credentials belong in repository secrets, never in files.

Read [SETUP.md](./SETUP.md) for the one-time account steps.
