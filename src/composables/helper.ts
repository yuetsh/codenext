import { ref } from "vue"

export const insertText = ref("")

export const cSymbols = [
  ";",
  ",",
  "&",
  "{}",
  "=",
  "==",
  ">",
  "<",
  " != ",
  " || ",
  " && ",
  "()",
  'printf("");',
  'scanf("");',
  "int ",
  "float ",
  "%d",
  "%.2f",
  "if () {}",
  "else {}",
  "a",
  "b",
  "c",
  "\n",
]

export const pythonSymbols = [
  ":",
  '""',
  ",",
  "+",
  "-",
  "*",
  "/",
  "//",
  "%",
  "()",
  "=",
  "==",
  ">",
  "<",
  " != ",
  "print()",
  "input()",
  "if ",
  "else:",
  "for ",
  " in ",
  "range():",
  "while ",
  "[]",
  '"%.2f" % ',
  "a",
  "b",
  "c",
  "\n",
]

export function getText(c: string) {
  if (c === "\n") return "回车"
  else return c
}
