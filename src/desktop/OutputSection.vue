<script lang="ts" setup>
import CodeEditor from "../components/CodeEditor.vue"
import { output, size, status } from "../composables/code"
import { Status } from "../types"
import {
  analysis,
  loading,
  getAIAnalysis,
  showAnalysis,
} from "../composables/analysis"
import AnalysisPanel from "./AnalysisPanel.vue"
</script>

<template>
  <CodeEditor
    icon="streamline-emojis:hibiscus"
    label="输出框"
    v-model="output"
    readonly
    :font-size="size"
  >
    <template #actions>
      <n-tag v-if="status === Status.Accepted" type="success"> 运行成功 </n-tag>
      <n-tag v-if="showAnalysis" type="warning">运行失败</n-tag>
      <n-popover v-if="showAnalysis" trigger="click" placement="left">
        <template #trigger>
          <n-button quaternary type="error" @click="getAIAnalysis">
            推测原因
          </n-button>
        </template>
        <AnalysisPanel :analysis="analysis" :loading="loading" />
      </n-popover>
    </template>
  </CodeEditor>
</template>
