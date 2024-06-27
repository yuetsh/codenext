<script lang="ts" setup>
import { useMessage, type DropdownOption } from "naive-ui"
import { code, loading, reset, run, share } from "../composables/code"
import { tab } from "../composables/tab"
import copyTextToClipboard from "copy-text-to-clipboard"
import { Icon } from "@iconify/vue"

const message = useMessage()
function switchAndRun() {
  tab.value = "output"
  run()
}

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

function handleShare() {
  share()
  message.success("分享链接已复制")
}

const menu: DropdownOption[] = [
  { label: "复制", key: "copy", props: { onClick: copy } },
  { label: "重置", key: "reset", props: { onClick: reset } },
  { label: "分享", key: "share", props: { onClick: handleShare } },
]
</script>
<template>
  <n-layout-header class="container" bordered>
    <n-flex justify="space-between" align="center">
      <n-flex align="center">
        <Icon icon="streamline-emojis:cat" :width="30" :height="30"></Icon>
        <div class="title">徐越的自测猫</div>
      </n-flex>
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
