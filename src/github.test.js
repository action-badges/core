import assert from "node:assert";
import { describe, it, afterEach, mock } from "node:test";
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
    mock.restoreAll();
  });

  it("creates file if file does not exist", async function () {
    const getContent = mock.fn(() => {
      throw new Error();
    });
    const createOrUpdateFileContents = mock.fn();
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

    assert.strictEqual(createOrUpdateFileContents.mock.calls.length, 1);
    assert.deepStrictEqual(
      createOrUpdateFileContents.mock.calls[0].arguments[0],
      {
        message: "create /path/to/file",
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      },
    );
  });

  it("updates file if file has changed", async function () {
    const getContent = mock.fn(() => ({
      data: { sha: "abc123", content: "c29tZXRoaW5nIGVsc2U=" },
    }));
    const createOrUpdateFileContents = mock.fn();
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

    assert.strictEqual(createOrUpdateFileContents.mock.calls.length, 1);
    assert.deepStrictEqual(
      createOrUpdateFileContents.mock.calls[0].arguments[0],
      {
        message: "update /path/to/file",
        sha: "abc123",
        owner: "owner",
        repo: "repo",
        content: "PHN2Zy4uLg==",
        path: "/path/to/file",
        branch: "main",
      },
    );
  });

  it("does nothing if file has not changed", async function () {
    const getContent = mock.fn(() => ({
      data: { sha: "abc123", content: "PHN2Zy4uLg==" },
    }));
    const createOrUpdateFileContents = mock.fn();
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

    assert.strictEqual(createOrUpdateFileContents.mock.calls.length, 0);
  });
});
