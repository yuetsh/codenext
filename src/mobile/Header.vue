<script lang="ts" setup>
import { useMessage, type DropdownOption } from "naive-ui"
import { random } from "node-emoji"
import { onMounted, ref } from "vue"
import { useIntervalFn } from "@vueuse/core"
import { code, loading, reset, run } from "../composables/code"
import { tab } from "../composables/tab"
import copyTextToClipboard from "copy-text-to-clipboard"

const emoji = ref("")

function getRandomEmoji() {
  emoji.value = random().emoji
}

const message = useMessage()
function switchAndRun() {
  tab.value = "output"
  run()
}

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

const menu: DropdownOption[] = [
  { label: "复制", key: "copy", props: { onClick: copy } },
  { label: "重置", key: "reset", props: { onClick: reset } },
]

onMounted(getRandomEmoji)
useIntervalFn(getRandomEmoji, 5000, { immediate: true })
</script>
<template>
  <n-layout-header class="container" bordered>
    <n-flex justify="space-between" align="center">
      <div @click="getRandomEmoji" class="title">徐越的自测猫 {{ emoji }}</div>
      <n-flex align="center">
        <n-dropdown :options="menu">
          <n-button>操作</n-button>
        </n-dropdown>
        <n-button type="primary" :disabled="loading" @click="switchAndRun">
          运行
        </n-button>
      </n-flex>
    </n-flex>
  </n-layout-header>
</template>
<style scoped>
.container {
  height: 60px;
  padding: 12px;
  box-sizing: border-box;
}
.title {
  font-size: 18px;
}
</style>
