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
      fileName: (format) => `ftrackWidget.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {},
      plugins: [],
    },
  },
  plugins: [dts({ rollupTypes: true, entryRoot: "src" })],
});
