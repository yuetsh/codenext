import { ref } from "vue"
import { defaultSqlTableId, sqlTables } from "../data/sqlTables"

export const selectedTableId = ref(defaultSqlTableId)

export function resetSqlTableSelection() {
  selectedTableId.value = defaultSqlTableId
}

export function buildSqlScript(studentSql: string) {
  const table =
    sqlTables.find((item) => item.id === selectedTableId.value) ??
    sqlTables[0]
  return `${table.setupSql}\n\n${studentSql}\n\nSELECT * FROM ${table.tableName};`
}
