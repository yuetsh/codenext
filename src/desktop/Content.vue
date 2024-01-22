<script lang="ts" setup>
import {
  code,
  init,
  input,
  output,
  changeCode,
  changeInput,
} from "../composables/code"
import CodeEditor from "../components/CodeEditor.vue"
import { onMounted } from "vue"

onMounted(init)
</script>

<template>
  <n-layout-content class="container">
    <n-split direction="horizontal" :min="1 / 3" :max="4 / 5">
      <template #1>
        <CodeEditor
          label="代码区"
          v-model="code.value"
          @update:model-value="changeCode"
          :language="code.language"
        />
      </template>
      <template #2>
        <n-split
          direction="vertical"
          :default-size="1 / 3"
          :min="1 / 5"
          :max="3 / 5"
        >
          <template #1>
            <CodeEditor
              label="输入框"
              v-model="input"
              @update:model-value="changeInput"
            />
          </template>
          <template #2>
            <CodeEditor label="输出框" v-model="output" readonly />
          </template>
        </n-split>
      </template>
    </n-split>
  </n-layout-content>
</template>

<style scoped>
.container {
  height: calc(100vh - 60px);
}
</style>
