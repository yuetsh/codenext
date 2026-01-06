<script lang="ts" setup>
import { ref } from "vue"
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import CodeEditor from "../components/CodeEditor.vue"
import DebugPanel from "../components/DebugPanel.vue"
import { code, input, reset, size } from "../composables/code"
import { debug } from "../api"

const message = useMessage()

const showDebugModal = ref(false)
const debugData = ref<any>(null)

function closeDebug() {
  showDebugModal.value = false
  debugData.value = null
}

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

/**
 * 检查调试数据是否需要输入但用户没有提供足够的输入
 */
function needsInputButNotProvided(
  debugData: any,
  providedInputs: string[],
): boolean {
  if (!debugData?.trace || debugData.trace.length === 0) {
    return false
  }

  const lastStep = debugData.trace[debugData.trace.length - 1]
  // 如果最后一步是 raw_input，说明程序在等待输入，用户提供的输入不足
  if (lastStep.event === "raw_input") {
    // 统计 trace 中所有的 raw_input 事件数量（程序需要的输入数量）
    const requiredInputCount = debugData.trace.filter(
      (step: any) => step.event === "raw_input",
    ).length

    // 如果用户提供的输入数量不足，返回 true
    return providedInputs.length < requiredInputCount
  }

  return false
}

async function handleDebug() {
  const inputs = input.value
    ? input.value.split("\n").filter((line) => line.trim() !== "")
    : []
  const res = await debug(code.value, inputs)
  debugData.value = res.data

  // 检查是否需要输入但用户没有提供足够的输入
  if (needsInputButNotProvided(res.data, inputs)) {
    message.warning("程序需要输入，请在输入框输入内容后重新点击调试按钮")
    return
  }

  showDebugModal.value = true
}
</script>

<template>
  <CodeEditor
    label="代码区"
    icon="streamline-emojis:lemon"
    :font-size="size"
    v-model="code.value"
    :language="code.language"
  >
    <template #actions>
      <n-button quaternary type="primary" @click="copy">复制</n-button>
      <n-button quaternary @click="reset">清空</n-button>
      <n-button
        v-if="code.language === 'python'"
        quaternary
        type="error"
        :disabled="!code.value"
        @click="handleDebug"
      >
        调试
      </n-button>
    </template>
  </CodeEditor>

  <n-modal
    v-model:show="showDebugModal"
    preset="card"
    title="调试"
    size="large"
    :mask-closable="false"
    :auto-focus="false"
    @close="closeDebug"
    style="width: 80vw; max-width: 1000px"
  >
    <DebugPanel :initial-debug-data="debugData" @close="closeDebug" />
  </n-modal>
</template>
