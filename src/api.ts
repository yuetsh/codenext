import axios from "axios"
import { languageToId } from "./templates"
import { Code, Submission } from "./types"

// function getChromeVersion() {
//   var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
//   return raw ? parseInt(raw[2], 10) : 0
// }

// const isLowVersion = getChromeVersion() < 80

// const protocol = isLowVersion ? "http" : "https"

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

const judge = axios.create({ baseURL: `https://judge0api.xuyue.cc` })
const api = axios.create({ baseURL: `https://code.xuyue.cc/api` })

export async function submit(code: Code, input: string) {
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
  const res = await api.get("/" + query)
  return res.data
}

export async function createCode(data: { code: string; query: string }) {
  const res = await api.post("/", data)
  return res.data
}

export async function removeCode(id: number) {
  const res = await api.delete(`/${id}`)
  console.log(res.data)
}
