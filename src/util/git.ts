import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { appEnv, files, projectRoot } from "../config/brand.js";

const execFileAsync = promisify(execFile);
const normalizeGitPath = (value: string) => value.replaceAll("\\", "/");
const uniquePaths = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean).map(normalizeGitPath))).sort();

export const automationOwnedGitPaths = uniquePaths([
  path.relative(projectRoot, files.queue),
  path.relative(projectRoot, files.publishedLog),
  path.relative(projectRoot, files.previewManifest),
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
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout.trim();
};

const gitLines = async (args: string[], cwd: string) => {
  const output = await gitOutput(args, cwd);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const isNonFastForwardPush = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const stderr = "stderr" in error ? String(error.stderr ?? "") : "";
  return /fetch first|failed to push some refs|non-fast-forward/i.test(stderr);
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
  const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd });
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

export const commitAndPushIfChanged = async (
  cwd: string,
  message: string,
  paths?: string[]
) => {
  if (paths && paths.length > 0) {
    await runGit(["add", ...paths], cwd);
  } else {
    await runGit(["add", "-A"], cwd);
  }

  if (!(await hasGitChanges(cwd))) {
    return false;
  }

  await runGit(["commit", "-m", message], cwd);
  await pushWithRebaseRetry(cwd, await currentBranch(cwd));
  return true;
};
