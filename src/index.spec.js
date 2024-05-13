import assert from "assert";
import core from "@actions/core";
import sinon from "sinon";
import github from "./github.js";
import { BaseAction, invoke } from "./index.js";

class GoodTestAction extends BaseAction {
  get label() {
    return "build";
  }
  render() {
    return { message: "passing" };
  }
}

describe("invoke", function () {
  let logs = [];
  const mockedWrite = (output) => logs.push(output);
  const originalConsoleLog = console.log; // eslint-disable-line mocha/no-setup-in-describe
  const originalCoreInfo = core.info; // eslint-disable-line mocha/no-setup-in-describe

  beforeEach(function () {
    logs = [];
    console.log = mockedWrite;
    core.info = mockedWrite;
  });

  afterEach(function () {
    logs = [];
    console.log = originalConsoleLog;
    core.info = originalCoreInfo;

    sinon.restore();

    delete process.env["INPUT_BADGE-BRANCH"];
    delete process.env["INPUT_FILE-NAME"];
    delete process.env["INPUT_GITHUB-TOKEN"];
    delete process.env["GITHUB_REF"];
    delete process.env["GITHUB_REPOSITORY"];
  });

  it("throws an exception if class is not instance of BaseAction", async function () {
    class BadTestAction {}

    const setFailed = sinon.spy(core, "setFailed");
    await invoke(BadTestAction);
    assert(setFailed.calledOnce);
    assert(setFailed.calledWith("Action class must extend BaseAction"));
  });

  it("throws an exception if class has no render() function", async function () {
    class BadTestAction extends BaseAction {}

    const setFailed = sinon.spy(core, "setFailed");
    await invoke(BadTestAction);
    assert(setFailed.calledOnce);
    assert(setFailed.calledWith("render not implemented"));
  });

  it("fails the build if writeBadge throws an error", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    const getDefaultBranch = sinon
      .stub(github, "getDefaultBranch")
      .returns("main");
    const writeFileToRepo = sinon.stub(github, "writeFileToRepo");
    writeFileToRepo.onCall(0).throws();
    writeFileToRepo.onCall(1).returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert.strictEqual(getDefaultBranch.callCount, 2);
    assert.strictEqual(writeFileToRepo.callCount, 2);
    assert(setFailed.calledOnce);
  });

  it("writes a badge", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    const getDefaultBranch = sinon
      .stub(github, "getDefaultBranch")
      .returns("main");
    const writeFileToRepo = sinon.stub(github, "writeFileToRepo").returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert(getDefaultBranch.calledOnce);
    assert(writeFileToRepo.calledOnce);
    assert(setFailed.notCalled);

    const args = writeFileToRepo.args[0][1];
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

    const getDefaultBranch = sinon
      .stub(github, "getDefaultBranch")
      .returns("main");
    const writeFileToRepo = sinon.stub(github, "writeFileToRepo").returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert(getDefaultBranch.calledOnce);
    assert(writeFileToRepo.calledOnce);
    assert(setFailed.notCalled);

    const args = writeFileToRepo.args[0][1];

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

    const getDefaultBranch = sinon
      .stub(github, "getDefaultBranch")
      .returns("main");
    const writeFileToRepo = sinon.stub(github, "writeFileToRepo").returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    [null, undefined].forEach(async function (value) {
      class NullTestAction extends BaseAction {
        get label() {
          return "build";
        }
        render() {
          return value;
        }
      }

      await invoke(NullTestAction);

      assert(getDefaultBranch.notCalled);
      assert(writeFileToRepo.notCalled);
      assert(setFailed.notCalled);
    });
  });
});
