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
  NSpace,
  NSplit,
  NFlex,
  NIcon,
} from "naive-ui"
import App from "./App.vue"
import "normalize.css"

const naive = create({
  components: [
    NButton,
    NConfigProvider,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NSpace,
    NInput,
    NSelect,
    NSplit,
    NFlex,
    NIcon,
  ],
})

const app = createApp(App)
app.use(naive)
app.mount("#app")
