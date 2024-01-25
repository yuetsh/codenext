<script setup lang="ts">
import { size, run, loading } from "../composables/code"
import ThemeButton from "../components/ThemeButton.vue"
import SelectLanguage from "../components/SelectLanguage.vue"
</script>

<template>
  <n-layout-header bordered class="header">
    <n-flex justify="space-between" align="center">
      <div class="title">徐越的自测猫</div>
      <n-flex>
        <ThemeButton />
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
        <SelectLanguage />
        <n-button type="primary" @click="run" :disabled="loading">
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
  box-sizing: border-box;
}
.title {
  font-size: 20px;
}
.fontSize {
  width: 110px;
}
</style>
