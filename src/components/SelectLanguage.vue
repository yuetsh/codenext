<script lang="ts" setup>
import type { SelectOption } from "naive-ui"
import { h } from "vue"
import { code } from "../composables/code"

const LANGS = [
  ["python", "Python"],
  ["turtle", "海龟绘图"],
  ["c", "C 语言"],
  ["cpp", "C++"],
]

const languages: SelectOption[] = LANGS.map((it) => ({
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
}))
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
