/// <reference lib="webworker" />

import initSqlJs, { type Database } from "sql.js"

type RunRequest = {
  setup: string
  sql: string
  // 增删改语句执行后回显的表名；查询语句为 null，直接展示查询结果
  echoTable: string | null
}

type RunResponse = {
  status: number
  output: string
}

// 取最后一条有结果列的语句（没有数据行时也保留列名）
function lastResult(db: Database, sql: string) {
  let result: { columns: string[]; rows: unknown[][] } | null = null
  for (const stmt of db.iterateStatements(sql)) {
    const columns = stmt.getColumnNames()
    if (columns.length === 0) {
      stmt.step()
      continue
    }
    const rows: unknown[][] = []
    while (stmt.step()) rows.push(stmt.get())
    result = { columns, rows }
  }
  return result
}

// 与 sqlite CLI 的 list 模式 + .headers on 一致：首行列名，| 分隔
function format(result: { columns: string[]; rows: unknown[][] } | null) {
  if (!result) return ""
  return [result.columns, ...result.rows]
    .map((row) => row.map((value) => value ?? "").join("|"))
    .join("\n")
}

const wasmUrl = new URL("sql.js/dist/sql-wasm-browser.wasm", import.meta.url)
  .href
const ready = initSqlJs({ locateFile: () => wasmUrl })
ready.then(
  () => (self as any).postMessage({ ready: true }),
  () =>
    (self as any).postMessage({
      status: 11,
      output: "SQL 引擎加载失败",
    } satisfies RunResponse),
)

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { setup, sql, echoTable } = event.data
  const SQL = await ready
  const db = new SQL.Database()
  try {
    db.run(setup)
    let result = lastResult(db, sql)
    if (echoTable) result = lastResult(db, `SELECT * FROM ${echoTable};`)
    ;(self as any).postMessage({
      status: 3,
      output: format(result),
    } satisfies RunResponse)
  } catch (err: any) {
    ;(self as any).postMessage({
      status: 11,
      output: String(err?.message ?? err),
    } satisfies RunResponse)
  } finally {
    db.close()
  }
}
