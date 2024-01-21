<script setup lang="ts">
import { useMessage, type SelectOption } from "naive-ui"
import { useDark, useToggle } from "@vueuse/core"
import Play from "../icons/Play.vue"
import {
  code,
  copy,
  reset,
  run,
  loading,
  changeLanguage,
} from "../composables/code"

const message = useMessage()
const isDark = useDark()
const toggleDark = useToggle(isDark)

const languages: SelectOption[] = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
]

function copyAndNotify() {
  copy()
  message.success("已经复制好了")
}
</script>

<template>
  <n-layout-header bordered class="header">
    <n-flex justify="space-between" align="center">
      <div class="title">徐越的自测猫</div>
      <n-flex>
        <n-button @click="toggleDark()">
          {{ isDark ? "浅色" : "深色" }}
        </n-button>
        <n-button @click="reset">重置</n-button>
        <n-button @click="copyAndNotify">复制</n-button>
        <n-select
          class="select"
          :options="languages"
          v-model:value="code.language"
          @update:value="changeLanguage"
        />
        <n-button type="primary" @click="run" :loading="loading">
          <template #icon>
            <n-icon>
              <Play />
            </n-icon>
          </template>
          运行 (F5)
        </n-button>
      </n-flex>
    </n-flex>
  </n-layout-header>
</template>

<style scoped>
.header {
  height: 60px;
  padding: 12px;
}
.title {
  font-size: 20px;
}
.select {
  width: 100px;
}
</style>
