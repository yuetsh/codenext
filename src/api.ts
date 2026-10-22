import axios from "axios"
import type { SqlJob } from "./composables/sqlTable"
import { Code, LANGUAGE } from "./types"

const api = axios.create({ baseURL: import.meta.env.PUBLIC_CODEAPI_URL })

type PythonWorkerRequest = {
  id: number
  source: string
  stdin: string
  timeoutMs: number
}

type PythonWorkerResponse = {
  id: number
  status: number
  output: string
}

let pythonWorker: Worker | null = null
let pythonWorkerSeq = 0
const pythonPending = new Map<
  number,
  { resolve: (v: { status: number; output: string }) => void; timeout: number }
>()

function getPythonWorker() {
  if (pythonWorker) return pythonWorker
  pythonWorker = new Worker(
    new URL("./workers/pythonSkulpt.worker.ts", import.meta.url),
    { type: "module" },
  )
  pythonWorker.onmessage = (event: MessageEvent<PythonWorkerResponse>) => {
    const { id, status, output } = event.data ?? ({} as any)
    const pending = pythonPending.get(id)
    if (!pending) return
    clearTimeout(pending.timeout)
    pythonPending.delete(id)
    pending.resolve({ status, output })
  }
  return pythonWorker
}

function restartPythonWorker() {
  if (pythonWorker) pythonWorker.terminate()
  pythonWorker = null
  pythonPending.clear()
}

async function runPythonInWorker(source: string, stdin: string) {
  const worker = getPythonWorker()
  const id = ++pythonWorkerSeq
  const timeoutMs = 5000

  return new Promise<{ status: number; output: string }>((resolve) => {
    const timeout = window.setTimeout(() => {
      restartPythonWorker()
      resolve({ status: 11, output: "运行超时" })
    }, timeoutMs + 250)

    pythonPending.set(id, { resolve, timeout })
    const message: PythonWorkerRequest = { id, source, stdin, timeoutMs }
    worker.postMessage(message)
  })
}

// SQL 在浏览器里用 sql.js 执行；每次新开一个 worker，跑完或超时就销毁
export function runSql(job: SqlJob) {
  return new Promise<{ status: number; output: string }>((resolve) => {
    const worker = new Worker(
      new URL("./workers/sqlite.worker.ts", import.meta.url),
      { type: "module" },
    )
    let timeout = 0
    const finish = (result: { status: number; output: string }) => {
      clearTimeout(timeout)
      worker.terminate()
      resolve(result)
    }
    worker.onerror = () => finish({ status: 11, output: "SQL 引擎加载失败" })
    worker.onmessage = (event) => {
      // 首次加载 wasm 不计入超时，引擎就绪后再提交并开始计时
      if (event.data?.ready) {
        timeout = window.setTimeout(
          () => finish({ status: 11, output: "运行超时" }),
          5000,
        )
        worker.postMessage(job)
        return
      }
      finish(event.data)
    }
  })
}

export async function submit(code: Code, input: string) {
  if (code.language === "python") {
    return runPythonInWorker(code.value, input)
  }

  try {
    const res = await api.post<{ status: number; output: string }>("/run", {
      code: code.value,
      language: code.language,
      stdin: input,
    })
    return res.data
  } catch (err: any) {
    return {
      status: 11,
      output: err?.response?.data?.detail ?? "运行服务不可用，请稍后再试",
    }
  }
}

export async function listCode() {
  const res = await api.get("/")
  return res.data
}

export async function getCodeByQuery(query: string) {
  const res = await api.get("/query/" + query)
  return res.data
}

export async function createCode(data: { code: string; query: string }) {
  const res = await api.post("/", data)
  return res.data
}

export async function removeCode(id: number) {
  await api.delete(`/${id}`)
}

export async function debug(code: string, inputs: string[]) {
  const res = await api.post("/debug", {
    code,
    inputs,
  })
  return res.data
}

export async function formatCode(code: string, language: LANGUAGE) {
  const res = await api.post("/format", { code, language })
  return res.data.code as string
}
