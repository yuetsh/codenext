import { ref } from "vue"
import { debug as fetchDebugTrace } from "../api"
import { code, input } from "./code"

export const showDebugModal = ref(false)
export const debugData = ref<any>(null)
export const debugLoading = ref(false)

/**
 * 把输入框内容切成 stdin 行。
 * 只丢掉末尾换行产生的那个空串，中间的空行必须保留 ——
 * 程序可能正需要读一个空行（input() 返回 ""），过滤掉会导致输入提前耗尽。
 */
function splitInputLines(text: string): string[] {
  if (!text) return []
  const lines = text.split("\n")
  if (lines[lines.length - 1] === "") lines.pop()
  return lines
}

/**
 * trace 末尾停在 raw_input 即说明输入不足
 * （pg_logger 在缺输入时会立刻 done=True，trace 中至多只有 1 个 raw_input 事件，
 * 所以不能用计数对比，只能看末尾）
 */
function endsAtRawInput(data: any): boolean {
  const trace = data?.trace
  if (!trace?.length) return false
  return trace[trace.length - 1].event === "raw_input"
}

export type DebugResult =
  | { ok: true }
  | { ok: false; level: "error" | "warning"; message: string }

/**
 * 请求调试数据并打开面板。
 * 提示文案交给调用方展示：useMessage() 只能在组件的 setup 里取。
 */
export async function startDebug(): Promise<DebugResult> {
  if (debugLoading.value) return { ok: true }

  debugLoading.value = true
  let res
  try {
    res = await fetchDebugTrace(code.value, splitInputLines(input.value))
  } catch (err: any) {
    return {
      ok: false,
      level: "error",
      message: `调试失败: ${err?.response?.data?.detail ?? err?.message ?? "未知错误"}`,
    }
  } finally {
    debugLoading.value = false
  }

  debugData.value = res.data

  if (endsAtRawInput(res.data)) {
    return {
      ok: false,
      level: "warning",
      message: "程序需要更多输入，请在输入框补全后重新点击调试",
    }
  }

  showDebugModal.value = true
  return { ok: true }
}

export function closeDebug() {
  showDebugModal.value = false
  debugData.value = null
}
