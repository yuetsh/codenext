<script lang="ts" setup>
import { insertText } from "../composables/helper"
import { code } from "../composables/code"
import { computed } from "vue"

function insert(text: string) {
  insertText.value = text
}

const texts = computed(() => {
  if (code.language === "c") return [",", ";", "printf();", "{\n}", "int", "%d"]
  else
    return [
      ":",
      "=",
      "==",
      "print()",
      "input()",
      "if",
      "else",
      "elif",
      "for",
      "in",
      "range",
      "while",
    ]
})
</script>
<template>
  <n-flex align="center" class="container" wrap>
    <span>编程助手</span>
    <n-button v-for="it in texts" :key="it" size="small" @click="insert(it)">
      {{ it }}
    </n-button>
  </n-flex>
</template>
<style scoped>
.container {
  padding: 0 10px;
  margin-bottom: 10px;
}
</style>
