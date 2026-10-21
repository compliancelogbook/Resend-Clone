import path from "node:path";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so tests don't load the dev-server plugins.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  test: {
    environment: "node",
    include: ["client/src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
