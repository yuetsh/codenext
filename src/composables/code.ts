import { reactive, ref, watch } from "vue"
import { Code, LANGUAGE, Cache, Status } from "../types"
import { sources } from "../templates"
import { submit } from "../api"
import { useStorage } from "@vueuse/core"
import { isMobile } from "./breakpoints"

const defaultLanguage = "python"

const cache: Cache = {
  language: useStorage<LANGUAGE>("code_language", defaultLanguage),
  input: useStorage("code_input", ""),
  fontsize: useStorage("fontsize", isMobile.value ? 20 : 24),
  code: {
    python: useStorage("code_python", sources["python"]),
    c: useStorage("code_c", sources["c"]),
  },
}

export const code = reactive<Code>({
  value: cache.code[defaultLanguage].value,
  language: cache.language.value,
})
export const input = ref(cache.input.value)
export const output = ref("")
export const status = ref(Status.NotStarted)
export const loading = ref(!code.value)
export const size = ref(cache.fontsize)

watch(size, (value: number) => {
  cache.fontsize.value = value
})

watch(
  () => code.language,
  (value: LANGUAGE) => {
    cache.language.value = value
    code.value = cache.code[value].value
    output.value = ""
    status.value = Status.NotStarted
  },
)

watch(
  () => code.value,
  (value: string) => {
    cache.code[code.language].value = value
    loading.value = !value
  },
)

watch(input, (value: string) => {
  cache.input.value = value
})

export function init() {
  code.language = cache.language.value
  code.value = cache.code[code.language].value
  input.value = cache.input.value
  size.value = cache.fontsize.value
  status.value = Status.NotStarted
}

export function clearInput() {
  input.value = ""
}

export function reset() {
  code.value = sources[code.language]
  cache.code[code.language].value = sources[code.language]
  output.value = ""
  status.value = Status.NotStarted
}

export async function run() {
  loading.value = true
  const cleanCode = code.value.trim()
  if (!cleanCode) return
  output.value = ""
  status.value = Status.NotStarted
  const result = await submit(
    { value: cleanCode, language: code.language },
    input.value.trim(),
  )
  output.value = result.output || ""
  status.value = result.status
  loading.value = false
}
