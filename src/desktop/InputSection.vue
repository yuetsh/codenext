<script lang="ts" setup>
import { computed } from "vue"
import CodeEditor from "../components/CodeEditor.vue"
import { clearInput, input, size } from "../composables/code"

const showInputClearBtn = computed(() => !!input.value)
</script>

<template>
  <CodeEditor
    icon="streamline-emojis:four-leaf-clover"
    label="输入框"
    :font-size="size"
    v-model="input"
  >
    <template #actions>
      <n-button
        quaternary
        type="primary"
        @click="clearInput"
        v-if="showInputClearBtn"
      >
        清空
      </n-button>
    </template>
  </CodeEditor>
</template>
