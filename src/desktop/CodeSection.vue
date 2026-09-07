<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import CodeEditor from "../components/CodeEditor.vue"
import DebugModal from "../components/DebugModal.vue"
import { code, format, reset, size } from "../composables/code"
import { debugLoading, startDebug } from "../composables/debug"

const message = useMessage()

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

async function handleFormat() {
  try {
    await format()
    message.success("代码已整理")
  } catch (err: any) {
    message.error(
      `整理失败: ${err?.response?.data?.detail ?? err?.message ?? "未知错误"}`,
    )
  }
}

async function handleDebug() {
  const result = await startDebug()
  if (!result.ok) message[result.level](result.message)
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
      <n-button quaternary @click="handleFormat">整理</n-button>
      <n-button quaternary @click="reset">清空</n-button>
      <n-button
        v-if="code.language === 'python'"
        quaternary
        type="error"
        :loading="debugLoading"
        :disabled="!code.value || debugLoading"
        @click="handleDebug"
      >
        调试
      </n-button>
    </template>
  </CodeEditor>

  <DebugModal />
</template>
