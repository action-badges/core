"use strict";

const { BaseAction, invoke } = require("./lib");

class StaticAction extends BaseAction {
  async render() {
    return {};
  }
}

async function run() {
  await invoke(StaticAction);
}

run();
