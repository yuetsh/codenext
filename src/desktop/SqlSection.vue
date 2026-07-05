<script lang="ts" setup>
import type { DataTableColumns } from "naive-ui"
import { computed, watch } from "vue"
import { output, status } from "../composables/code"
import { parseResultRows, selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import { Status } from "../types"
import OutputSection from "./OutputSection.vue"

const selectedTable = computed(
  () =>
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0],
)

const tableColumns = computed<DataTableColumns>(() =>
  selectedTable.value.columns.map((column) => ({
    title: column.name,
    key: column.name,
  })),
)

const initialRows = computed(() =>
  selectedTable.value.rows.map((row) =>
    Object.fromEntries(
      selectedTable.value.columns.map((column, index) => [
        column.name,
        row[index],
      ]),
    ),
  ),
)

const resultRows = computed(() =>
  parseResultRows(output.value, selectedTable.value.columns),
)

watch(selectedTableId, () => {
  output.value = ""
  status.value = Status.NotStarted
})
</script>

<template>
  <n-split
    direction="horizontal"
    :default-size="1 / 2"
    :min="1 / 4"
    :max="3 / 4"
  >
    <template #1>
      <div class="table-panel">
        <div class="panel-title">原始数据（{{ selectedTable.label }}）</div>
        <n-data-table
          size="small"
          :bordered="false"
          :columns="tableColumns"
          :data="initialRows"
          :row-key="(row: any) => row.id"
        />
      </div>
    </template>
    <template #2>
      <div class="table-panel" v-if="status === Status.Accepted">
        <div class="panel-title">运行后数据</div>
        <n-data-table
          size="small"
          :bordered="false"
          :columns="tableColumns"
          :data="resultRows"
          :row-key="(row: any) => row.id"
        />
      </div>
      <OutputSection v-else />
    </template>
  </n-split>
</template>

<style scoped>
.table-panel {
  height: 100%;
  overflow: auto;
  padding: 12px 20px;
  box-sizing: border-box;
}
.panel-title {
  font-size: 16px;
  margin-bottom: 8px;
}
</style>
