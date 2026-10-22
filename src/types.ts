import { RemovableRef } from "@vueuse/core"

export type LANGUAGE = "c" | "python" | "cpp" | "turtle" | "sql"

export interface Code {
  value: string
  language: LANGUAGE
}

export interface Cache {
  language: RemovableRef<LANGUAGE>
  input: RemovableRef<string>
  code: { [key in LANGUAGE]: RemovableRef<string> }
  fontsize: RemovableRef<number>
}

export enum Status {
  NotStarted = 0,
  Accepted = 3,
  CompileError = 6,
  RuntimeError = 11,
}

export interface File {
  in: string
  out: string
  error: boolean
}

export type Tab = "code" | "input" | "output" | "setting"
