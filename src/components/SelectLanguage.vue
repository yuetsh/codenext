<script lang="ts" setup>
import { code } from "../composables/code"
import type { SelectOption } from "naive-ui"

const languages: SelectOption[] = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
]
</script>
<template>
  <n-select
    class="select"
    placeholder=""
    :options="languages"
    v-model:value="code.language"
  />
</template>
<style scoped>
.select {
  width: 100px;
}
</style>