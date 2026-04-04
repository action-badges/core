import assert from "node:assert";
import { describe, it, afterEach, beforeEach, mock } from "node:test";
import * as realCore from "@actions/core";

const mockSetFailed = mock.fn();
const mockInfo = mock.fn();
const mockGetDefaultBranch = mock.fn();
const mockWriteFileToRepo = mock.fn();
const mockGetBranch = mock.fn(() => "");

mock.module("@actions/core", {
  namedExports: {
    ...realCore,
    info: mockInfo,
    setFailed: mockSetFailed,
  },
});

mock.module("./github.js", {
  defaultExport: {
    getDefaultBranch: mockGetDefaultBranch,
    writeFileToRepo: mockWriteFileToRepo,
    getBranch: mockGetBranch,
  },
});

const { invoke, BaseAction } = await import("./index.js");

describe("invoke", function () {
  let logs = [];
  const originalConsoleLog = console.log;

  function createGoodTestAction() {
    return class GoodTestAction extends BaseAction {
      get label() {
        return "build";
      }
      render() {
        return { message: "passing" };
      }
    };
  }

  beforeEach(function () {
    logs = [];
    console.log = (output) => logs.push(output);
    mockSetFailed.mock.resetCalls();
    mockInfo.mock.resetCalls();
    mockInfo.mock.mockImplementation((output) => logs.push(output));
    mockGetDefaultBranch.mock.resetCalls();
    mockWriteFileToRepo.mock.resetCalls();
    mockGetBranch.mock.resetCalls();
    mockGetBranch.mock.mockImplementation(() => "");
  });

  afterEach(function () {
    logs = [];
    console.log = originalConsoleLog;

    delete process.env["INPUT_BADGE-BRANCH"];
    delete process.env["INPUT_FILE-NAME"];
    delete process.env["INPUT_GITHUB-TOKEN"];
    delete process.env["GITHUB_REF"];
    delete process.env["GITHUB_REPOSITORY"];
  });

  it("throws an exception if class is not instance of BaseAction", async function () {
    class BadTestAction {}

    await invoke(BadTestAction);
    assert.strictEqual(mockSetFailed.mock.callCount(), 1);
    assert.strictEqual(
      mockSetFailed.mock.calls[0].arguments[0],
      "Action class must extend BaseAction",
    );
  });

  it("throws an exception if class has no render() function", async function () {
    class BadTestAction extends BaseAction {}

    await invoke(BadTestAction);
    assert.strictEqual(mockSetFailed.mock.callCount(), 1);
    assert.strictEqual(
      mockSetFailed.mock.calls[0].arguments[0],
      "render not implemented",
    );
  });

  it("fails the build if writeBadge throws an error", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    mockGetDefaultBranch.mock.mockImplementation(() => "main");
    mockWriteFileToRepo.mock.mockImplementationOnce(() => {
      throw new Error("error");
    }, 0);
    mockWriteFileToRepo.mock.mockImplementationOnce(() => true, 1);

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert.strictEqual(mockGetDefaultBranch.mock.callCount(), 2);
    assert.strictEqual(mockWriteFileToRepo.mock.callCount(), 2);
    assert.strictEqual(mockSetFailed.mock.callCount(), 1);
  });

  it("writes a badge", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    mockGetDefaultBranch.mock.mockImplementation(() => "main");
    mockWriteFileToRepo.mock.mockImplementation(() => true);

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert.strictEqual(mockGetDefaultBranch.mock.callCount(), 1);
    assert.strictEqual(mockWriteFileToRepo.mock.callCount(), 1);
    assert.strictEqual(mockSetFailed.mock.callCount(), 0);

    const args = mockWriteFileToRepo.mock.calls[0].arguments[1];
    assert.strictEqual(args.owner, "owner");
    assert.strictEqual(args.repo, "repo");
    assert.strictEqual(args.path, ".badges/badge.svg");
    assert.strictEqual(args.branch, "main");
    assert.match(args.content, /^[a-zA-Z0-9+/\r\n]+={0,2}$/);

    assert(logs.includes("Wrote .badges/badge.svg"));
    assert(
      logs.includes(
        "![build](https://raw.githubusercontent.com/owner/repo/main/.badges/badge.svg)",
      ),
    );
  });

  it("respects branch params", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";
    process.env["INPUT_BADGE-BRANCH"] = "badge-branch";
    process.env["GITHUB_REF"] = "refs/heads/main";

    mockGetDefaultBranch.mock.mockImplementation(() => "main");
    mockWriteFileToRepo.mock.mockImplementation(() => true);
    mockGetBranch.mock.mockImplementation(() => "main");

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert.strictEqual(mockGetDefaultBranch.mock.callCount(), 1);
    assert.strictEqual(mockWriteFileToRepo.mock.callCount(), 1);
    assert.strictEqual(mockSetFailed.mock.callCount(), 0);

    const args = mockWriteFileToRepo.mock.calls[0].arguments[1];
    assert.strictEqual(args.path, ".badges/main/badge.svg");
    assert.strictEqual(args.branch, "badge-branch");

    assert(logs.includes("Wrote .badges/main/badge.svg"));
    assert(
      logs.includes(
        "![build](https://raw.githubusercontent.com/owner/repo/badge-branch/.badges/main/badge.svg)",
      ),
    );
  });

  it("does not write anything if render() returns nothing", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    mockGetDefaultBranch.mock.mockImplementation(() => "main");
    mockWriteFileToRepo.mock.mockImplementation(() => true);

    for (const value of [null, undefined]) {
      mockGetDefaultBranch.mock.resetCalls();
      mockWriteFileToRepo.mock.resetCalls();
      mockSetFailed.mock.resetCalls();

      class NullTestAction extends BaseAction {
        get label() {
          return "build";
        }
        render() {
          return value;
        }
      }

      await invoke(NullTestAction);

      assert.strictEqual(mockGetDefaultBranch.mock.callCount(), 0);
      assert.strictEqual(mockWriteFileToRepo.mock.callCount(), 0);
      assert.strictEqual(mockSetFailed.mock.callCount(), 0);
    }
  });
});
