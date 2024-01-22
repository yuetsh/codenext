import { RemovableRef } from "@vueuse/core"

export type LANGUAGE = "c" | "cpp" | "python" | "java"

export interface Code {
  value: string
  language: LANGUAGE
}

export interface Cache {
  language: RemovableRef<LANGUAGE>
  input: RemovableRef<string>
  code: { [key in LANGUAGE]: RemovableRef<string> }
}
