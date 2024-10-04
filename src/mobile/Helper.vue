<script lang="ts" setup>
import { computed } from "vue"
import { code } from "../composables/code"
import { cSymbols, insertText, pythonSymbols, getText } from "../composables/helper"

function insert(text: string) {
  insertText.value = text
}

const texts = computed(
  () => ({ c: cSymbols, python: pythonSymbols })[code.language],
)
</script>
<template>
  <n-flex align="center" class="container" wrap>
    <span>编程助手</span>
    <n-button
      secondary
      v-for="it in texts"
      :key="it"
      size="small"
      @click="insert(it)"
    >
      {{ getText(it) }}
    </n-button>
  </n-flex>
</template>
<style scoped>
.container {
  padding: 0 10px;
}
</style>
