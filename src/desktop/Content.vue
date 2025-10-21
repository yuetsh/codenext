<script lang="ts" setup>
import { code } from "../composables/code"
import CodeSection from "./CodeSection.vue"
import InputSection from "./InputSection.vue"
import OutputSection from "./OutputSection.vue"
import TurtleSection from "./TurtleSection.vue"
</script>

<template>
  <n-layout-content class="container">
    <n-split direction="horizontal" :min="1 / 3" :max="4 / 5">
      <template #1>
        <CodeSection />
      </template>
      <template #2>
        <n-split
          v-if="code.language !== 'turtle'"
          direction="vertical"
          :default-size="1 / 3"
          :min="1 / 5"
          :max="3 / 5"
        >
          <template #1>
            <InputSection />
          </template>
          <template #2>
            <OutputSection />
          </template>
        </n-split>
        <TurtleSection v-else />
      </template>
    </n-split>
  </n-layout-content>
</template>

<style scoped>
.container {
  height: calc(100vh - 60px);
}
</style>
