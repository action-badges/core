import assert from "assert";
import sinon from "sinon";
import github from "./github.js";

describe("getBranch", function () {
  afterEach(function () {
    delete process.env["GITHUB_REF"];
  });

  it("returns a branch if ref is a head", function () {
    process.env["GITHUB_REF"] = "refs/heads/main";
    assert.strictEqual(github.getBranch(), "main");
  });

  it("doesn't return a branch if ref is a tag", function () {
    process.env["GITHUB_REF"] = "refs/tags/v1.0";
    assert.strictEqual(github.getBranch(), "");
  });
});

describe("writeFileToRepo", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("creates file if file does not exist", async function () {
    const getContent = sinon.stub().throws();
    const createOrUpdateFileContents = sinon.spy();
    const client = {
      rest: { repos: { getContent, createOrUpdateFileContents } },
    };

    assert.strictEqual(
      await github.writeFileToRepo(client, {
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      }),
      true,
    );

    assert(
      createOrUpdateFileContents.calledWith({
        message: "create /path/to/file",
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      }),
    );
  });

  it("updates file if file has changed", async function () {
    const getContent = sinon
      .stub()
      .returns({ data: { sha: "abc123", content: "c29tZXRoaW5nIGVsc2U=" } });
    const createOrUpdateFileContents = sinon.spy();
    const client = {
      rest: { repos: { getContent, createOrUpdateFileContents } },
    };

    assert.strictEqual(
      await github.writeFileToRepo(client, {
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      }),
      true,
    );

    assert(
      createOrUpdateFileContents.calledWith({
        message: "update /path/to/file",
        sha: "abc123",
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      }),
    );
  });

  it("does nothing if file has not changed", async function () {
    const getContent = sinon
      .stub()
      .returns({ data: { sha: "abc123", content: "PHN2Zy4uLg==" } });
    const createOrUpdateFileContents = sinon.spy();
    const client = {
      rest: { repos: { getContent, createOrUpdateFileContents } },
    };

    assert.strictEqual(
      await github.writeFileToRepo(client, {
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      }),
      false,
    );

    assert(createOrUpdateFileContents.notCalled);
  });
});
