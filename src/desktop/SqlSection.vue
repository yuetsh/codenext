<script lang="ts" setup>
import { computed, watch } from "vue"
import CodeEditor from "../components/CodeEditor.vue"
import { output } from "../composables/code"
import { selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import OutputSection from "./OutputSection.vue"

const selectedTable = computed(
  () =>
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0],
)

watch(selectedTableId, () => {
  output.value = ""
})
</script>

<template>
  <n-split direction="vertical" :default-size="1 / 3" :min="1 / 5" :max="3 / 5">
    <template #1>
      <CodeEditor
        :model-value="selectedTable.setupSql"
        language="sql"
        readonly
        label="表结构与初始数据"
      />
    </template>
    <template #2>
      <OutputSection />
    </template>
  </n-split>
</template>
