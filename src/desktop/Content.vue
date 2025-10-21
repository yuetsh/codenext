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
  max-height: 300px;
  overflow: auto;
}
</style>
