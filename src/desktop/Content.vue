<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import {
  code,
  size,
  init,
  input,
  output,
  reset,
  clearInput,
  showStatus,
} from "../composables/code"
import { showAnalyse, analyse } from "../composables/analyse"
import CodeEditor from "../components/CodeEditor.vue"
import { computed, onMounted } from "vue"
import { useMessage } from "naive-ui"

onMounted(init)

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
            <CodeEditor label="输入框" :font-size="size" v-model="input">
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
              label="输出框"
              v-model="output"
              readonly
              :font-size="size"
            >
              <template #actions>
                <n-popover v-if="showStatus" trigger="click">
                  <template #trigger>
                    <n-button quaternary type="error" @click="showAnalyse">
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
