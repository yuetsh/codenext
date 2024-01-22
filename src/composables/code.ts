import { computed, ref, watch } from "vue"
import copyTextToClipboard from "copy-text-to-clipboard"
import { Code, LANGUAGE, Cache, Status } from "../types"
import { sources } from "../templates"
import { submit } from "../api"
import { useStorage } from "@vueuse/core"

const defaultLanguage = "python"

const cache: Cache = {
  language: useStorage<LANGUAGE>("code_language", defaultLanguage),
  input: useStorage("code_input", ""),
  fontsize: useStorage("fontsize", 24),
  code: {
    python: useStorage("code_python", sources["python"]),
    c: useStorage("code_c", sources["c"]),
  },
}

export const code = ref<Code>({
  value: cache.code[defaultLanguage].value,
  language: cache.language.value,
})
export const input = ref(cache.input.value)
export const output = ref("")
export const loading = ref(false)
export const size = ref(24)
export const status = ref(Status.NotStarted)

export const showStatus = computed(
  () => ![Status.Accepted, Status.NotStarted].includes(status.value),
)

watch(size, (value: number) => {
  cache.fontsize.value = value
})

watch(
  () => code.value.language,
  (value: LANGUAGE) => {
    cache.language.value = value
    code.value.value = cache.code[value].value
    output.value = ""
  },
)

watch(
  () => code.value.value,
  (value: string) => {
    cache.code[code.value.language].value = value
  },
)

watch(input, (value: string) => {
  cache.input.value = value
})

export function init() {
  code.value.language = cache.language.value
  code.value.value = cache.code[code.value.language].value
  input.value = cache.input.value
  size.value = cache.fontsize.value
  status.value = Status.NotStarted
}

export function copy() {
  copyTextToClipboard(code.value.value)
}

export function clearInput() {
  input.value = ""
}

export function reset() {
  code.value.value = sources[code.value.language]
  cache.code[code.value.language].value = sources[code.value.language]
  output.value = ""
  status.value = Status.NotStarted
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
  status.value = result.status
  loading.value = false
}
