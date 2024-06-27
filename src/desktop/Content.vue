<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import {
  code,
  size,
  input,
  output,
  status,
  reset,
  clearInput,
} from "../composables/code"
import { showAnalyse, analyzeError, analyse } from "../composables/analyse"
import CodeEditor from "../components/CodeEditor.vue"
import { computed } from "vue"
import { useMessage } from "naive-ui"
import { Status } from "../types"

const showInputClearBtn = computed(() => !!input.value)
const message = useMessage()

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}
</script>

<template>
  <n-layout-content class="container">
    <n-split direction="horizontal" :min="1 / 3" :max="4 / 5">
      <template #1>
        <CodeEditor
          label="代码区"
          icon="streamline-emojis:lemon"
          :font-size="size"
          v-model="code.value"
          :language="code.language"
        >
          <template #actions>
            <n-button quaternary type="primary" @click="copy">复制</n-button>
            <n-button quaternary @click="reset">重置</n-button>
          </template>
        </CodeEditor>
      </template>
      <template #2>
        <n-split
          direction="vertical"
          :default-size="1 / 3"
          :min="1 / 5"
          :max="3 / 5"
        >
          <template #1>
            <CodeEditor
              icon="streamline-emojis:four-leaf-clover"
              label="输入框"
              :font-size="size"
              v-model="input"
            >
              <template #actions>
                <n-button
                  quaternary
                  type="primary"
                  @click="clearInput"
                  v-if="showInputClearBtn"
                >
                  清空
                </n-button>
              </template>
            </CodeEditor>
          </template>
          <template #2>
            <CodeEditor
              icon="streamline-emojis:hibiscus"
              label="输出框"
              v-model="output"
              readonly
              :font-size="size"
            >
              <template #actions>
                <n-tag v-if="status === Status.Accepted" type="success">
                  运行成功
                </n-tag>
                <n-tag v-if="showAnalyse" type="warning">运行失败</n-tag>
                <n-popover
                  v-if="showAnalyse && code.language === 'python'"
                  trigger="click"
                >
                  <template #trigger>
                    <n-button quaternary type="error" @click="analyzeError">
                      推测原因
                    </n-button>
                  </template>
                  <template #header v-if="analyse.line > 0">
                    错误在第
                    <n-tag type="error">
                      <b>{{ analyse.line }}</b>
                    </n-tag>
                    行
                  </template>
                  <span v-if="analyse.message">
                    {{ analyse.message }}
                  </span>
                </n-popover>
              </template>
            </CodeEditor>
          </template>
        </n-split>
      </template>
    </n-split>
  </n-layout-content>
</template>

<style scoped>
.container {
  height: calc(100vh - 60px);
}
</style>
