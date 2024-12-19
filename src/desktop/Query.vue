<template>
  <n-flex vertical size="large">
    <n-flex v-if="code.value">
      <div>
        <n-input v-model:value="query" />
      </div>
      <n-button type="primary" @click="create" :disabled="!query.length">
        新建
      </n-button>
    </n-flex>
    <div v-else style="color: red">当前无代码</div>
    <n-flex>
      <div style="margin-top: 6px" v-if="codes.length">已有的</div>
      <n-tag
        v-for="item in codes"
        :key="item.query"
        closable
        size="large"
        round
        @click="show(item.code, item.query)"
        @close="remove(item.id)"
      >
        {{ item.query }}
      </n-tag>
    </n-flex>
  </n-flex>
</template>
<script setup lang="ts">
import { useMessage } from "naive-ui"
import { onMounted, ref } from "vue"
import { createCode, listCode, removeCode } from "../api"
import { code } from "../composables/code"
import qs from "query-string"

const message = useMessage()

const query = ref("")
const codes = ref<{ code: string; query: string; id: number }[]>([])

async function create() {
  try {
    await createCode({
      code: code.value,
      query: query.value,
    })
    list()
  } catch (err) {
    message.error("query重复，创建失败")
  }
}

async function remove(id: number) {
  await removeCode(id)
  list()
}

function show(codeStr: string, query: string) {
  code.value = codeStr
  const url = qs.stringifyUrl({ url: location.href, query: { query } })
  window.location.href = url
}

async function list() {
  const res = await listCode()
  codes.value = res.data
}

onMounted(list)
</script>
