import { projectRoot } from "../config/brand.js";
import { logStep } from "../util/log.js";
import {
  automationOwnedGitPaths,
  syncLocalBranchWithRemoteState
} from "../util/git.js";

const result = await syncLocalBranchWithRemoteState(projectRoot);

logStep(`Synced ${result.branch} with origin/${result.branch}.`);

if (result.preservedPaths.length > 0) {
  logStep(
    `Preserved ${result.preservedPaths.length} local user-owned change(s) while refreshing automation state.`
  );
} else {
  logStep("No local user-owned changes needed preserving.");
}

logStep(`Automation-owned paths now mirror remote:\n${automationOwnedGitPaths.join("\n")}`);
