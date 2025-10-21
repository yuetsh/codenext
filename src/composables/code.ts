import { useStorage } from "@vueuse/core"
import copyTextToClipboard from "copy-text-to-clipboard"
import qs from "query-string"
import { reactive, ref, watch } from "vue"
import { getCodeByQuery, submit } from "../api"
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
    cpp: useStorage("code_cpp", sources["cpp"]),
    turtle: useStorage("code_turtle", sources["turtle"]),
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
export const turtleRunId = ref(0)
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

export async function init() {
  code.language = cache.language.value
  code.value = cache.code[code.language].value
  input.value = cache.input.value
  size.value = cache.fontsize.value
  status.value = Status.NotStarted

  const parsed = qs.parse(location.search)
  const base64 = parsed.share as string
  if (base64) {
    try {
      const data = JSON.parse(atou(base64))
      const lang = ["python", "c", "cpp", "turtle"].includes(data.lang)
        ? (data.lang as LANGUAGE)
        : defaultLanguage
      const sharedCode = data.code ?? sources[lang]
      cache.code[lang].value = sharedCode
      code.language = lang
      code.value = sharedCode
      input.value = typeof data.input === "string" ? data.input : ""
    } catch (err) {}
  }
  const preset = parsed.query as string
  if (preset) {
    try {
      const result = await getCodeByQuery(preset)
      code.value = result.data.code
    } catch (err) {}
  }
}

export function clearInput() {
  input.value = ""
}

export function reset() {
  code.value = sources[code.language]
  cache.code[code.language].value = sources[code.language]
  output.value = ""
  status.value = Status.NotStarted
  const url = qs.exclude(location.href, ["query"])
  window.location.href = url
}

export async function run() {
  loading.value = true
  const cleanCode = code.value.trim()
  if (!cleanCode) {
    loading.value = false
    return
  }
  if (code.language === "turtle") {
    turtleRunId.value++
  } else {
    output.value = ""
    status.value = Status.NotStarted
    const result = await submit(
      { value: cleanCode, language: code.language },
      input.value.trim(),
    )
    output.value = result.output || ""
    status.value = result.status
  }
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
    qs.stringifyUrl({ url: location.href, query: { share: base64 } }),
  )
}
