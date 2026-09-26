import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "mcp/server.ts",
    target: "node22",
    outDir: "dist-mcp",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: "server.mjs",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});
