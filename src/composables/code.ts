import { useStorage } from "@vueuse/core"
import copyTextToClipboard from "copy-text-to-clipboard"
import qs from "query-string"
import { nextTick, reactive, ref, watch } from "vue"
import { formatCode, getCodeByQuery, submit } from "../api"
import { sources } from "../templates"
import { Cache, Code, LANGUAGE, Status } from "../types"
import { atou, utoa } from "../utils"
import { isMobile } from "./breakpoints"
import { dialog, notice } from "./notice"
import {
  buildSqlScript,
  resetSqlTableSelection,
  selectSqlTable,
  selectedTableId,
} from "./sqlTable"

const defaultLanguage = "python"
const languages: LANGUAGE[] = ["python", "c", "cpp", "turtle", "sql"]

const cache: Cache = {
  language: useStorage<LANGUAGE>("code_language", defaultLanguage),
  input: useStorage("code_input", ""),
  fontsize: useStorage("fontsize", isMobile.value ? 20 : 24),
  code: {
    python: useStorage("code_python", sources["python"]),
    c: useStorage("code_c", sources["c"]),
    cpp: useStorage("code_cpp", sources["cpp"]),
    turtle: useStorage("code_turtle", sources["turtle"]),
    sql: useStorage("code_sql", sources["sql"]),
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
    if (value === "sql") resetSqlTableSelection()
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

interface Shared {
  lang: LANGUAGE
  code: string
  input: string
  table?: string
}

// 链接内容完全来自 URL，字段都要校验后才能落到编辑器里
function parseShared(base64: string): Shared {
  const data = JSON.parse(atou(base64))
  const lang = languages.includes(data.lang)
    ? (data.lang as LANGUAGE)
    : defaultLanguage
  return {
    lang,
    code: typeof data.code === "string" ? data.code : sources[lang],
    input: typeof data.input === "string" ? data.input : "",
    table: typeof data.table === "string" ? data.table : undefined,
  }
}

function confirmOverwrite() {
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: "打开分享的代码",
      content: "这会覆盖你当前保存的代码，是否继续？",
      positiveText: "打开分享",
      negativeText: "保留我的代码",
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
      onMaskClick: () => resolve(false),
    })
  })
}

async function applyShared(shared: Shared) {
  const saved = cache.code[shared.lang].value
  const safe = saved === sources[shared.lang] || saved === shared.code
  if (!safe && !(await confirmOverwrite())) return

  cache.code[shared.lang].value = shared.code
  code.language = shared.lang
  code.value = shared.code
  input.value = shared.input
  if (shared.lang === "sql") {
    // 切换语言的 watch 会重置选中的表，要等它跑完再应用分享里的表
    await nextTick()
    selectSqlTable(shared.table)
  }
}

export async function init() {
  code.language = cache.language.value
  code.value = cache.code[code.language].value
  input.value = cache.input.value
  size.value = cache.fontsize.value
  status.value = Status.NotStarted

  const parsed = qs.parse(location.search)
  const base64 = parsed.share as string
  if (base64) {
    let shared: Shared
    try {
      shared = parseShared(base64)
    } catch (err) {
      notice.error("分享链接已损坏，可能在传输中被截断")
      return
    }
    await applyShared(shared)
    return
  }
  const preset = parsed.query as string
  if (preset) {
    try {
      const result = await getCodeByQuery(preset)
      code.value = result.data.code
    } catch (err) {
      notice.error("预设代码加载失败")
    }
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
  const url = qs.exclude(location.href, ["query", "share"])
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
    const sourceCode =
      code.language === "sql" ? buildSqlScript(cleanCode) : cleanCode
    const result = await submit(
      { value: sourceCode, language: code.language },
      input.value.trim(),
    )
    output.value = result.output || ""
    status.value = result.status
  }
  loading.value = false
}

export function share() {
  const data: Shared = {
    lang: code.language,
    code: code.value,
    input: input.value,
  }
  if (code.language === "sql") data.table = selectedTableId.value
  const base64 = utoa(JSON.stringify(data))
  // 基址要去掉 query（预设代码会在 init 里覆盖分享内容）和上一次的 share
  const url = qs.exclude(location.href, ["query", "share"])
  return copyTextToClipboard(qs.stringifyUrl({ url, query: { share: base64 } }))
}

export async function format() {
  code.value = await formatCode(code.value, code.language)
}
