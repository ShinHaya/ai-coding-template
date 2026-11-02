// Template-owned lint config. Managed files are also linted by each consumer's
// own config, so keep them clean under the stock recommended rules rather than
// relying on relaxations (such as `_`-prefixed names) here. `prefer-const` is
// added because typescript-eslint's recommended set enables it.

import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["state/**", ".worktrees/**"] },
  {
    files: ["**/*.{js,mjs}"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  { files: ["**/*.{js,mjs}"], rules: { "prefer-const": "error" } },
];
