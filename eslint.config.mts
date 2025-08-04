// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1. Global ignores and basic setup
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "build/**", "coverage/**","**/*.test.*"],
  },

  // 2. Base configs for JS, TS, and React
  js.configs.recommended,
  ...tseslint.configs.recommended, // Note the spread `...`
  pluginReact.configs.flat["jsx-runtime"], // For React 17+ new JSX transform

  // 3. Next.js specific config
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // 4. Your custom settings and overrides
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: "readonly", // <-- THE FIX for "'React' is not defined"
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
    rules: {
      // Your custom rules can go here.
      // For example, if you want to allow unused vars prefixed with _:
      // "@typescript-eslint/no-unused-vars": [
      //   "error",
      //   { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      // ]
    },
  },
];