import { ref } from "vue"
import { buildSetupSql, defaultSqlTableId, sqlTables } from "../data/sqlTables"

export const selectedTableId = ref(defaultSqlTableId)

export function resetSqlTableSelection() {
  selectedTableId.value = defaultSqlTableId
}

export function buildSqlScript(studentSql: string) {
  const table =
    sqlTables.find((item) => item.id === selectedTableId.value) ??
    sqlTables[0]
  const normalizedSql = studentSql.trim().replace(/;?\s*$/, ";")
  return `${buildSetupSql(table)}\n\n${normalizedSql}\n\nSELECT * FROM ${table.tableName};`
}
