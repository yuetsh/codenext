import axios from "axios"
import { Code } from "./types"
import { deadResults, languageToId } from "./templates"

function getChromeVersion() {
  var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
  return raw ? parseInt(raw[2], 10) : 0
}

const isLowVersion = getChromeVersion() < 80

const protocol = isLowVersion ? "http" : "https"

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

const http = axios.create({ baseURL: `${protocol}://judge0api.xuyue.cc` })

export async function submit(code: Code, input: string) {
  const encodedCode = encode(code.value)

  if (encodedCode === deadResults[code.language].encoded) {
    return deadResults[code.language].result
  } else {
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
    const response = await http.post("/submissions", payload, {
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
}
