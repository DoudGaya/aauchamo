import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/server/**/*.ts"],
      exclude: ["lib/server/db.ts"],
    },
  },
});
