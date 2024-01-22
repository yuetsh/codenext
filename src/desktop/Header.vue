<script setup lang="ts">
import { type SelectOption } from "naive-ui"
import { useDark, useToggle } from "@vueuse/core"
import Play from "../icons/Play.vue"
import { code, size, run, loading } from "../composables/code"

const isDark = useDark()
const toggleDark = useToggle(isDark)

const languages: SelectOption[] = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
]
</script>

<template>
  <n-layout-header bordered class="header">
    <n-flex justify="space-between" align="center">
      <div class="title">徐越的自测猫</div>
      <n-flex>
        <n-button @click="toggleDark()">
          {{ isDark ? "浅色" : "深色" }}
        </n-button>
        <n-input-number
          v-model:value="size"
          class="fontSize"
          placeholder=""
          :min="20"
          :max="40"
          :step="2"
        >
          <template #prefix>字号</template>
        </n-input-number>
        <n-select
          class="select"
          placeholder=""
          :options="languages"
          v-model:value="code.language"
        />
        <n-button type="primary" @click="run" :loading="loading">
          <template #icon>
            <n-icon>
              <Play />
            </n-icon>
          </template>
          运行
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
.fontSize {
  width: 110px;
}
</style>
