import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { projectRoot } from "../config/brand.js";
import { getFlag, hasFlag } from "./args.js";
import {
  commitStagedChanges,
  pushCurrentBranch,
  stageNonAutomationChanges,
  syncLocalBranchWithRemoteState,
  userOwnedDirtyPaths
} from "../util/git.js";
import { logStep, logWarn } from "../util/log.js";

const execFileAsync = promisify(execFile);

const runTypecheck = async () => {
  if (process.platform === "win32") {
    await execFileAsync("cmd.exe", ["/d", "/s", "/c", "npm run typecheck"], {
      cwd: projectRoot
    });
    return;
  }

  await execFileAsync("npm", ["run", "typecheck"], {
    cwd: projectRoot
  });
};

const message = getFlag("message");
const dryRun = hasFlag("dry-run");
const skipTypecheck = hasFlag("skip-typecheck");

if (!message && !dryRun) {
  throw new Error("Pass --message \"...\" when using ship:code.");
}

const result = await syncLocalBranchWithRemoteState(projectRoot);
logStep(`Local branch ${result.branch} is now based on origin/${result.branch}.`);

if (!skipTypecheck) {
  logStep("Running typecheck before staging code changes.");
  await runTypecheck();
}

const pending = await userOwnedDirtyPaths(projectRoot);
if (pending.length === 0) {
  logWarn("No user-owned changes were staged. Nothing to commit.");
  process.exit(0);
}

if (dryRun) {
  logStep(`Dry run. These user-owned path(s) would be committed:\n${pending.join("\n")}`);
  process.exit(0);
}

const staged = await stageNonAutomationChanges(projectRoot);
logStep(`Staged ${staged.length} user-owned path(s):\n${staged.join("\n")}`);

await commitStagedChanges(projectRoot, message!);
await pushCurrentBranch(projectRoot, result.branch);

logStep(`Committed and pushed "${message}" to origin/${result.branch}.`);
