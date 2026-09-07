import { useDark } from "@vueuse/core"
import { createDiscreteApi, darkTheme } from "naive-ui"
import { computed } from "vue"

const isDark = useDark()

// 组件外（如 init 阶段）需要提示时用这套脱离上下文的 API，主题跟随 App.vue
const api = createDiscreteApi(["message", "dialog"], {
  configProviderProps: computed(() => ({
    theme: isDark.value ? darkTheme : null,
  })),
})

export const notice = api.message
export const dialog = api.dialog
