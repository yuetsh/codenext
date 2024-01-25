<script lang="ts" setup>
import CodeEditor from "../components/CodeEditor.vue"
import { code, input, output, size, status } from "../composables/code"
import { Status } from "../types"
import { tab } from "../composables/tab"
import { Tab } from "../types"
import ThemeButton from "../components/ThemeButton.vue"
import SelectLanguage from "../components/SelectLanguage.vue"
import Helper from "./Helper.vue"
import { useThemeVars } from "naive-ui"
import { computed } from "vue"
import { EditorView } from "@codemirror/view"
import { insertText } from "../composables/helper"
import { whenever } from "@vueuse/core"
import { onUnmounted } from "vue"
import { watch } from "vue"

let codeEditor: EditorView | null = null

function onChangeTab(v: Tab) {
  tab.value = v
}

function changeSize(v: number) {
  if (v > 40 || v < 20) return
  size.value = v
}
const theme = useThemeVars()
const color = computed(() => {
  if (status.value === Status.NotStarted) return theme.value.textColorBase
  else if (status.value === Status.Accepted) return theme.value.primaryColor
  else return theme.value.warningColor
})

function onReady(view: EditorView) {
  codeEditor = view
}

whenever(insertText, (text: string) => {
  if (!codeEditor) return
  codeEditor.dispatch(codeEditor.state.replaceSelection(text))
  // 处理换行或者移动光标
  let delta = 0
  const len = text.length
  // "", [], ()
  if (['"', "]", ")"].includes(text[len - 1])) delta = 1
  // {}
  if (text === "{}") delta = 1
  // if : elif :
  if (text.slice(len - 2) === " :") delta = 1
  // range():
  if (text.slice(len - 2) === "):") delta = 2
  // printf(""); scanf("");
  if (text.slice(len - 3) === '");') delta = 3
  if (text === "if () {}") delta = 4
  if (delta > 0) {
    const pos = codeEditor.state.selection.main.head - delta
    codeEditor.dispatch({
      selection: {
        anchor: pos,
        head: pos,
      },
    })
  }
  codeEditor.focus() // 保持光标选中状态
  insertText.value = ""
})

onUnmounted(() => {
  codeEditor = null
})
</script>
<template>
  <n-layout-content>
    <n-tabs
      pane-style="height: calc(100vh - 111px)"
      type="segment"
      :value="tab"
      @update:value="onChangeTab"
    >
      <n-tab-pane name="code" tab="代码">
        <n-flex vertical class="wrapper">
          <Helper />
          <CodeEditor
            v-model:model-value="code.value"
            :language="code.language"
            :font-size="size"
            @ready="onReady"
          />
        </n-flex>
      </n-tab-pane>
      <n-tab-pane name="input" tab="输入">
        <CodeEditor v-model:model-value="input" :font-size="size" />
      </n-tab-pane>
      <n-tab-pane name="output">
        <template #tab>
          <span :style="{ color }">输出</span>
        </template>
        <CodeEditor v-model:model-value="output" readonly :font-size="size" />
      </n-tab-pane>
      <n-tab-pane name="setting" tab="设置">
        <n-flex size="large" vertical class="setting">
          <n-flex align="center">
            <span class="label">主题</span>
            <ThemeButton />
          </n-flex>
          <n-flex align="center">
            <span class="label">语言</span>
            <SelectLanguage />
          </n-flex>
          <n-flex align="center">
            <span class="label">字号</span>
            <n-flex align="center">
              <span :style="{ 'font-size': size + 'px' }">{{ size }}</span>
              <n-button @click="changeSize(size - 2)" :disabled="size === 20">
                调小
              </n-button>
              <n-button @click="changeSize(size + 2)" :disabled="size === 40">
                调大
              </n-button>
            </n-flex>
          </n-flex>
        </n-flex>
      </n-tab-pane>
    </n-tabs>
  </n-layout-content>
</template>
<style scoped>
.setting {
  padding: 0 12px;
}
.label {
  font-size: 16px;
}
.wrapper {
  height: 100%;
}
</style>
