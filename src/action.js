import { BaseAction, invoke } from "./index.js";

class StaticAction extends BaseAction {
  async render() {
    return {};
  }
}

async function run() {
  await invoke(StaticAction);
}

run();
