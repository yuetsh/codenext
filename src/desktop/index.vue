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

const { alt_shift_p, ctrl_shift_p, ctrl_shift_z } = useMagicKeys()

const show = ref(false)

whenever(alt_shift_p, () => {
  show.value = true
})
whenever(ctrl_shift_p, () => {
  show.value = true
})
whenever(ctrl_shift_z, () => {
  show.value = true
})
</script>
