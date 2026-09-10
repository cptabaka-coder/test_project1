import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: false },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // ADR 0002: the simulation must not depend on the renderer or the DOM.
    // This boundary is what keeps the sim unit-testable and the renderer replaceable.
    files: ["src/sim/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "pixi.js",
              message: "src/sim must stay renderer-free (ADR 0002).",
            },
          ],
          patterns: [
            {
              group: ["**/systems/render*", "**/ui/**", "*/ui/*"],
              message: "src/sim must not import rendering or UI code (ADR 0002).",
            },
          ],
        },
      ],
    },
  },
];
