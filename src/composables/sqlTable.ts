import { ref } from "vue"
import {
  buildSetupSql,
  defaultSqlTableId,
  sqlTables,
  type SqlColumn,
} from "../data/sqlTables"

export const selectedTableId = ref(defaultSqlTableId)

export function resetSqlTableSelection() {
  selectedTableId.value = defaultSqlTableId
}

export function buildSqlScript(studentSql: string) {
  const table =
    sqlTables.find((item) => item.id === selectedTableId.value) ??
    sqlTables[0]
  const normalizedSql = studentSql.trim().replace(/;?\s*$/, ";")
  return [
    buildSetupSql(table),
    ".output /dev/null",
    normalizedSql,
    ".output stdout",
    `SELECT * FROM ${table.tableName};`,
  ].join("\n\n")
}

export function parseResultRows(
  output: string,
  columns: SqlColumn[],
): Record<string, string | number>[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split("|")
      return Object.fromEntries(
        columns.map((column, index) => [column.name, cells[index] ?? ""]),
      )
    })
}
