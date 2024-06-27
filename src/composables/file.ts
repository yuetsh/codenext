import { downloadZip } from "client-zip"
import saveAs from "file-saver"
import { ref } from "vue"
import { submit } from "../api"
import { code } from "./code"

export const files = ref(
  Array.from({ length: 5 }).map(() => ({ in: "", out: "", error: false })),
)

function unique(arr: any[], key: string) {
  const res = new Map()
  return arr.filter((item) => !res.has(item[key]) && res.set(item[key], 1))
}

export function reset() {
  files.value = Array.from({ length: 5 }).map(() => ({
    in: "",
    out: "",
    error: false,
  }))
}

export function addFive() {
  files.value.push(
    ...Array.from({ length: 5 }).map(() => ({
      in: "",
      out: "",
      error: false,
    })),
  )
}

export function remove(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
}

export function onChange(value: string, index: number, slot: "in" | "out") {
  files.value = files.value.map((item, i) => {
    if (i === index) {
      item[slot] = value
    }
    return item
  })
}

export async function run() {
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

export async function download() {
  let failed = false
  const data = []
  for (let i = 0; i < files.value.length; i++) {
    if (files.value[i].error || !files.value[i].out) {
      failed = true
      break
    } else {
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
  if (failed) return
  const blob = await downloadZip(data).blob()
  saveAs(blob, "testcase.zip")
}
