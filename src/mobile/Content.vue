<script lang="ts" setup>
import CodeEditor from "../components/CodeEditor.vue"
import { code, input, output, size } from "../composables/code"
import { tab } from "../composables/tab"
import { Tab } from "../types"
import ThemeButton from "../components/ThemeButton.vue"
import SelectLanguage from "../components/SelectLanguage.vue"

function onChange(v: Tab) {
  tab.value = v
}

function changeSize(v: number) {
  if (v > 40 || v < 20) return
  size.value = v
}
</script>
<template>
  <n-layout-content>
    <n-tabs
      pane-style="height: calc(100vh - 111px)"
      type="segment"
      :value="tab"
      @update:value="onChange"
    >
      <n-tab-pane name="code" tab="代码">
        <CodeEditor
          v-model:model-value="code.value"
          :language="code.language"
          :font-size="size"
        />
      </n-tab-pane>
      <n-tab-pane name="input" tab="输入">
        <CodeEditor v-model:model-value="input" :font-size="size" />
      </n-tab-pane>
      <n-tab-pane name="output" tab="输出">
        <CodeEditor v-model:model-value="output" readonly :font-size="size" />
      </n-tab-pane>
      <n-tab-pane name="setting" tab="设置">
        <n-flex size="large" vertical class="setting">
          <n-flex align="center">
            <span>主题</span>
            <ThemeButton />
          </n-flex>
          <n-flex align="center">
            <span>语言</span>
            <SelectLanguage />
          </n-flex>
          <n-flex align="center">
            <span>字号</span>
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
</style>