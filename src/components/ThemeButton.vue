<script lang="ts" setup>
import { useDark, useToggle } from "@vueuse/core"

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
<template>
  <n-button @click="toggleDark()">
    {{ isDark ? "浅色" : "深色" }}
  </n-button>
</template>
