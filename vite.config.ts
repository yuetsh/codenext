import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import legacy from "@vitejs/plugin-legacy"

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          file: ["file-saver", "client-zip"],
          fancy: ["node-emoji"],
          editor: [
            "vue-codemirror",
            "codemirror",
            "@codemirror/lang-cpp",
            "@codemirror/lang-python",
          ],
        },
      },
    },
  },
  plugins: [vue(), legacy({ targets: ["chrome 66", "not IE 11"] })],
})
