import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from "@codemirror/autocomplete"
import type { EditorView } from "@codemirror/view"
import { LANGUAGE } from "../types"
import { selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import { cpp } from "./cpp"
import { c } from "./c"
import { python } from "./python"
import { turtle } from "./turtle"
import { sql } from "./sql"

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
  sql,
}

// 数据类型只取基础部分（TEXT NOT NULL -> TEXT）
function baseType(type: string): string {
  return type.trim().split(/\s+/)[0]
}

// 根据当前选中的数据表，动态生成表名与列名补全
function buildSqlDynamicCompletions(): ChineseCompletion[] {
  const tableCompletions: ChineseCompletion[] = sqlTables.map((table) => ({
    label: table.tableName,
    detail: table.label,
    type: "type",
    info: `数据表 ${table.label}，包含列：${table.columns
      .map((column) => column.name)
      .join("、")}`,
    boost: table.id === selectedTableId.value ? 95 : 40,
    apply: `${table.tableName} `,
  }))
  const activeTable =
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0]
  const columnCompletions: ChineseCompletion[] = activeTable.columns.map(
    (column) => ({
      label: column.name,
      detail: baseType(column.type),
      type: "variable",
      info: `${activeTable.label} 的列，类型 ${baseType(column.type)}`,
      boost: 93,
    }),
  )
  return [...tableCompletions, ...columnCompletions]
}

export function enhanceCompletion(language: LANGUAGE): CompletionSource {
  return async function (
    context: CompletionContext,
  ): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w+/)
    if (!word) return null

    const source: ChineseCompletion[] = [
      ...(language === "sql" ? buildSqlDynamicCompletions() : []),
      ...(chineseAnnotations[language] || []),
    ]

    const completions: Completion[] = source.map(
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
