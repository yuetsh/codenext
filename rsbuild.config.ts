import { defineConfig } from "@rsbuild/core"
import { pluginVue } from "@rsbuild/plugin-vue"

export default defineConfig({
  plugins: [pluginVue()],
  html: {
    template: "./index.html",
  },
  source: {
    entry: {
      index: "./src/main.ts",
    },
  },
  performance: {
    chunkSplit: {
      strategy: "split-by-module",
      // forceSplitting: {
      //   "lib-ui": /node_modules[\\/]naive-ui/,
      //   "lib-cm": /node_modules[\\/]@codemirror/,
      // },
    },
  },
})
