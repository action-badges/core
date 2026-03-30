import globals from "globals";
import js from "@eslint/js";
import nodeCoreTestPlugin from "eslint-plugin-node-core-test";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const config = [
  js.configs.recommended,
  nodeCoreTestPlugin.configs.recommended,
  prettierConfig,
  {
    ignores: ["dist"],
  },
  {
    plugins: {
      "node-core-test": nodeCoreTestPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "prettier/prettier": ["error"],
      "node-core-test/no-exclusive-tests": ["error"],
      "node-core-test/no-incomplete-tests": ["error"],
      "node-core-test/no-skipped-tests": ["error"],
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
];

export default config;
