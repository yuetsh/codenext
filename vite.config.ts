import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
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
  plugins: [vue()],
})
