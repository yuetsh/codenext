<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import DebugEditor from "../components/DebugEditor.vue"
import { code, input, reset, size } from "../composables/code"
import { debug } from "../api"

const message = useMessage()

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}

async function handleDebug() {
  const inputs = input.value ? input.value.split("\n") : []
  const res = await debug(code.value, inputs)
  console.log(res.data)
}
</script>

<template>
  <DebugEditor
    label="代码区"
    icon="streamline-emojis:lemon"
    :font-size="size"
    v-model="code.value"
    :language="code.language"
  >
    <template #actions>
      <n-button
        quaternary
        type="error"
        :disabled="!code.value"
        @click="handleDebug"
      >
        调试
      </n-button>
      <n-button quaternary type="primary" @click="copy">复制</n-button>
      <n-button quaternary @click="reset">清空</n-button>
    </template>
  </DebugEditor>
</template>
