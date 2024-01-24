<script setup lang="ts">
import { zhCN, dateZhCN, darkTheme } from "naive-ui"
import { useDark } from "@vueuse/core"
import Desktop from "./desktop/index.vue"
import Mobile from "./mobile/index.vue"
import { isDesktop, isMobile } from "./composables/breakpoints"
import { onMounted } from "vue"
import { init } from "./composables/code"
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
        <Mobile v-if="isMobile" />
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>
