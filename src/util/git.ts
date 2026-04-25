import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const runGit = async (args: string[], cwd: string) => {
  await execFileAsync("git", args, { cwd });
};

const gitOutput = async (args: string[], cwd: string) => {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout.trim();
};

const isNonFastForwardPush = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const stderr = "stderr" in error ? String(error.stderr ?? "") : "";
  return /fetch first|failed to push some refs|non-fast-forward/i.test(stderr);
};

const currentBranch = async (cwd: string) => {
  const branch = await gitOutput(["branch", "--show-current"], cwd);
  if (!branch) {
    throw new Error("Cannot push generated content from a detached HEAD checkout.");
  }

  return branch;
};

const rebaseOntoRemote = async (cwd: string, branch: string) => {
  await runGit(["fetch", "origin", branch], cwd);

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
