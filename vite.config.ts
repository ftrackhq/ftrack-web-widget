import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src", "index.ts"),
      name: "ftrackWidget",
      fileName: (format) =>
        `ftrack-javascript-api.${format}.${format === "umd" ? "cjs" : "mjs"}`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {},
      plugins: [],
    },
  },
  plugins: [dts()],
});
