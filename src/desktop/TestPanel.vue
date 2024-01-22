<script lang="ts" setup>
const count = 5
</script>
<template>
  <n-flex vertical>
    <n-flex>
      <n-button>增加5个</n-button>
      <n-button>运行看看</n-button>
      <n-button type="primary">生成并下载</n-button>
    </n-flex>
    <n-flex vertical>
      <n-flex v-for="it in count" :key="it">
        <n-flex vertical>
          <span>{{ it }}.in</span>
          <n-input type="textarea" />
        </n-flex>
        <n-flex vertical>
          <span>{{ it }}.out</span>
          <n-input type="textarea" />
        </n-flex>
      </n-flex>
    </n-flex>
  </n-flex>
</template>
