import axios from "axios"
import { languageToId } from "./templates"
import { Code, Submission } from "./types"

function encode(string?: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(string ?? "")))
}

function decode(bytes?: string) {
  const latin = atob(bytes ?? "")
  return new TextDecoder("utf-8").decode(
    Uint8Array.from({ length: latin.length }, (_, index) =>
      latin.charCodeAt(index),
    ),
  )
}

const judge = axios.create({ baseURL: import.meta.env.PUBLIC_JUDGE0API_URL })
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

export async function submit(code: Code, input: string) {
  if (code.language === "python") {
    return runPythonInWorker(code.value, input)
  }

  const encodedCode = encode(code.value)

  const id = languageToId[code.language]
  let compilerOptions = ""
  if (id === 50) compilerOptions = "-lm" // 解决 GCC 的链接问题
  const payload = {
    source_code: encodedCode,
    language_id: id,
    stdin: encode(input),
    redirect_stderr_to_stdout: true,
    compiler_options: compilerOptions,
  }
  const response = await judge.post<Submission>("/submissions", payload, {
    params: { base64_encoded: true, wait: true },
  })
  const data = response.data
  return {
    status: data.status && data.status.id,
    output: [decode(data.compile_output), decode(data.stdout)]
      .join("\n")
      .trim(),
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
