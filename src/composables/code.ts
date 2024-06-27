import { useStorage } from "@vueuse/core"
import copyTextToClipboard from "copy-text-to-clipboard"
import queryString from "query-string"
import { reactive, ref, watch } from "vue"
import { submit } from "../api"
import { sources } from "../templates"
import { Cache, Code, LANGUAGE, Status } from "../types"
import { atou, utoa } from "../utils"
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
  value: sources[defaultLanguage],
  language: defaultLanguage,
})
export const input = ref("")
export const output = ref("")
export const status = ref(Status.NotStarted)
export const loading = ref(false)
export const size = ref(0)

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

  const parsed = queryString.parse(location.search)
  const base64 = parsed.share as string
  if (!base64) return
  try {
    const data = JSON.parse(atou(base64))
    code.language = data.lang
    code.value = data.code
    input.value = data.input
  } catch (err) {}
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

export function share() {
  const data = {
    lang: code.language,
    code: code.value,
    input: input.value,
  }
  const base64 = utoa(JSON.stringify(data))
  copyTextToClipboard(
    queryString.stringifyUrl({ url: location.href, query: { share: base64 } }),
  )
}
