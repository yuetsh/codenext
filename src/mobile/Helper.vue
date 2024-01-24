<script lang="ts" setup>
import { insertText } from "../composables/helper"

function insert(text: string) {
  insertText.value = text
}
</script>
<template>
  <n-flex align="center" class="container">
    <span>编程助手</span>
    <n-button size="small" @click="insert(':')">:</n-button>
    <n-button size="small" @click="insert('=')">=</n-button>
    <n-button size="small" @click="insert('print')">print</n-button>
    <n-button size="small" @click="insert('input')">input</n-button>
  </n-flex>
</template>
<style scoped>
.container {
  margin-bottom: 10px;
}
</style>
