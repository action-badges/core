import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import mochaPlugin from "eslint-plugin-mocha";

const config = [
  js.configs.recommended,
  mochaPlugin.configs.recommended,
  prettierConfig,
  {
    ignores: ["dist"],
  },
  {
    plugins: {
      mocha: mochaPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        mocha: true,
        ...globals.node,
      },
    },
    rules: {
      "prettier/prettier": ["error"],
      "mocha/no-pending-tests": ["error"],
      "mocha/no-exclusive-tests": ["error"],
      "mocha/max-top-level-suites": ["off"],
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
];

export default config;
