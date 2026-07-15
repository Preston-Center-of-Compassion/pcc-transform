import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // On GitHub Pages this is served from https://<org>.github.io/pcc-transform/,
  // so production assets must be requested under that subpath. The dev server
  // stays at "/" for convenience.
  base: command === "build" ? "/pcc-transform/" : "/",
  plugins: [preact()],
}));
