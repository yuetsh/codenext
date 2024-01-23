import { createApp } from "vue"
import {
  create,
  NButton,
  NConfigProvider,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NSelect,
  NSplit,
  NFlex,
  NIcon,
  NMessageProvider,
  NInputNumber,
  NPopover,
  NTag,
  NModal,
  NTabs,
  NTabPane,
  NDropdown,
} from "naive-ui"
import App from "./App.vue"
import "normalize.css"

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
  ],
})

const app = createApp(App)
app.use(naive)
app.mount("#app")
