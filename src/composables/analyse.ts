import { computed, reactive } from "vue"
import { Status } from "../types"
import { output, status } from "./code"

export const analyse = reactive({
  line: -1,
  message: "",
})

export const showAnalyse = computed(
  () => ![Status.Accepted, Status.NotStarted].includes(status.value),
)

function findError(line: string, language = "python") {
  const python: any = {
    "EOFError: EOF when reading a line": "需要在输入框填写输入信息",
    "SyntaxError: invalid character in identifier":
      "可能是单词拼写错误，可能是括号、引号写成中文的了",
    "SyntaxError: invalid syntax": "语法错误，不合法的语法",
    "SyntaxError: EOL while scanning string literal":
      "可能是这一行最后一个符号是中文的，或者引号、括号不匹配",
    "NameError: name '(.*?)' is not defined": (name: string) =>
      `命名错误，${name} 不知道是什么东西`,
    "IndentationError: expected an indented block": "缩进错误：这一行需要缩进",
    'TypeError: can only concatenate str \\(not "(.*?)"\\) to str':
      "文字和数字不能相加",
  }
  const c: any = {}
  const regex = { c, python }[language]
  let message = ""
  for (let r in regex) {
    const err = line.match(r)
    if (err) {
      if (typeof regex[r] === "function") {
        message = regex[r](err[1])
      } else {
        message = regex[r]
      }
      break
    }
  }
  return message
}

export function analyzeError() {
  const line = output.value.match(/File "script.py", line (\d+)/)
  if (line) {
    analyse.line = parseInt(line[1])
  }
  const lines = output.value.split("\n")
  const lastLine = lines[lines.length - 1]
  analyse.message = findError(lastLine)
}
