<script lang="ts" setup>
import {
  add,
  download,
  files,
  onChange,
  remove,
  reset,
  run,
} from "../composables/file"
</script>
<template>
  <n-flex vertical>
    <n-flex>
      <n-button @click="reset">清空</n-button>
      <n-button @click="add(1)">增加1个</n-button>
      <n-button @click="add(5)">增加5个</n-button>
      <n-button @click="run">先运行</n-button>
      <n-button @click="download">再下载</n-button>
    </n-flex>
    <n-flex v-for="(it, index) in files" :key="index">
      <n-flex vertical class="testcase">
        <span>{{ index + 1 }}.in</span>
        <n-input
          type="textarea"
          v-model:value="it.in"
          @update:value="(v) => onChange(v, index, 'in')"
        />
      </n-flex>
      <n-flex vertical class="testcase">
        <span>{{ index + 1 }}.out</span>
        <n-input
          type="textarea"
          v-model:value="it.out"
          @update:value="(v) => onChange(v, index, 'out')"
          :status="it.error ? 'error' : 'success'"
        />
      </n-flex>
      <n-button :disabled="files.length == 1" @click="remove(index)">
        删除
      </n-button>
    </n-flex>
  </n-flex>
</template>
<style scoped>
.testcase {
  flex: 1;
}
</style>
