import { computed, ref } from "vue"
import { Status } from "../types"
import { output, status, code } from "./code"

export const analysis = ref("")
export const loading = ref(false)

export async function getAIAnalysis() {
  analysis.value = ""
  // 使用 streaming 流式方式 fetch /ai/analysis 接口，传入 code 和 error_info
  const baseUrl = import.meta.env.PUBLIC_CODEAPI_URL
  loading.value = true
  try {
    const response = await fetch(`${baseUrl}/ai`, {
      method: "POST",
      body: JSON.stringify({
        code: code.value,
        language: code.language,
        error_info: output.value,
      }),
    })
    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ""
    let eventLines: string[] = []
    let currentEvent: string | null = null

    const flushEvent = () => {
      if (eventLines.length === 0) return false
      const raw = eventLines.join("\n")
      eventLines = []
      const event = currentEvent ?? "message"
      currentEvent = null

      if (!raw) return false

      let payload: unknown
      try {
        payload = JSON.parse(raw)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("无法解析 SSE 数据", error, raw)
        return false
      }

      const data = (payload as { data?: string }).data ?? ""
      const message = (payload as { message?: string }).message ?? ""

      if (event === "chunk") {
        appendContent(data)
        return false
      }

      if (event === "error") {
        if (loading.value) {
          loading.value = false
        }
        if (message) {
          appendContent(`\n[错误] ${message}`)
        }
        return true
      }

      if (event === "done") {
        if (loading.value) {
          loading.value = false
        }
        return true
      }

      appendContent(data || message)
      return false
    }

    const processLine = (line: string) => {
      if (line === "") {
        return flushEvent()
      }

      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trimStart()
        return false
      }

      if (!line.startsWith("data:")) return false

      let value = line.slice(5)
      if (value.startsWith(" ")) {
        value = value.slice(1)
      }
      eventLines.push(value)
      return false
    }

    const processBuffer = (final = false) => {
      const lines = buffer.split("\n")
      if (!final) {
        buffer = lines.pop() ?? ""
      } else {
        buffer = ""
      }

      for (const line of lines) {
        const shouldStop = processLine(line)
        if (shouldStop) {
          return true
        }
      }

      if (final) {
        return processLine("")
      }

      return false
    }
    const appendContent = (segment: string) => {
      if (!segment) return
      analysis.value += segment
      if (loading.value) {
        loading.value = false
      }
    }

    while (true) {
      const { done, value } = (await reader.read()) as ReadableStreamReadResult<
        Uint8Array<ArrayBuffer>
      >
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      if (processBuffer()) {
        return
      }
    }

    if (processBuffer(true)) {
      return
    }
  } finally {
    if (loading.value) {
      loading.value = false
    }
  }
}

export const showAnalysis = computed(
  () => ![Status.Accepted, Status.NotStarted].includes(status.value),
)
