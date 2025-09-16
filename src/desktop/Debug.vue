<template>
  <div class="loading" v-if="loading">正在加载中...（第一次打开会有点慢）</div>
  <div v-if="!loading">
    <p class="tip">提醒：</p>
    <p>1. 点击【下一步】开始调试（也可以拖动进度条）</p>
    <p>
      2. 点击
      <n-button text type="primary" @click="close">修改代码</n-button>
      完成修改后可再次调试
    </p>
  </div>
  <iframe
    width="100%"
    height="360"
    frameborder="0"
    :src="src"
    ref="main"
  ></iframe>
</template>
<script lang="ts" setup>
import qs from "query-string"
import { onMounted, ref, useTemplateRef } from "vue"
import { code, debug } from "../composables/code"
import { useDark } from "@vueuse/core"

const src = ref("")
const loading = ref(true)
const main = useTemplateRef("main")
const isDark = useDark()

onMounted(() => {
  const url = import.meta.env.PUBLIC_PYVIZ_URL
  const base = url + "/iframe-embed.html"

  const part1 = qs.stringify({
    code: code.value,
    codeDivWidth: 300,
  })
  const part2 =
    "&cumulative=false&curInstr=0&heapPrimitives=nevernest&origin=opt-frontend.js&py=3&rawInputLstJSON=%5B%5D&textReferences=true&"
  const part3 = qs.stringify({
    dark: isDark.value,
  })
  const query = part1 + part2 + part3
  src.value = base + "#" + query

  main.value!.addEventListener("load", () => {
    loading.value = false
  })
})

function close() {
  debug.value = false
}
</script>
<style scoped>
.loading {
  font-size: 16px;
}

.tip {
  margin-top: 0;
}
</style>
