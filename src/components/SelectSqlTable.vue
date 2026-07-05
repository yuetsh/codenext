<script lang="ts" setup>
import type { SelectOption } from "naive-ui"
import { computed } from "vue"
import { selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"

const tableOptions = computed<SelectOption[]>(() =>
  sqlTables.map((table) => ({ value: table.id, label: table.label })),
)
</script>
<template>
  <n-select
    class="select"
    :options="tableOptions"
    v-model:value="selectedTableId"
  />
</template>
<style scoped>
.select {
  width: 125px;
}
</style>
