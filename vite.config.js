import { defineConfig } from "vite";

export default defineConfig({
  // Keep config minimal; React runs via Vite's default JSX handling.
  esbuild: {
    jsx: "automatic",
  },
});
