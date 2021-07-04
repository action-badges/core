"use strict";

async function createOrphanBranch(client, { owner, repo, branch }) {
  console.log("createOrphanBranch");
  const SHA1_EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
  const res = await client.request("POST /repos/{owner}/{repo}/git/commits", {
    owner,
    repo,
    message: "init orphan branch",
    tree: SHA1_EMPTY_TREE,
    parents: [],
  });
  await client.request("POST /repos/{owner}/{repo}/git/refs", {
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: res.data.sha,
  });
}

async function initOrphanBranch(client, { owner, repo, branch }) {
  console.log("initOrphanBranch");
  try {
    await client.rest.repos.getBranch({ owner, repo, branch });
  } catch (e) {
    await createOrphanBranch(client, { owner, repo, branch });
  }
}

function getBranch() {
  try {
    const ref = process.env.GITHUB_REF;
    if (ref.startsWith("refs/heads")) {
      return ref.split("/").slice(2).join("/");
    }
    return "";
  } catch (e) {
    return "";
  }
}

async function getDefaultBranch(client, { owner, repo }) {
  const resp = await client.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
  });
  return resp.data.default_branch;
}

async function getExistingFile(client, { owner, repo, path, branch }) {
  try {
    const resp = await client.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    return {
      exists: true,
      sha: resp.data.sha,
      content: resp.data.content.replace(/\n/g, ""),
    };
  } catch (e) {
    return { exists: false, sha: null, content: null };
  }
}

async function writeFileToRepo(client, { owner, repo, content, path, branch }) {
  await initOrphanBranch(client, { owner, repo, branch });
  const existingFile = await getExistingFile(client, {
    owner,
    repo,
    path,
    branch,
  });
  const payload = { owner, repo, content, path, branch };
  if (existingFile.exists === true) {
    payload.sha = existingFile.sha;
    payload.message = `update ${path}`;
  } else {
    payload.message = `create ${path}`;
  }
  if (content !== existingFile.content) {
    await client.rest.repos.createOrUpdateFileContents(payload);
    return true;
  }
  return false;
}

module.exports = {
  getBranch,
  getDefaultBranch,
  writeFileToRepo,
};
