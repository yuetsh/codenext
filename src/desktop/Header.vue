<script setup lang="ts">
import { size, run, loading, share } from "../composables/code"
import ThemeButton from "../components/ThemeButton.vue"
import SelectLanguage from "../components/SelectLanguage.vue"
import { useMessage } from "naive-ui"
import { Icon } from "@iconify/vue"

const message = useMessage()

function handleShare() {
  share()
  message.success("分享链接已复制")
}
</script>

<template>
  <n-layout-header bordered class="header">
    <n-flex justify="space-between" align="center">
      <n-flex align="center">
        <Icon icon="streamline-emojis:cat" :width="30" :height="30"></Icon>
        <div class="title">徐越的自测猫</div>
      </n-flex>
      <n-flex>
        <n-button @click="handleShare">分享</n-button>
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
