<script setup lang="ts">
import { zhCN, dateZhCN, darkTheme } from "naive-ui"
import Desktop from "./desktop/index.vue"
import Mobile from "./mobile/index.vue"
import { isDesktop, isMobile } from "./composables/breakpoints"
import { useDark } from "@vueuse/core"
const isDark = useDark()
</script>

<template>
  <n-config-provider
    inline-theme-disabled
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="isDark ? darkTheme : null"
  >
    <n-layout>
      <Desktop v-if="isDesktop" />
      <Mobile v-if="isMobile" />
    </n-layout>
  </n-config-provider>
</template>
