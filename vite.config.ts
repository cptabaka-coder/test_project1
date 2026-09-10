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
    // Unit tests cover the pure logic core only — the simulation seam and the
    // fixed-timestep accumulator. The renderer and DOM UI are not unit-tested
    // (ADR 0002); the boundary is enforced by ESLint on src/sim/**.
    include: ["test/**/*.test.ts"],
  },
});
