<script lang="ts" setup>
import copyTextToClipboard from "copy-text-to-clipboard"
import { useMessage } from "naive-ui"
import { computed, watch, useTemplateRef } from "vue"
import { marked } from "marked"
import { debug as debugApi } from "../api"
// @ts-ignore
import * as Sk from "skulpt"
import CodeEditor from "../components/CodeEditor.vue"
import {
  analysis,
  loading,
  getAIAnalysis,
  showAnalysis,
} from "../composables/analysis"
import {
  clearInput,
  code,
  debug,
  input,
  output,
  reset,
  size,
  status,
  turtleRunId,
} from "../composables/code"
import { Status } from "../types"

const showInputClearBtn = computed(() => !!input.value)
const message = useMessage()

function copy() {
  copyTextToClipboard(code.value)
  message.success("已经复制好了")
}
function handleDebug() {
  debug.value = true
}

async function handleDebugNew() {
  const inputs = input.value ? input.value.split("\n") : []
  const res = await debugApi(code.value, inputs)
  console.log(res.data)
}

const turtleCanvas = useTemplateRef("turtle")

function builtinRead(x: any) {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][x] === undefined
  )
    throw "文件没有找到：'" + x + "'"
  return Sk.builtinFiles["files"][x]
}

function runSkulptTurtle() {
  const canvas = turtleCanvas.value
  if (!canvas) return
  canvas.innerHTML = ""
  Sk.configure({
    output: console.log,
    read: builtinRead,
    inputfun: function () {
      return input.value
    },
    __future__: Sk.python3,
  })
  Sk.TurtleGraphics = {
    target: canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  }
  Sk.misceval
    .asyncToPromise(function () {
      return Sk.importMainWithBody("<stdin>", false, code.value, true)
    })
    .catch((err: any) => {
      output.value += String(err)
    })
}

watch(turtleRunId, () => runSkulptTurtle())
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
            <n-button
              quaternary
              type="error"
              :disabled="!code.value"
              v-if="code.language === 'python'"
              @click="handleDebug"
            >
              调试
            </n-button>

            <n-button
              quaternary
              type="error"
              :disabled="!code.value"
              v-if="false && code.language === 'python'"
              @click="handleDebugNew"
            >
              调试（新）
            </n-button>
            <n-button quaternary type="primary" @click="copy">复制</n-button>
            <n-button quaternary @click="reset">清空</n-button>
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
              v-if="code.language !== 'turtle'"
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
                <n-tag v-if="showAnalysis" type="warning">运行失败</n-tag>
                <n-popover v-if="showAnalysis" trigger="click" placement="left">
                  <template #trigger>
                    <n-button quaternary type="error" @click="getAIAnalysis">
                      推测原因
                    </n-button>
                  </template>
                  <n-spin :show="loading">
                    <div
                      class="analysisPanel"
                      v-html="marked.parse(analysis)"
                    ></div>
                  </n-spin>
                </n-popover>
              </template>
            </CodeEditor>
            <div v-else ref="turtle" class="canvas"></div>
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

.canvas {
  width: 100%;
  height: 100%;
}

.analysisPanel {
  width: 400px;
  min-height: 60px;
  max-height: calc(100vh - 200px);
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #374151;
}

/* 简洁 Markdown 样式 */
.analysisPanel :deep(h1),
.analysisPanel :deep(h2),
.analysisPanel :deep(h3),
.analysisPanel :deep(h4),
.analysisPanel :deep(h5),
.analysisPanel :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #1f2937;
}

.analysisPanel :deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.analysisPanel :deep(h2) {
  font-size: 1.3em;
  color: #374151;
}

.analysisPanel :deep(h3) {
  font-size: 1.1em;
  color: #4b5563;
}

.analysisPanel :deep(p) {
  margin: 12px 0;
  color: #374151;
  font-size: 14px;
}

.analysisPanel :deep(ul),
.analysisPanel :deep(ol) {
  margin: 12px 0;
  padding-left: 20px;
}

.analysisPanel :deep(li) {
  margin: 4px 0;
  color: #374151;
}

.analysisPanel :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.analysisPanel :deep(em) {
  font-style: italic;
  color: #6b7280;
}

/* 简洁代码块样式 */
.analysisPanel :deep(pre) {
  background: #f8f9fa;
  color: #24292f;
  padding: 16px;
  border-radius: 6px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #d0d7de;
}

.analysisPanel :deep(code) {
  background: #f1f3f4;
  color: #d63384;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.analysisPanel :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

/* 简洁引用块样式 */
.analysisPanel :deep(blockquote) {
  border-left: 4px solid #d0d7de;
  background: #f6f8fa;
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  color: #656d76;
  font-style: italic;
}

/* 简洁表格样式 */
.analysisPanel :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d0d7de;
}

.analysisPanel :deep(th),
.analysisPanel :deep(td) {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #d0d7de;
}

.analysisPanel :deep(th) {
  background: #f6f8fa;
  font-weight: 600;
  color: #24292f;
}

.analysisPanel :deep(td) {
  color: #24292f;
}

/* 简洁链接样式 */
.analysisPanel :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.analysisPanel :deep(a:hover) {
  color: #0969da;
  text-decoration: underline;
}

/* 简洁分割线 */
.analysisPanel :deep(hr) {
  border: none;
  height: 1px;
  background: #d0d7de;
  margin: 16px 0;
}
</style>
