<template>
  <Header />
  <Content />
  <n-modal
    v-model:show="file"
    preset="card"
    style="width: 600px"
    :mask-closable="false"
    title="测试用例文件生成器"
  >
    <File />
  </n-modal>
  <n-modal
    v-model:show="query"
    preset="card"
    style="width: 600px"
    :mask-closable="false"
    title="代码预设"
  >
    <Query />
  </n-modal>
</template>
<script lang="ts" setup>
import { useMagicKeys, whenever } from "@vueuse/core"
import { ref } from "vue"
import { run } from "../composables/code"
import Content from "./Content.vue"
import File from "./File.vue"
import Header from "./Header.vue"
import Query from "./Query.vue"

const file = ref(false)
const query = ref(false)

const { alt_shift_p, ctrl_shift_p, ctrl_shift_z, ctrl_shift_m } = useMagicKeys()

whenever(alt_shift_p, () => {
  file.value = true
})
whenever(ctrl_shift_p, () => {
  file.value = true
})
whenever(ctrl_shift_z, () => {
  file.value = true
})

whenever(ctrl_shift_m, () => {
  query.value = true
})

const { ctrl_s } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === "s" && e.type === "keydown") e.preventDefault()
  },
})

const { ctrl_r } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === "r" && e.type === "keydown") e.preventDefault()
  },
})

const { f5 } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key === "F5" && e.type === "keydown") e.preventDefault()
  },
})

whenever(ctrl_s, () => {})
whenever(ctrl_r, () => {})
whenever(f5, run)
</script>
