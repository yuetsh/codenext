import { ref } from "vue"

export const insertText = ref("")

export const cTexts = [
  ";",
  ",",
  "&",
  "{}",
  " = ",
  " == ",
  " > ",
  " < ",
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
  " else ",
]

export const pythonTexts = [
  ":",
  '""',
  " = ",
  " == ",
  " > ",
  " < ",
  " != ",
  "print()",
  "input()",
  "if :",
  "else:",
  "elif :",
  "for ",
  " in ",
  "range():",
  "while",
  "[]",
  "{}",
  '"%.2f" % ',
]
