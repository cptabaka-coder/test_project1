/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  // Static site, deployed to a subpath on itch.io / GitHub Pages.
  base: "./",
  build: {
    target: "es2022",
  },
  test: {
    globals: true,
    // The simulation seam is the only unit-test surface (ADR 0002).
    include: ["test/sim/**/*.test.ts"],
  },
});
