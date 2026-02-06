import * as core from "@actions/core";
import * as github from "@actions/github";
import { getBadgeObject, getBadgeSvg } from "./badge.js";
import githubHelper from "./github.js";

async function writeBadge(params) {
  const badgeObj = getBadgeObject(params);
  const svg = getBadgeSvg(badgeObj);

  core.info("Merged badge options:");
  console.log(badgeObj); // core.info logs this as '[object Object]'
  core.info("\nGenerated SVG:");
  core.info(svg + "\n");

  const token = core.getInput("github-token", { required: true });
  const filename = core.getInput("file-name", { required: true });
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const client = github.getOctokit(token);
  const defaultBranch = await githubHelper.getDefaultBranch(client, {
    owner,
    repo,
  });
  const badgeBranch = core.getInput("badge-branch") || defaultBranch;
  const actionBranch = githubHelper.getBranch();
  const subDir = actionBranch ? `.badges/${actionBranch}` : ".badges";
  const path = `${subDir}/${filename}`;

  const changed = await githubHelper.writeFileToRepo(client, {
    owner,
    repo,
    content: Buffer.from(svg).toString("base64"),
    path: path,
    branch: badgeBranch,
  });

  if (changed === true) {
    core.info(`Wrote ${path}`);
  } else if (changed === false) {
    core.info(`Nothing to commit`);
  }

  core.info("\nEmbed this badge with markdown:");
  const embedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${badgeBranch}/${path}`;
  const markdownLabel = badgeObj.label ? badgeObj.label : "";
  const embedMarkdown = `![${markdownLabel}](${embedUrl})`;
  core.info(embedMarkdown);
}

class BaseAction {
  get label() {
    return undefined;
  }
  async render() {
    throw new Error(`render not implemented`);
  }
}

async function invoke(Cls) {
  process.on("unhandledRejection", (reason, promise) => {
    core.setFailed(reason);
  });

  let obj;
  let rendered;
  try {
    if (!(Cls.prototype instanceof BaseAction)) {
      throw new Error("Action class must extend BaseAction");
    }

    obj = new Cls();
    rendered = await obj.render();
    if (rendered == null) {
      return;
    }
  } catch (e) {
    core.setFailed(e.message);
    return;
  }

  try {
    await writeBadge({ ...{ label: obj.label }, ...rendered });
  } catch (e) {
    await writeBadge({
      label: obj.label,
      message: "error",
      messageColor: "lightgrey",
    });
    core.setFailed(e.message);
  }
}

export { BaseAction, invoke };
