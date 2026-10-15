import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const rebuildDir = fileURLToPath(new URL("./rebuild", import.meta.url));

export default defineConfig({
  root: rebuildDir,
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false
      }
    }
  },
  build: {
    outDir: fileURLToPath(new URL("./dist/rebuild", import.meta.url)),
    emptyOutDir: true,
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"]
  }
});
