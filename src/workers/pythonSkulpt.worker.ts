/// <reference lib="webworker" />

// @ts-ignore
import * as Sk from "skulpt"

type RunRequest = {
  id: number
  source: string
  stdin: string
  timeoutMs: number
}

type RunResponse = {
  id: number
  status: number
  output: string
}

const exceptionNameToCn: Record<string, string> = {
  SyntaxError: "格式错误",
  IndentationError: "格式错误",
  TabError: "格式错误",
  NameError: "变量命名错误",
  TypeError: "类型错误",
  ValueError: "值错误",
  IndexError: "索引错误",
  KeyError: "键错误",
  ZeroDivisionError: "除零错误",
  AttributeError: "属性错误",
  ImportError: "导入错误",
  ModuleNotFoundError: "模块未找到",
  RuntimeError: "运行错误",
}

function translateSkulptError(
  name: string,
  message: string,
  isCompileError: boolean,
) {
  if (isCompileError) return "代码格式错误"
  if (/exceeded run time limit/i.test(message)) return "运行超时"

  const cnName = exceptionNameToCn[name] ?? ""
  const translatedMessage = String(message ?? "")
    .replace(/No module named ([^\s]+)/gi, "没有名为 $1 的模块")
    .replace(/integer division or modulo by zero/gi, "不能除以零")
    .replace(/name '([^']+)' is not defined/gi, "变量 $1 未定义")
    .replace(/list index out of range/gi, "列表下标越界")
    .replace(/index out of range/gi, "索引越界")
    .trim()

  if (cnName)
    return translatedMessage ? `${cnName}：${translatedMessage}` : cnName
  return translatedMessage || "运行错误"
}

function skulptRead(path: string) {
  const builtinFiles = (Sk as any).builtinFiles
  const files = builtinFiles?.files ?? builtinFiles?.["files"]
  if (!files) throw new Error("skulpt-stdlib.js has not been loaded")
  if (files[path] === undefined) throw new Error(`File not found: '${path}'`)
  return files[path]
}

async function runPythonWithSkulpt(
  source: string,
  stdin: string,
  timeoutMs: number,
) {
  const stdout: string[] = []
  const inputLines = (stdin ?? "").split("\n")
  let inputIndex = 0
  const normalizedSource = String(source ?? "").replace(/\r\n/g, "\n")

  ;(Sk as any).configure({
    output: (text: string) => stdout.push(String(text)),
    read: skulptRead,
    inputfun: () => String(inputLines[inputIndex++] ?? ""),
    inputfunTakesPrompt: true,
    __future__: (Sk as any).python3,
  })
  ;(Sk as any).execLimit = Math.max(1, Number(timeoutMs) || 1)
  ;(Sk as any).execStart = new Date()

  try {
    await (Sk as any).misceval.asyncToPromise(() =>
      (Sk as any).importMainWithBody("<stdin>", false, normalizedSource, true),
    )
    return { status: 3, output: stdout.join("").trimEnd() }
  } catch (err: any) {
    const name = String(err?.tp$name ?? err?.name ?? "")
    const message = String(
      err?.tp$str?.()?.v ?? err?.message ?? err?.toString?.() ?? err ?? "",
    )

    const isCompileError =
      name === "SyntaxError" ||
      name === "IndentationError" ||
      name === "TabError" ||
      /SyntaxError|IndentationError|TabError/i.test(message)

    const formattedError = translateSkulptError(name, message, isCompileError)

    return {
      status: isCompileError ? 6 : 11,
      output: (stdout.join("") + (stdout.length ? "\n" : "") + formattedError)
        .trim()
        .replace(/\r\n/g, "\n"),
    }
  }
}

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { id, source, stdin, timeoutMs } = event.data
  try {
    const result = await runPythonWithSkulpt(source, stdin, timeoutMs)
    ;(self as any).postMessage({ id, ...result } satisfies RunResponse)
  } catch (err: any) {
    const output = String(err?.message ?? err?.toString?.() ?? err ?? "")
    ;(self as any).postMessage({ id, status: 11, output } satisfies RunResponse)
  }
}
