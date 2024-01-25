<template>
  <Header />
  <Content />
  <n-modal
    v-model:show="show"
    preset="card"
    style="width: 600px"
    :mask-closable="false"
    title="测试用例文件生成器"
  >
    <File />
  </n-modal>
</template>
<script lang="ts" setup>
import Header from "./Header.vue"
import Content from "./Content.vue"
import File from "./File.vue"
import { useMagicKeys, whenever } from "@vueuse/core"
import { ref } from "vue"
import { run } from "../composables/code"

const show = ref(false)

const { alt_shift_p, ctrl_shift_p, ctrl_shift_z } = useMagicKeys()

whenever(alt_shift_p, () => {
  show.value = true
})
whenever(ctrl_shift_p, () => {
  show.value = true
})
whenever(ctrl_shift_z, () => {
  show.value = true
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
