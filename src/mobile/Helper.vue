<script lang="ts" setup>
import { cTexts, insertText, pythonTexts } from "../composables/helper"
import { code } from "../composables/code"
import { computed } from "vue"

function insert(text: string) {
  insertText.value = text
}

const texts = computed(
  () => ({ c: cTexts, python: pythonTexts })[code.language],
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
      {{ it }}
    </n-button>
  </n-flex>
</template>
<style scoped>
.container {
  padding: 0 10px;
}
</style>
