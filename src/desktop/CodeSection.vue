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
 * trace 末尾停在 raw_input 即说明输入不足
 * （pg_logger 在缺输入时会立刻 done=True，trace 中至多只有 1 个 raw_input 事件，
 * 所以不能用计数对比，只能看末尾）
 */
function endsAtRawInput(debugData: any): boolean {
  const trace = debugData?.trace
  if (!trace?.length) return false
  return trace[trace.length - 1].event === "raw_input"
}

async function handleDebug() {
  const inputs = input.value
    ? input.value.split("\n").filter((line) => line.trim() !== "")
    : []

  let res
  try {
    res = await debug(code.value, inputs)
  } catch (err: any) {
    message.error(`调试请求失败: ${err?.message ?? err}`)
    return
  }

  debugData.value = res.data

  if (endsAtRawInput(res.data)) {
    message.warning("程序需要更多输入，请在输入框补全后重新点击调试")
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
