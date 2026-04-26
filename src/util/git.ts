import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import YAML from "yaml";
import { appEnv, files, projectRoot } from "../config/brand.js";
import type {
  IdeaQueueFile,
  ManualIdea,
  PreviewManifest,
  PreviewManifestEntry,
  PublishedLogEntry,
  PublishedLogFile,
  QueueFile,
  QueueItem,
  QueueStatus
} from "../types.js";
import { readJsonFile, readYamlFile, writeJsonFile, writeYamlFile } from "./file.js";
import { sanitizeQueueItem } from "./post.js";
import { nowIso } from "./time.js";

const execFileAsync = promisify(execFile);
const normalizeGitPath = (value: string) => value.replaceAll("\\", "/");
const normalizeInputPath = (cwd: string, value: string) =>
  normalizeGitPath(path.isAbsolute(value) ? path.relative(cwd, value) : value);
const uniquePaths = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean).map(normalizeGitPath))).sort();
const normalizeProvidedPaths = (cwd: string, values: string[]) =>
  uniquePaths(values.filter(Boolean).map((value) => normalizeInputPath(cwd, value)));
const dedupeStrings = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const queueGitPath = normalizeGitPath(path.relative(projectRoot, files.queue));
const publishedGitPath = normalizeGitPath(path.relative(projectRoot, files.publishedLog));
const ideasGitPath = normalizeGitPath(path.relative(projectRoot, files.manualIdeas));
const manifestGitPath = normalizeGitPath(path.relative(projectRoot, files.previewManifest));

export const automationOwnedGitPaths = uniquePaths([
  queueGitPath,
  publishedGitPath,
  ideasGitPath,
  manifestGitPath,
  appEnv.PUBLIC_ASSET_ROOT
]);

export const isAutomationOwnedPath = (value: string) => {
  const normalized = normalizeGitPath(value);

  return automationOwnedGitPaths.some(
    (managedPath) =>
      normalized === managedPath || normalized.startsWith(`${managedPath}/`)
  );
};

const runGit = async (args: string[], cwd: string) => {
  await execFileAsync("git", args, { cwd });
};

const gitOutput = async (args: string[], cwd: string) => {
  const { stdout } = await execFileAsync("git", args, { cwd, encoding: "utf8" });
  return stdout.trim();
};

const gitLines = async (args: string[], cwd: string) => {
  const output = await gitOutput(args, cwd);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const gitBlob = async (cwd: string, ref: string, repoPath: string) => {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["show", `${ref}:${normalizeGitPath(repoPath)}`],
      { cwd, encoding: "utf8" }
    );
    return String(stdout);
  } catch {
    return undefined;
  }
};

const isNonFastForwardPush = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const stderr = "stderr" in error ? String(error.stderr ?? "") : "";
  return /fetch first|failed to push some refs|non-fast-forward/i.test(stderr);
};

const mergeNotes = (left?: string, right?: string) => {
  const values = dedupeStrings([left, right]);
  return values.length > 0 ? values.join(" | ") : undefined;
};

const queueStatusRank: Record<QueueStatus, number> = {
  ready: 1,
  rendered: 2,
  blocked: 3,
  published: 4
};

const queueStateScore = (item: QueueItem) =>
  queueStatusRank[item.status] * 1000 +
  (item.instagramMediaId ? 200 : 0) +
  (item.publishedAt ? 100 : 0) +
  ((item.renderedFiles?.length ?? 0) > 0 ? 50 : 0) +
  item.publishAttempts;

const pickAdvancedQueueItem = (left: QueueItem, right: QueueItem) => {
  const leftScore = queueStateScore(left);
  const rightScore = queueStateScore(right);

  if (leftScore !== rightScore) {
    return leftScore > rightScore ? left : right;
  }

  const leftPublished = left.publishedAt ?? "";
  const rightPublished = right.publishedAt ?? "";
  if (leftPublished !== rightPublished) {
    return leftPublished > rightPublished ? left : right;
  }

  return left.createdAt >= right.createdAt ? left : right;
};

const mergeQueueItem = (remote: QueueItem, local: QueueItem) => {
  const preferred = pickAdvancedQueueItem(remote, local);
  const secondary = preferred === remote ? local : remote;

  return sanitizeQueueItem({
    ...secondary,
    ...preferred,
    publishAttempts: Math.max(remote.publishAttempts, local.publishAttempts),
    status:
      queueStatusRank[remote.status] >= queueStatusRank[local.status]
        ? remote.status
        : local.status,
    renderDir: preferred.renderDir ?? secondary.renderDir,
    renderedFiles: dedupeStrings([
      ...(remote.renderedFiles ?? []),
      ...(local.renderedFiles ?? [])
    ]),
    notes: mergeNotes(remote.notes, local.notes),
    lastError:
      preferred.status === "blocked"
        ? preferred.lastError ?? secondary.lastError
        : secondary.status === "blocked"
          ? secondary.lastError ?? preferred.lastError
          : preferred.lastError ?? secondary.lastError,
    instagramMediaId: preferred.instagramMediaId ?? secondary.instagramMediaId,
    publishedAt: preferred.publishedAt ?? secondary.publishedAt
  });
};

const mergeQueueFiles = (remote: QueueFile, local: QueueFile): QueueFile => {
  const merged = new Map<string, QueueItem>();

  for (const item of remote.items.map(sanitizeQueueItem)) {
    merged.set(item.id, item);
  }

  for (const item of local.items.map(sanitizeQueueItem)) {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? mergeQueueItem(existing, item) : item);
  }

  return {
    version: Math.max(remote.version, local.version),
    updatedAt: nowIso(),
    items: [...merged.values()].sort((left, right) =>
      left.createdAt === right.createdAt
        ? left.id.localeCompare(right.id)
        : left.createdAt.localeCompare(right.createdAt)
    )
  };
};

const ideaStatusRank = {
  pending: 1,
  consumed: 2
} as const;

const mergeIdea = (remote: ManualIdea, local: ManualIdea): ManualIdea => ({
  ...remote,
  ...local,
  priority:
    remote.priority === "high" || local.priority === "high" ? "high" : remote.priority ?? local.priority,
  status:
    ideaStatusRank[remote.status] >= ideaStatusRank[local.status]
      ? remote.status
      : local.status
});

const mergeIdeaFiles = (remote: IdeaQueueFile, local: IdeaQueueFile): IdeaQueueFile => {
  const merged = new Map<string, ManualIdea>();

  for (const idea of remote.ideas) {
    merged.set(idea.id, idea);
  }

  for (const idea of local.ideas) {
    const existing = merged.get(idea.id);
    merged.set(idea.id, existing ? mergeIdea(existing, idea) : idea);
  }

  return {
    version: Math.max(remote.version, local.version),
    updatedAt: nowIso(),
    ideas: [...merged.values()].sort((left, right) =>
      left.addedAt === right.addedAt
        ? left.id.localeCompare(right.id)
        : left.addedAt.localeCompare(right.addedAt)
    )
  };
};

const mergePublishedEntry = (
  remote: PublishedLogEntry,
  local: PublishedLogEntry
): PublishedLogEntry => ({
  ...remote,
  ...local,
  instagramMediaId: local.instagramMediaId ?? remote.instagramMediaId,
  publishedAt:
    local.publishedAt >= remote.publishedAt ? local.publishedAt : remote.publishedAt
});

const mergePublishedFiles = (
  remote: PublishedLogFile,
  local: PublishedLogFile
): PublishedLogFile => {
  const merged = new Map<string, PublishedLogEntry>();

  for (const entry of remote.entries) {
    merged.set(entry.id, entry);
  }

  for (const entry of local.entries) {
    const existing = merged.get(entry.id);
    merged.set(entry.id, existing ? mergePublishedEntry(existing, entry) : entry);
  }

  return {
    version: Math.max(remote.version, local.version),
    updatedAt: nowIso(),
    entries: [...merged.values()].sort((left, right) =>
      left.publishedAt === right.publishedAt
        ? left.id.localeCompare(right.id)
        : left.publishedAt.localeCompare(right.publishedAt)
    )
  };
};

const mergeManifestEntry = (
  remote: PreviewManifestEntry,
  local: PreviewManifestEntry
): PreviewManifestEntry => ({
  ...remote,
  ...local,
  renderedFiles:
    local.renderedFiles.length >= remote.renderedFiles.length
      ? [...local.renderedFiles]
      : [...remote.renderedFiles]
});

const mergePreviewManifests = (
  remote: PreviewManifest,
  local: PreviewManifest
): PreviewManifest => {
  const merged = new Map<string, PreviewManifestEntry>();

  for (const entry of remote.items) {
    merged.set(entry.id, entry);
  }

  for (const entry of local.items) {
    const existing = merged.get(entry.id);
    merged.set(entry.id, existing ? mergeManifestEntry(existing, entry) : entry);
  }

  return {
    updatedAt: nowIso(),
    items: [...merged.values()]
      .sort((left, right) =>
        left.createdAt === right.createdAt
          ? left.id.localeCompare(right.id)
          : left.createdAt.localeCompare(right.createdAt)
      )
      .slice(-40)
  };
};

export const currentBranch = async (cwd: string) => {
  const branch = await gitOutput(["branch", "--show-current"], cwd);
  if (!branch) {
    throw new Error("Cannot push generated content from a detached HEAD checkout.");
  }

  return branch;
};

export const fetchRemoteBranch = async (cwd: string, branch: string) => {
  await runGit(["fetch", "origin", branch], cwd);
};

export const rebaseOntoRemote = async (cwd: string, branch: string) => {
  await fetchRemoteBranch(cwd, branch);

  try {
    await runGit(["rebase", `origin/${branch}`], cwd);
  } catch (error) {
    await runGit(["rebase", "--abort"], cwd).catch(() => undefined);
    throw error;
  }
};

const pushWithRebaseRetry = async (cwd: string, branch: string, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runGit(["push", "origin", `HEAD:${branch}`], cwd);
      return;
    } catch (error) {
      if (!isNonFastForwardPush(error) || attempt === attempts) {
        throw error;
      }

      await rebaseOntoRemote(cwd, branch);
    }
  }
};

export const hasGitChanges = async (cwd: string) => {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
    cwd,
    encoding: "utf8"
  });
  return stdout.trim().length > 0;
};

export const stagedPaths = async (cwd: string) =>
  uniquePaths(
    await gitLines(
      ["diff", "--cached", "--name-only", "--diff-filter=ACDMRTUXB"],
      cwd
    )
  );

const workingTreePaths = async (cwd: string) =>
  uniquePaths([
    ...(await gitLines(["diff", "--name-only", "--diff-filter=ACDMRTUXB"], cwd)),
    ...(await gitLines(
      ["diff", "--cached", "--name-only", "--diff-filter=ACDMRTUXB"],
      cwd
    )),
    ...(await gitLines(["ls-files", "--others", "--exclude-standard"], cwd))
  ]);

export const userOwnedDirtyPaths = async (cwd: string) =>
  (await workingTreePaths(cwd)).filter(
    (targetPath) => !isAutomationOwnedPath(targetPath)
  );

const stashPaths = async (cwd: string, paths: string[], message: string) => {
  if (paths.length === 0) {
    return false;
  }

  await runGit(["stash", "push", "-u", "-m", message, "--", ...paths], cwd);
  return true;
};

const popLatestStash = async (cwd: string) => {
  await runGit(["stash", "pop", "stash@{0}"], cwd);
};

export const discardAutomationOwnedChanges = async (
  cwd: string,
  source = "HEAD"
) => {
  await runGit(
    ["restore", "--source", source, "--staged", "--worktree", "--", ...automationOwnedGitPaths],
    cwd
  );
  await runGit(["clean", "-fd", "--", ...automationOwnedGitPaths], cwd);
};

export const syncLocalBranchWithRemoteState = async (cwd: string) => {
  const branch = await currentBranch(cwd);
  const preservedPaths = await userOwnedDirtyPaths(cwd);

  await discardAutomationOwnedChanges(cwd);

  const createdStash = await stashPaths(
    cwd,
    preservedPaths,
    `[machine] sync-local ${branch}`
  );

  try {
    await rebaseOntoRemote(cwd, branch);
  } catch (error) {
    if (createdStash) {
      await popLatestStash(cwd).catch(() => undefined);
    }

    throw error;
  }

  if (createdStash) {
    await popLatestStash(cwd);
  }

  await discardAutomationOwnedChanges(cwd);

  return {
    branch,
    preservedPaths
  };
};

export const stageNonAutomationChanges = async (cwd: string) => {
  await runGit(["add", "-A"], cwd);

  const automationStaged = (await stagedPaths(cwd)).filter(isAutomationOwnedPath);
  if (automationStaged.length > 0) {
    await runGit(["restore", "--staged", "--", ...automationStaged], cwd);
  }

  return stagedPaths(cwd);
};

export const commitStagedChanges = async (cwd: string, message: string) => {
  if ((await stagedPaths(cwd)).length === 0) {
    return false;
  }

  await runGit(["commit", "-m", message], cwd);
  return true;
};

export const pushCurrentBranch = async (cwd: string, branch?: string) => {
  await pushWithRebaseRetry(cwd, branch ?? (await currentBranch(cwd)));
};

const mergeAutomationStateWithRemote = async (
  cwd: string,
  branch: string,
  repoPaths: string[]
) => {
  await fetchRemoteBranch(cwd, branch);
  await runGit(["reset", "--mixed", `origin/${branch}`], cwd);

  for (const repoPath of repoPaths) {
    const absolutePath = path.join(cwd, repoPath);

    if (repoPath === queueGitPath) {
      const local = await readYamlFile<QueueFile>(absolutePath);
      const remoteRaw = await gitBlob(cwd, `origin/${branch}`, repoPath);
      const remote = remoteRaw
        ? (YAML.parse(remoteRaw) as QueueFile)
        : { version: 1, updatedAt: nowIso(), items: [] };
      await writeYamlFile(absolutePath, mergeQueueFiles(remote, local));
      continue;
    }

    if (repoPath === publishedGitPath) {
      const local = await readYamlFile<PublishedLogFile>(absolutePath);
      const remoteRaw = await gitBlob(cwd, `origin/${branch}`, repoPath);
      const remote = remoteRaw
        ? (YAML.parse(remoteRaw) as PublishedLogFile)
        : { version: 1, updatedAt: nowIso(), entries: [] };
      await writeYamlFile(absolutePath, mergePublishedFiles(remote, local));
      continue;
    }

    if (repoPath === ideasGitPath) {
      const local = await readYamlFile<IdeaQueueFile>(absolutePath);
      const remoteRaw = await gitBlob(cwd, `origin/${branch}`, repoPath);
      const remote = remoteRaw
        ? (YAML.parse(remoteRaw) as IdeaQueueFile)
        : { version: 1, updatedAt: nowIso(), ideas: [] };
      await writeYamlFile(absolutePath, mergeIdeaFiles(remote, local));
      continue;
    }

    if (repoPath === manifestGitPath) {
      const local = await readJsonFile<PreviewManifest>(absolutePath);
      const remoteRaw = await gitBlob(cwd, `origin/${branch}`, repoPath);
      const remote = remoteRaw
        ? (JSON.parse(remoteRaw) as PreviewManifest)
        : { updatedAt: nowIso(), items: [] };
      await writeJsonFile(absolutePath, mergePreviewManifests(remote, local));
    }
  }
};

const commitAutomationStateWithMergeRetry = async (
  cwd: string,
  branch: string,
  message: string,
  repoPaths: string[],
  attempts = 3
) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (!(await hasGitChanges(cwd))) {
      return false;
    }

    await runGit(["commit", "-m", message], cwd);

    try {
      await runGit(["push", "origin", `HEAD:${branch}`], cwd);
      return true;
    } catch (error) {
      if (!isNonFastForwardPush(error) || attempt === attempts) {
        throw error;
      }

      await mergeAutomationStateWithRemote(cwd, branch, repoPaths);
      await runGit(["add", ...repoPaths], cwd);

      if (!(await hasGitChanges(cwd))) {
        return true;
      }
    }
  }

  return true;
};

export const commitAndPushIfChanged = async (
  cwd: string,
  message: string,
  paths?: string[]
) => {
  const repoPaths =
    paths && paths.length > 0 ? normalizeProvidedPaths(cwd, paths) : undefined;

  if (repoPaths && repoPaths.length > 0) {
    await runGit(["add", "--", ...repoPaths], cwd);
  } else {
    await runGit(["add", "-A"], cwd);
  }

  if (!(await hasGitChanges(cwd))) {
    return false;
  }

  const branch = await currentBranch(cwd);
  const automationOnly =
    repoPaths !== undefined &&
    repoPaths.length > 0 &&
    repoPaths.every(isAutomationOwnedPath);

  if (automationOnly) {
    return commitAutomationStateWithMergeRetry(cwd, branch, message, repoPaths);
  }

  await runGit(["commit", "-m", message], cwd);
  await pushWithRebaseRetry(cwd, branch);
  return true;
};
