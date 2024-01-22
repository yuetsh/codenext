import { ref } from "vue"
import copyTextToClipboard from "copy-text-to-clipboard"
import { Code, LANGUAGE, Cache } from "../types"
import { sources } from "../templates"
import { submit } from "../api"
import { useStorage } from "@vueuse/core"

const defaultLanguage = "python"

const cache: Cache = {
  language: useStorage<LANGUAGE>("code_language", defaultLanguage),
  input: useStorage("code_input", ""),
  code: {
    python: useStorage("code_python", sources["python"]),
    c: useStorage("code_c", sources["c"]),
    java: useStorage("code_java", sources["java"]),
    cpp: useStorage("code_cpp", sources["cpp"]),
  },
}

export const code = ref<Code>({
  value: cache.code[defaultLanguage].value,
  language: cache.language.value,
})
export const input = ref(cache.input.value)
export const output = ref("")
export const loading = ref(false)

export function init() {
  code.value.language = cache.language.value
  code.value.value = cache.code[code.value.language].value
  input.value = cache.input.value
}

export function copy() {
  copyTextToClipboard(code.value.value)
}

export function reset() {
  code.value.value = sources[code.value.language]
  cache.code[code.value.language].value = sources[code.value.language]
  output.value = ""
}

export function changeLanguage(language: LANGUAGE) {
  cache.language.value = language
  code.value.value = cache.code[language].value
  output.value = ""
}

export function changeCode(value: string) {
  cache.code[code.value.language].value = value
}

export function changeInput(value: string) {
  cache.input.value = value
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
