import { defineAgent } from "eve";

export default defineAgent({
  model: process.env["BUNDJIL_AGENT_MODEL"] ?? "google/gemini-2.5-flash",
});
