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

export default { getBranch, getDefaultBranch, writeFileToRepo };
