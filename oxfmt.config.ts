import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Preserve authored Markdown wrapping when Ultracite changes formatter defaults.
  proseWrap: "preserve",
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    ".agents/**",
    ".claude/**",
    ".cursor/**",
  ],
});
