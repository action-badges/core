import assert from "assert";
import * as core from "@actions/core";
import esmock from "esmock";
import github from "./github.js";
import sinon from "sinon";

describe("invoke", function () {
  let logs = [];
  let invoke;
  let BaseAction;
  let mockCore;
  let mockGithub;
  const originalConsoleLog = console.log; // eslint-disable-line mocha/no-setup-in-describe

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

  async function setup() {
    mockCore = {
      ...core,
      info: (output) => logs.push(output),
      setFailed: sinon.stub(),
    };

    mockGithub = {
      ...github,
      getDefaultBranch: sinon.stub(),
      writeFileToRepo: sinon.stub(),
      getBranch: sinon.stub().returns(""),
    };

    ({ invoke, BaseAction } = await esmock("./index.js", {
      "@actions/core": mockCore,
      "./github.js": { default: mockGithub },
    }));
  }

  beforeEach(function () {
    logs = [];
    console.log = (output) => logs.push(output);
  });

  afterEach(function () {
    logs = [];
    console.log = originalConsoleLog;
    sinon.restore();

    delete process.env["INPUT_BADGE-BRANCH"];
    delete process.env["INPUT_FILE-NAME"];
    delete process.env["INPUT_GITHUB-TOKEN"];
    delete process.env["GITHUB_REF"];
    delete process.env["GITHUB_REPOSITORY"];
  });

  it("throws an exception if class is not instance of BaseAction", async function () {
    await setup();
    class BadTestAction {}

    await invoke(BadTestAction);
    assert(mockCore.setFailed.calledOnce);
    assert(
      mockCore.setFailed.calledWith("Action class must extend BaseAction"),
    );
  });

  it("throws an exception if class has no render() function", async function () {
    await setup();
    class BadTestAction extends BaseAction {}

    await invoke(BadTestAction);
    assert(mockCore.setFailed.calledOnce);
    assert(mockCore.setFailed.calledWith("render not implemented"));
  });

  it("fails the build if writeBadge throws an error", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";
    await setup();

    mockGithub.getDefaultBranch.returns("main");
    mockGithub.writeFileToRepo.onCall(0).throws();
    mockGithub.writeFileToRepo.onCall(1).returns(true);

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert.strictEqual(mockGithub.getDefaultBranch.callCount, 2);
    assert.strictEqual(mockGithub.writeFileToRepo.callCount, 2);
    assert(mockCore.setFailed.calledOnce);
  });

  it("writes a badge", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";
    await setup();

    mockGithub.getDefaultBranch.returns("main");
    mockGithub.writeFileToRepo.returns(true);

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert(mockGithub.getDefaultBranch.calledOnce);
    assert(mockGithub.writeFileToRepo.calledOnce);
    assert(mockCore.setFailed.notCalled);

    const args = mockGithub.writeFileToRepo.args[0][1];
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
    await setup();

    mockGithub.getDefaultBranch.returns("main");
    mockGithub.writeFileToRepo.returns(true);
    mockGithub.getBranch.returns("main");

    const GoodTestAction = createGoodTestAction();
    await invoke(GoodTestAction);

    assert(mockGithub.getDefaultBranch.calledOnce);
    assert(mockGithub.writeFileToRepo.calledOnce);
    assert(mockCore.setFailed.notCalled);

    const args = mockGithub.writeFileToRepo.args[0][1];

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
    await setup();

    mockGithub.getDefaultBranch.returns("main");
    mockGithub.writeFileToRepo.returns(true);

    for (const value of [null, undefined]) {
      mockGithub.getDefaultBranch.resetHistory();
      mockGithub.writeFileToRepo.resetHistory();
      mockCore.setFailed.resetHistory();

      class NullTestAction extends BaseAction {
        get label() {
          return "build";
        }
        render() {
          return value;
        }
      }

      await invoke(NullTestAction);

      assert(mockGithub.getDefaultBranch.notCalled);
      assert(mockGithub.writeFileToRepo.notCalled);
      assert(mockCore.setFailed.notCalled);
    }
  });
});
