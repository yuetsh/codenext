<script lang="ts" setup>
import type { SelectOption } from "naive-ui"
import { h, computed, watch } from "vue"
import { code } from "../composables/code"
import { isMobile } from "../composables/breakpoints"

const LANGS = computed(() => {
  const allLangs = [
    ["python", "Python"],
    ["turtle", "海龟绘图"],
    ["c", "C 语言"],
    ["cpp", "C++"],
  ]
  if (isMobile.value) {
    return allLangs.filter(([lang]) => lang !== "turtle")
  }
  return allLangs
})

// 如果当前在移动端且语言是海龟绘图，自动切换到 Python
watch(isMobile, (mobile) => {
  if (mobile && code.language === "turtle") {
    code.language = "python"
  }
})

const languages = computed<SelectOption[]>(() =>
  LANGS.value.map((it) => ({
    value: it[0],
    label: () => [
      h("img", {
        src: `/${it[0]}.svg`,
        style: {
          width: "16px",
          height: "16px",
          marginRight: "8px",
          transform: "translateY(3px)",
        },
      }),
      it[1],
    ],
  })),
)
</script>
<template>
  <n-select
    class="select"
    placeholder=""
    :options="languages"
    v-model:value="code.language"
  />
</template>
<style scoped>
.select {
  width: 125px;
}
</style>
