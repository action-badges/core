"use strict";

const assert = require("assert");
const { getBadgeObject, getBadgeSvg } = require("./badge");

describe("getBadgeObject", function () {
  afterEach(function () {
    delete process.env["INPUT_LABEL"];
    delete process.env["INPUT_LABEL-COLOR"];
    delete process.env["INPUT_MESSAGE"];
    delete process.env["INPUT_MESSAGE-COLOR"];
    delete process.env["INPUT_STYLE"];
  });

  it("returns default object with no env or function inputs", function () {
    assert.deepStrictEqual(getBadgeObject({}), {
      label: undefined,
      labelColor: "#555",
      message: "message",
      messageColor: "blue",
      style: "flat",
    });
  });

  it("overrides defaults with env inputs", function () {
    process.env["INPUT_LABEL"] = "label";
    process.env["INPUT_LABEL-COLOR"] = "black";
    process.env["INPUT_MESSAGE"] = "foobar";
    process.env["INPUT_MESSAGE-COLOR"] = "green";
    process.env["INPUT_STYLE"] = "for-the-badge";

    assert.deepStrictEqual(getBadgeObject({}), {
      label: "label",
      labelColor: "black",
      message: "foobar",
      messageColor: "green",
      style: "for-the-badge",
    });
  });

  it("overrides defaults with function inputs", function () {
    assert.deepStrictEqual(
      getBadgeObject({
        label: "label",
        labelColor: "black",
        message: "foobar",
        messageColor: "green",
        style: "for-the-badge",
      }),
      {
        label: "label",
        labelColor: "black",
        message: "foobar",
        messageColor: "green",
        style: "for-the-badge",
      }
    );
  });

  it("overrides function inputs with env inputs", function () {
    process.env["INPUT_LABEL"] = "env-label";
    process.env["INPUT_LABEL-COLOR"] = "black";
    process.env["INPUT_MESSAGE"] = "env-foobar";
    process.env["INPUT_MESSAGE-COLOR"] = "green";
    process.env["INPUT_STYLE"] = "for-the-badge";

    assert.deepStrictEqual(
      getBadgeObject({
        label: "fn-label",
        labelColor: "white",
        message: "fn-foobar",
        messageColor: "red",
        style: "social",
      }),
      {
        label: "env-label",
        labelColor: "black",
        message: "env-foobar",
        messageColor: "green",
        style: "for-the-badge",
      }
    );
  });

  it("overrides defaults with mixed inputs", function () {
    process.env["INPUT_LABEL"] = "label";

    assert.deepStrictEqual(getBadgeObject({ style: "for-the-badge" }), {
      label: "label",
      labelColor: "#555",
      message: "message",
      messageColor: "blue",
      style: "for-the-badge",
    });
  });
});

describe("getBadgeObject", function () {
  it("renders a SVG", function () {
    const svg = getBadgeSvg({
      message: "foobar",
      messageColor: "blue",
      style: "flat",
    });
    assert.match(svg, /<svg.+/);
    assert(svg.includes("foobar</text>"));
  });

  it("ignores labelColor if label not set", function () {
    const svg = getBadgeSvg({
      labelColor: "#555",
      message: "foobar",
      messageColor: "blue",
      style: "flat",
    });
    assert.match(svg, /<svg.+/);
    assert(!svg.includes("#555"));
  });
});
