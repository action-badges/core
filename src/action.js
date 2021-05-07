"use strict";

const { BaseAction, invoke } = require("./index");

class StaticAction extends BaseAction {
  async render() {
    return {};
  }
}

async function run() {
  await invoke(StaticAction);
}

run();
