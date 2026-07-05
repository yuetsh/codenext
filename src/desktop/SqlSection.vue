<script lang="ts" setup>
import type { DataTableColumns } from "naive-ui"
import { computed, h, watch } from "vue"
import { output, status } from "../composables/code"
import { parseResult, selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import { Status } from "../types"
import OutputSection from "./OutputSection.vue"

const selectedTable = computed(
  () =>
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0],
)

// 列头展示：列名 + 暗色小字的数据类型（仅取基础类型，去掉约束如 NOT NULL）
function baseType(type: string): string {
  return type.trim().split(/\s+/)[0]
}

function renderColumnTitle(name: string, type?: string) {
  return () =>
    h("span", null, [
      name,
      type
        ? h(
            "span",
            {
              style:
                "font-size:12px;opacity:0.55;margin-left:4px;font-weight:normal;",
            },
            baseType(type),
          )
        : null,
    ])
}

const columnTypeMap = computed<Record<string, string>>(() =>
  Object.fromEntries(
    selectedTable.value.columns.map((column) => [column.name, column.type]),
  ),
)

const tableColumns = computed<DataTableColumns>(() =>
  selectedTable.value.columns.map((column) => ({
    title: renderColumnTitle(column.name, column.type),
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

const result = computed(() => parseResult(output.value))

const resultColumns = computed<DataTableColumns>(() =>
  result.value.columns.map((name) => ({
    title: renderColumnTitle(name, columnTypeMap.value[name]),
    key: name,
  })),
)

const resultRows = computed(() => result.value.rows)

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
        <div class="panel-title">
          原始数据（{{ selectedTable.label }} · {{ selectedTable.tableName }}）
        </div>
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
        <div class="panel-title">运行结果</div>
        <n-data-table
          size="small"
          :bordered="false"
          :columns="resultColumns"
          :data="resultRows"
          :row-key="(row: any) => row.__key"
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
