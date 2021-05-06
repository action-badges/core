"use strict";

const core = require("@actions/core");
const github = require("@actions/github");
const { getBadgeObject, getBadgeSvg } = require("./badge");
const { getBranch, writeFileToRepo } = require("./github");

async function writeBadge(params) {
  const badgeObj = getBadgeObject(params);
  const svg = getBadgeSvg(badgeObj);

  console.log(badgeObj); // core.info logs this as '[object Object]'
  core.info(svg);

  const token = core.getInput("github-token", { required: true });
  const filename = core.getInput("file-name", { required: true });
  const badgeBranch = core.getInput("badge-branch") || undefined;
  const actionBranch = getBranch();
  const subDir = actionBranch ? `.badges/${actionBranch}` : ".badges";
  const path = `${subDir}/${filename}`;
  const client = github.getOctokit(token);

  const changed = await writeFileToRepo(client, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    content: Buffer.from(svg).toString("base64"),
    path: path,
    branch: badgeBranch,
  });

  if (changed === true) {
    core.info(`Wrote ${path}`);
  } else if (changed === false) {
    core.info(`Nothing to commit`);
  }
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

  if (!(Cls.prototype instanceof BaseAction)) {
    throw new Error("Action class must extend BaseAction");
  }

  const obj = new Cls();

  try {
    await writeBadge({ ...{ label: obj.label }, ...(await obj.render()) });
  } catch (e) {
    await writeBadge({
      label: obj.label,
      message: "error",
      messageColor: "lightgrey",
    });
    core.setFailed(e.message);
  }
}

module.exports = {
  BaseAction,
  invoke,
};
