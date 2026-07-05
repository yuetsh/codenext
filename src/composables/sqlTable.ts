import { ref } from "vue"
import {
  buildSetupSql,
  defaultSqlTableId,
  sqlTables,
} from "../data/sqlTables"

export const selectedTableId = ref(defaultSqlTableId)

export function resetSqlTableSelection() {
  selectedTableId.value = defaultSqlTableId
}

// SELECT / WITH 属于查询，直接展示查询结果的列；其余（增删改）回显整张表
function isQuery(sql: string): boolean {
  return /^\s*(SELECT|WITH)\b/i.test(sql)
}

export function buildSqlScript(studentSql: string) {
  const table =
    sqlTables.find((item) => item.id === selectedTableId.value) ??
    sqlTables[0]
  const normalizedSql = studentSql.trim().replace(/;?\s*$/, ";")
  if (isQuery(studentSql.trim())) {
    return [buildSetupSql(table), ".headers on", normalizedSql].join("\n\n")
  }
  return [
    buildSetupSql(table),
    ".output /dev/null",
    normalizedSql,
    ".output stdout",
    ".headers on",
    `SELECT * FROM ${table.tableName};`,
  ].join("\n\n")
}

export interface SqlResult {
  columns: string[]
  rows: Record<string, string | number>[]
}

// 输出为 sqlite CLI 的 list 模式（| 分隔），开启 .headers on 后首行是列名
export function parseResult(output: string): SqlResult {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return { columns: [], rows: [] }
  const columns = lines[0].split("|")
  const rows = lines.slice(1).map((line, index) => {
    const cells = line.split("|")
    const record: Record<string, string | number> = { __key: index }
    columns.forEach((column, i) => {
      record[column] = cells[i] ?? ""
    })
    return record
  })
  return { columns, rows }
}
