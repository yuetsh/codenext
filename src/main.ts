import { addAPIProvider } from "@iconify/vue"
import {
  NButton,
  NConfigProvider,
  NDropdown,
  NFlex,
  NIcon,
  NInput,
  NInputNumber,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NMessageProvider,
  NModal,
  NPopover,
  NSelect,
  NSplit,
  NTabPane,
  NTabs,
  NTag,
  NSpin,
  create,
} from "naive-ui"
import "normalize.css"
import { createApp } from "vue"
import App from "./App.vue"

const naive = create({
  components: [
    NButton,
    NConfigProvider,
    NMessageProvider,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NInput,
    NSelect,
    NSplit,
    NFlex,
    NIcon,
    NInputNumber,
    NPopover,
    NTag,
    NModal,
    NInput,
    NTabs,
    NTabPane,
    NDropdown,
    NSpin,
  ],
})

const app = createApp(App)
app.use(naive)
app.mount("#app")

if (!!import.meta.env.PUBLIC_ICONIFY_URL) {
  addAPIProvider("", {
    resources: [import.meta.env.PUBLIC_ICONIFY_URL],
  })
}
