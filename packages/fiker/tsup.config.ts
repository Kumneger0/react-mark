import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "index.ts",
    "static/client.js",
    "src/entry-server.tsx",
    "src/link.tsx",
    "static/index.html",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: "esm",
  loader: {
    ".html": "file",
  },
  cjsInterop: true,
});
