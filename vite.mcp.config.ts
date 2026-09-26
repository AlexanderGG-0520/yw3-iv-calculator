import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node22",
    outDir: "dist-mcp",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        server: "mcp/server.ts",
        "reverse-worker": "mcp/reverse-worker.ts",
      },
      output: {
        entryFileNames: "[name].mjs",
        chunkFileNames: "chunks/[name]-[hash].mjs",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});
