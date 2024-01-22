import { RemovableRef } from "@vueuse/core"

export type LANGUAGE = "c" | "python"

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

export interface Submission {
  stdout: string
  time: string
  memory: number
  stderr: string
  token: string
  compile_output: string
  message: string
  status: {
    id: number
    description: string
  }
}
