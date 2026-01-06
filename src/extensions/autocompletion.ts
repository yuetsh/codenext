import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from "@codemirror/autocomplete"
import type { EditorView } from "@codemirror/view"
import { LANGUAGE } from "../types"
import { cpp } from "./cpp"
import { c } from "./c"
import { python } from "./python"
import { turtle } from "./turtle"

type ChineseCompletion = Pick<
  Completion,
  "label" | "detail" | "type" | "info" | "boost" | "apply"
> & { apply?: string | Completion["apply"] }

// 中文注释提示
const chineseAnnotations: Record<string, ChineseCompletion[]> = {
  python,
  turtle,
  c,
  cpp,
}

export function enhanceCompletion(language: LANGUAGE): CompletionSource {
  return async function (
    context: CompletionContext,
  ): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w+/)
    if (!word) return null

    const completions: Completion[] = (chineseAnnotations[language] || []).map(
      (completion) => {
        const insertText =
          typeof completion.apply === "string"
            ? completion.apply
            : completion.label
        const cursorOffset = insertText.includes("(")
          ? insertText.indexOf("(") + 1
          : insertText.length

        if (
          (completion.type === "function" || completion.type === "method") &&
          insertText.includes(")")
        ) {
          return {
            ...completion,
            apply: (
              view: EditorView,
              _c: Completion,
              from: number,
              to: number,
            ) => {
              view.dispatch({
                changes: { from, to, insert: insertText },
                selection: { anchor: from + cursorOffset },
              })
            },
          }
        }

        return completion
      },
    )

    return {
      from: word.from,
      options: completions,
      validFor: /^\w+$/,
    }
  }
}
