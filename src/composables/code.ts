import { ref } from "vue"
import copyTextToClipboard from "copy-text-to-clipboard"
import { Code } from "../types"
import { sources } from "../templates"
import { submit } from "../api"

export const code = ref<Code>({
  value: sources["python"],
  language: "python",
})
export const input = ref("")
export const output = ref("")
export const loading = ref(false)

export function copy() {
  copyTextToClipboard(code.value.value)
}

export function reset() {
  code.value.value = sources["python"]
  output.value = ""
}

export async function run() {
  loading.value = true
  const cleanCode = code.value.value.trim()
  if (!cleanCode) return
  output.value = ""
  const result = await submit(
    { value: cleanCode, language: code.value.language },
    input.value.trim(),
  )
  output.value = result.output || ""
  loading.value = false
}
