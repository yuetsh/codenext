<script lang="ts" setup>
import { ref } from "vue"
import { downloadZip } from "client-zip"
import { saveAs } from "file-saver"
import { submit } from "../api"
import { code } from "../composables/code"
import { File } from "../types"

interface Props {
  files: File[]
}
const props = defineProps<Props>()
const files = ref(props.files)

function unique(arr: any[], key: string) {
  const res = new Map()
  return arr.filter((item) => !res.has(item[key]) && res.set(item[key], 1))
}

function addFive() {
  files.value.push(
    ...Array.from({ length: 5 }).map(() => ({
      in: "",
      out: "",
      error: false,
    })),
  )
}

function remove(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
}

function onChange(value: string, index: number, slot: "in" | "out") {
  files.value = files.value.map((item, i) => {
    if (i === index) {
      item[slot] = value
    }
    return item
  })
}

async function run() {
  files.value = files.value.filter((it) => {
    if (it.in === "" && it.out === "") return false
    return true
  })
  files.value = unique(files.value, "in")
  const requests = files.value.map((file) => submit(code, file.in))
  const responses = await Promise.all(requests)
  const newFiles = responses.map((r) => ({
    in: "",
    out: r.output,
    error: r.status !== 3,
  }))
  files.value.forEach((file, index) => {
    newFiles[index].in = file.in
  })
  files.value = newFiles
}

async function download() {
  let failed = false
  for (let i = 0; i < files.value.length; i++) {
    if (files.value[i].error) {
      failed = true
      break
    }
  }
  if (failed) return
  const data = []
  for (let i = 0; i < files.value.length; i++) {
    if (files.value[i].out) {
      data.push({
        name: `${i + 1}.in`,
        input: files.value[i].in,
        lastModified: new Date(),
      })
      data.push({
        name: `${i + 1}.out`,
        input: files.value[i].out,
        lastModified: new Date(),
      })
    }
  }
  if (!data.length) return
  const blob = await downloadZip(data).blob()
  saveAs(blob, "testcase.zip")
}
</script>
<template>
  <n-flex vertical>
    <n-flex>
      <n-button @click="addFive">增加5个</n-button>
      <n-button @click="run">先运行</n-button>
      <n-button type="primary" @click="download">再下载</n-button>
    </n-flex>
    <n-flex v-for="(it, index) in files" :key="index">
      <n-flex vertical>
        <span>{{ index + 1 }}.in</span>
        <n-input
          type="textarea"
          v-model:value="it.in"
          @update:value="(v) => onChange(v, index, 'in')"
        />
      </n-flex>
      <n-flex vertical>
        <span>{{ index + 1 }}.out</span>
        <n-input
          type="textarea"
          v-model:value="it.out"
          @update:value="(v) => onChange(v, index, 'out')"
          :status="it.error ? 'error' : 'success'"
        />
      </n-flex>
      <n-button :disabled="files.length == 1" @click="remove(index)">
        删除
      </n-button>
    </n-flex>
  </n-flex>
</template>
