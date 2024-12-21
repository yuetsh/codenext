<template>
  <iframe width="100%" height="350" frameborder="0" :src="src"> </iframe>
</template>
<script lang="ts" setup>
import qs from "query-string"
import { onMounted, ref } from "vue"
import { code } from "../composables/code"

const src = ref("")

onMounted(() => {
  // const url = "http://localhost:8000"
  const url = "https://pythontutor.xuyue.cc"
  const base = url + "/iframe-embed.html"

  const part1 = qs.stringify({
    code: code.value,
    codeDivWidth: 300,
  })
  const part2 =
    "&cumulative=false&curInstr=0&heapPrimitives=nevernest&origin=opt-frontend.js&py=3&rawInputLstJSON=%5B%5D&textReferences=true"
  const query = part1 + part2
  src.value = base + "#" + query
})
</script>
