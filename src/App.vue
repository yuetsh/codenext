<script setup lang="ts">
import { useDark } from "@vueuse/core"
import { darkTheme, dateZhCN, zhCN } from "naive-ui"
import { onMounted } from "vue"
import { isDesktop } from "./composables/breakpoints"
import { init } from "./composables/code"
import Desktop from "./desktop/index.vue"
import Mobile from "./mobile/index.vue"

const isDark = useDark()

onMounted(init)
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="isDark ? darkTheme : null"
  >
    <n-message-provider :max="1">
      <n-layout>
        <Desktop v-if="isDesktop" />
        <Mobile v-else />
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>
