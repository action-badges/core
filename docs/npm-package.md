# `@action-badges/core` NPM Package

```
npm install @action-badges/core
```

- `@action-badges/core` may be used to create a re-usable javascript action.
- Badges are defined by creating a class which extends `BaseAction` and run using `invoke()`.
- Classes extending `BaseAction` must implement `async render()`.
- If the label (left side of the badge) is static, it is advisable to define this using `get label()` so it can be used in error handling. If it is dynamic, it can be returned by `async render()`.
- `async render()` returns an object which can contain any of the keys `label`, `labelColor`, `message`, `messageColor`, `style`. It should usually contain at least a `message` key.
- If `async render()` returns `null` or `undefined`, no SVG will be written.
- Your javascript action inherits all of the default Yaml [parameters](https://github.com/action-badges/core/blob/main/docs/github-action.md#parameters) but you can define your own too. Parameters explicitly specified in yaml take precedence over the values returned by `async render()`, allowing users to customise the behaviour of badges.

## Example

```js
"use strict";

const { BaseAction, invoke } = require("@action-badges/core");

class BlackCodeStyle extends BaseAction {
  get label() {
    return "code style";
  }

  async render() {
    return {
      message: "black",
      messageColor: "000",
    };
  }
}

async function run() {
  return await invoke(BlackCodeStyle);
}

run();
```
