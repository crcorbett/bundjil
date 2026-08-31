import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Preserve authored Markdown wrapping when Ultracite changes formatter defaults.
  proseWrap: "preserve",
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "tools/oxlint/anti-slop/**",
  ],
});
