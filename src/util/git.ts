import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const runGit = async (args: string[], cwd: string) => {
  await execFileAsync("git", args, { cwd });
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
  await runGit(["push"], cwd);
  return true;
};
