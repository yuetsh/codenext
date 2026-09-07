<script lang="ts" setup>
import { Icon } from "@iconify/vue"
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage, type DropdownOption } from "naive-ui"
import { computed } from "vue"
import { code, loading, reset, run, share } from "../composables/code"
import { debugLoading, startDebug } from "../composables/debug"
import { tab } from "../composables/tab"

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
  if (share()) {
    message.success("分享链接已复制")
  } else {
    message.error("复制失败，请检查浏览器剪贴板权限")
  }
}

async function handleDebug() {
  const result = await startDebug()
  if (!result.ok) message[result.level](result.message)
}

const menu = computed<DropdownOption[]>(() => {
  const options: DropdownOption[] = [
    { label: "复制", key: "copy", props: { onClick: copy } },
    { label: "清空", key: "reset", props: { onClick: reset } },
    { label: "分享", key: "share", props: { onClick: handleShare } },
  ]
  // 调试只支持 Python，跟桌面端的按钮保持一致
  if (code.language === "python") {
    options.push({
      label: debugLoading.value ? "调试中…" : "调试",
      key: "debug",
      disabled: debugLoading.value || !code.value,
      props: { onClick: handleDebug },
    })
  }
  return options
})
</script>
<template>
  <n-layout-header class="container" bordered>
    <n-flex justify="space-between" align="center">
      <n-flex align="center">
        <Icon icon="streamline-emojis:cat" :width="30" :height="30"></Icon>
        <div class="title">自测猫</div>
      </n-flex>
      <n-flex align="center">
        <n-dropdown :options="menu" size="large">
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
