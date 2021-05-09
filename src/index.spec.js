"use strict";

const assert = require("assert");
const core = require("@actions/core");
const sinon = require("sinon");
const github = require("./github");
const { BaseAction, invoke } = require("./index");

class GoodTestAction extends BaseAction {
  get label() {
    return "build";
  }
  render() {
    return { label: "passing" };
  }
}

describe("invoke", function () {
  let logs = [];
  const mockedWrite = (output) => logs.push(output);
  const originalConsoleLog = console.log;
  const originalCoreInfo = core.info;

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

    await assert.rejects(invoke(BadTestAction), {
      name: "Error",
      message: "Action class must extend BaseAction",
    });
  });

  it("throws an exception if class has no render() function", async function () {
    class BadTestAction extends BaseAction {}

    await assert.rejects(invoke(BadTestAction), {
      name: "Error",
      message: "render not implemented",
    });
  });

  it("fails the build if writeBadge throws an error", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    const writeFileToRepo = sinon.stub(github, "writeFileToRepo");
    writeFileToRepo.onCall(0).throws();
    writeFileToRepo.onCall(1).returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert.strictEqual(2, writeFileToRepo.callCount);
    assert(setFailed.calledOnce);
  });

  it("writes a badge", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";

    const writeFileToRepo = sinon.stub(github, "writeFileToRepo").returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert(writeFileToRepo.calledOnce);
    assert(setFailed.notCalled);

    const args = writeFileToRepo.args[0][1];
    assert.strictEqual("owner", args.owner);
    assert.strictEqual("repo", args.repo);
    assert.strictEqual(".badges/badge.svg", args.path);
    assert.strictEqual(undefined, args.branch);
    assert.match(args.content, /^[a-zA-Z0-9+/\r\n]+={0,2}$/);

    assert(logs.includes("Wrote .badges/badge.svg"));
  });

  it("respects branch params", async function () {
    process.env["INPUT_GITHUB-TOKEN"] = "f00ba2";
    process.env["INPUT_FILE-NAME"] = "badge.svg";
    process.env["GITHUB_REPOSITORY"] = "owner/repo";
    process.env["INPUT_BADGE-BRANCH"] = "badge-branch";
    process.env["GITHUB_REF"] = "refs/heads/main";

    const writeFileToRepo = sinon.stub(github, "writeFileToRepo").returns(true);
    const setFailed = sinon.spy(core, "setFailed");

    await invoke(GoodTestAction);

    assert(writeFileToRepo.calledOnce);
    assert(setFailed.notCalled);

    const args = writeFileToRepo.args[0][1];

    assert.strictEqual(".badges/main/badge.svg", args.path);
    assert.strictEqual("badge-branch", args.branch);

    assert(logs.includes("Wrote .badges/main/badge.svg"));
  });
});
