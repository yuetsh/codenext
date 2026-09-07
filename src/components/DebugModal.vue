<script lang="ts" setup>
import DebugPanel from "./DebugPanel.vue"
import { isMobile } from "../composables/breakpoints"
import { closeDebug, debugData, showDebugModal } from "../composables/debug"

// 用 update:show 而不是 @close：关闭按钮、Esc、遮罩点击都会走到这里
function onUpdateShow(value: boolean) {
  if (!value) closeDebug()
}
</script>

<template>
  <n-modal
    :show="showDebugModal"
    preset="card"
    title="调试"
    size="large"
    :mask-closable="false"
    :auto-focus="false"
    :style="
      isMobile ? { width: '96vw' } : { width: '80vw', maxWidth: '1000px' }
    "
    @update:show="onUpdateShow"
  >
    <DebugPanel :initial-debug-data="debugData" />
  </n-modal>
</template>
