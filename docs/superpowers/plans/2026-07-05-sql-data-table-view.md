# SQL 数据表格化展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-SQL-text preview and plain-text output in the SQL practice feature with real data tables, restructure the SQL layout to "code on top, two data tables side by side below", and eliminate the duplicate-output bug that occurs when a student's own SQL is itself a SELECT.

**Architecture:** Candidate table data moves from a literal SQL string to structured `columns`/`rows`; the setup SQL sent to Judge0 is generated from that structured data. The submitted script now wraps the student's own statement between `.output /dev/null` and `.output stdout` so only the final auto-appended `SELECT * FROM <table>;` ever reaches stdout — eliminating the "two copies of data" bug. `Content.vue` grows a dedicated vertical-split branch for the `sql` language (code on top, `SqlSection` below); `SqlSection.vue` becomes a horizontal split of two `n-data-table`s (initial data vs. post-run result, with the existing error UI as fallback when the run failed).

**Tech Stack:** Vue 3 + TypeScript, naive-ui's `n-data-table` (already a dependency, no new package needed).

Spec: `codenext/docs/superpowers/specs/2026-07-05-sql-data-table-view-design.md`

## Global Constraints

- No `codeapinew/` changes — this is 100% frontend, same Judge0 SQLite (`language_id=82`) submission path as before.
- `codenext/` has no frontend test framework — verify with `npm run build` (must succeed) plus manual browser verification via `npm run start`, same convention as the rest of this codebase.
- The generated setup SQL only needs to be semantically equivalent to the old literal strings, not byte-identical — e.g. a `REAL` column value written as `299` instead of `299.0` is an accepted cosmetic difference (SQLite has no functional distinction between them for a `REAL`-affinity column).
- Every preset table's first column is `id` — this plan uses that as the `n-data-table` row key. Do not add a preset without an `id` first column without revisiting this assumption.
- No automated grading, no diff highlighting — carried over from the original feature spec, unaffected by this plan.

---

### Task 1: Structured candidate-table data model

**Files:**
- Modify: `codenext/src/data/sqlTables.ts` (full rewrite)

**Interfaces:**
- Produces:
  - `interface SqlColumn { name: string; type: string }`
  - `interface SqlTablePreset { id: string; label: string; tableName: string; columns: SqlColumn[]; rows: (string | number)[][] }` (replaces the old `setupSql: string` field)
  - `toSqlLiteral(value: string | number): string`
  - `buildSetupSql(table: SqlTablePreset): string`
  - `sqlTables: SqlTablePreset[]` (same 3 presets: students/employees/products, same data values, now structured)
  - `defaultSqlTableId: string` (unchanged, `"students"`)
- Consumes: nothing from other tasks (foundational, same as before).

- [ ] **Step 1: Rewrite `sqlTables.ts` with the structured model**

Replace the full contents of `codenext/src/data/sqlTables.ts` with:

```typescript
export interface SqlColumn {
  name: string
  type: string
}

export interface SqlTablePreset {
  id: string
  label: string
  tableName: string
  columns: SqlColumn[]
  rows: (string | number)[][]
}

export function toSqlLiteral(value: string | number): string {
  if (typeof value === "number") return String(value)
  return `'${value.replace(/'/g, "''")}'`
}

export function buildSetupSql(table: SqlTablePreset): string {
  const columnDefs = table.columns
    .map((column) => `${column.name} ${column.type}`)
    .join(",\n  ")
  const columnNames = table.columns.map((column) => column.name).join(", ")
  const valuesList = table.rows
    .map((row) => `(${row.map(toSqlLiteral).join(", ")})`)
    .join(",\n  ")
  return `CREATE TABLE ${table.tableName} (\n  ${columnDefs}\n);\n\nINSERT INTO ${table.tableName} (${columnNames}) VALUES\n  ${valuesList};`
}

export const sqlTables: SqlTablePreset[] = [
  {
    id: "students",
    label: "学生成绩表",
    tableName: "students",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "name", type: "TEXT NOT NULL" },
      { name: "class", type: "TEXT NOT NULL" },
      { name: "score", type: "INTEGER NOT NULL" },
    ],
    rows: [
      [1, "张伟", "一班", 92],
      [2, "王芳", "一班", 58],
      [3, "李娜", "二班", 76],
      [4, "刘洋", "二班", 45],
      [5, "陈静", "一班", 88],
      [6, "杨帆", "三班", 63],
      [7, "赵敏", "二班", 39],
      [8, "孙涛", "三班", 81],
    ],
  },
  {
    id: "employees",
    label: "员工工资表",
    tableName: "employees",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "name", type: "TEXT NOT NULL" },
      { name: "department", type: "TEXT NOT NULL" },
      { name: "salary", type: "INTEGER NOT NULL" },
      { name: "hire_date", type: "TEXT NOT NULL" },
    ],
    rows: [
      [1, "周明", "技术部", 12000, "2019-03-01"],
      [2, "吴倩", "市场部", 8000, "2021-07-15"],
      [3, "郑凯", "技术部", 15500, "2017-11-20"],
      [4, "钱多多", "财务部", 9200, "2020-01-10"],
      [5, "孙丽", "市场部", 7600, "2022-05-30"],
      [6, "李强", "技术部", 10800, "2023-09-01"],
      [7, "林小雨", "财务部", 8900, "2018-06-12"],
      [8, "黄河", "市场部", 6800, "2024-02-18"],
    ],
  },
  {
    id: "products",
    label: "商品库存表",
    tableName: "products",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "name", type: "TEXT NOT NULL" },
      { name: "category", type: "TEXT NOT NULL" },
      { name: "price", type: "REAL NOT NULL" },
      { name: "stock", type: "INTEGER NOT NULL" },
    ],
    rows: [
      [1, "无线鼠标", "电子产品", 59.9, 120],
      [2, "机械键盘", "电子产品", 299.0, 45],
      [3, "保温杯", "生活用品", 39.5, 0],
      [4, "笔记本", "文具", 12.0, 300],
      [5, "蓝牙耳机", "电子产品", 199.0, 0],
      [6, "台灯", "生活用品", 89.0, 60],
      [7, "钢笔", "文具", 25.0, 150],
      [8, "充电宝", "电子产品", 129.0, 8],
    ],
  },
]

export const defaultSqlTableId = sqlTables[0].id
```

- [ ] **Step 2: Fix the one compile error this rewrite creates**

`src/composables/sqlTable.ts` currently reads `table.setupSql`, a field that no longer exists on `SqlTablePreset` after Step 1. Make a **minimal** compatibility edit: change that one reference to `buildSetupSql(table)`, and add `buildSetupSql` to its existing import from `"../data/sqlTables"`. Do not touch anything else in `sqlTable.ts` — the rest of its rework happens in Task 2.

- [ ] **Step 3: Verify the build succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd codenext
git add src/data/sqlTables.ts src/composables/sqlTable.ts
git commit -m "feat: structure candidate SQL table data as columns/rows"
```

---

### Task 2: Script building with output isolation + result parsing

**Files:**
- Modify: `codenext/src/composables/sqlTable.ts` (full rewrite)

**Interfaces:**
- Consumes: `buildSetupSql`, `SqlColumn`, `defaultSqlTableId`, `sqlTables` from Task 1's `../data/sqlTables`.
- Produces:
  - `selectedTableId: Ref<string>` (unchanged from before)
  - `resetSqlTableSelection(): void` (unchanged from before)
  - `buildSqlScript(studentSql: string): string` — same name/signature as before, new internals (wraps student SQL with `.output /dev/null` / `.output stdout`)
  - `parseResultRows(output: string, columns: SqlColumn[]): Record<string, string | number>[]` (new — used by Task 3's `SqlSection.vue`)

- [ ] **Step 1: Rewrite `sqlTable.ts`**

Replace the full contents of `codenext/src/composables/sqlTable.ts` with:

```typescript
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
```

This supersedes Task 1's minimal compatibility edit to this same file — the end state of this file is exactly the code above, nothing carried over from the old version except `selectedTableId`/`resetSqlTableSelection` (unchanged) and the `buildSqlScript` name/signature (unchanged externally, new internals).

- [ ] **Step 2: Fix the one compile error this rewrite creates**

`SqlSection.vue` currently passes `selectedTable.setupSql` (the field Task 1's Step 2 compatibility edit changed to `buildSetupSql(table)` at the call site inside `sqlTable.ts` — but `SqlSection.vue` itself still separately reads `selectedTable.setupSql` directly for its read-only preview). Make a **minimal** patch in `codenext/src/desktop/SqlSection.vue`: change that one reference to `buildSetupSql(selectedTable)`, importing `buildSetupSql` from `"../data/sqlTables"`. Do not otherwise change `SqlSection.vue`'s structure — the full rewrite happens in Task 3.

- [ ] **Step 3: Verify the build succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd codenext
git add src/composables/sqlTable.ts src/desktop/SqlSection.vue
git commit -m "feat: isolate student SQL output and add result-row parsing"
```

---

### Task 3: Two-table layout (Content.vue + SqlSection.vue rewrite)

**Files:**
- Modify: `codenext/src/desktop/Content.vue` (full rewrite)
- Modify: `codenext/src/desktop/SqlSection.vue` (full rewrite)

**Interfaces:**
- Consumes: `parseResultRows`, `selectedTableId` from Task 2's `../composables/sqlTable`; `sqlTables` (with `columns`/`rows`) from Task 1's `../data/sqlTables`; `output`, `status` from `../composables/code` (pre-existing, unchanged); `Status` enum from `../types` (pre-existing, unchanged).
- Produces: the full end-to-end two-table SQL UI.

- [ ] **Step 1: Rewrite `Content.vue`**

Replace the full contents of `codenext/src/desktop/Content.vue` with:

```vue
<script lang="ts" setup>
import { code } from "../composables/code"
import CodeSection from "./CodeSection.vue"
import InputSection from "./InputSection.vue"
import OutputSection from "./OutputSection.vue"
import SqlSection from "./SqlSection.vue"
import TurtleSection from "./TurtleSection.vue"
</script>

<template>
  <n-layout-content class="container">
    <n-split
      v-if="code.language === 'sql'"
      direction="vertical"
      :default-size="3 / 5"
      :min="1 / 4"
      :max="3 / 4"
    >
      <template #1>
        <CodeSection />
      </template>
      <template #2>
        <SqlSection />
      </template>
    </n-split>
    <n-split v-else direction="horizontal" :min="1 / 3" :max="4 / 5">
      <template #1>
        <CodeSection />
      </template>
      <template #2>
        <n-split
          v-if="code.language !== 'turtle'"
          direction="vertical"
          :default-size="1 / 3"
          :min="1 / 5"
          :max="3 / 5"
        >
          <template #1>
            <InputSection />
          </template>
          <template #2>
            <OutputSection />
          </template>
        </n-split>
        <TurtleSection v-else />
      </template>
    </n-split>
  </n-layout-content>
</template>

<style scoped>
.container {
  height: calc(100vh - 60px);
}
</style>
```

Note the simplification: since the outer `v-if` now fully separates `sql` from everything else, the inner split's condition goes back to a simple `code.language !== 'turtle'` (no longer needs the `&& code.language !== 'sql'` clause, because `sql` never reaches this branch at all).

- [ ] **Step 2: Rewrite `SqlSection.vue`**

Replace the full contents of `codenext/src/desktop/SqlSection.vue` with:

```vue
<script lang="ts" setup>
import type { DataTableColumns } from "naive-ui"
import { computed, watch } from "vue"
import { output, status } from "../composables/code"
import { parseResultRows, selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import { Status } from "../types"
import OutputSection from "./OutputSection.vue"

const selectedTable = computed(
  () =>
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0],
)

const tableColumns = computed<DataTableColumns>(() =>
  selectedTable.value.columns.map((column) => ({
    title: column.name,
    key: column.name,
  })),
)

const initialRows = computed(() =>
  selectedTable.value.rows.map((row) =>
    Object.fromEntries(
      selectedTable.value.columns.map((column, index) => [
        column.name,
        row[index],
      ]),
    ),
  ),
)

const resultRows = computed(() =>
  parseResultRows(output.value, selectedTable.value.columns),
)

watch(selectedTableId, () => {
  output.value = ""
  status.value = Status.NotStarted
})
</script>

<template>
  <n-split
    direction="horizontal"
    :default-size="1 / 2"
    :min="1 / 4"
    :max="3 / 4"
  >
    <template #1>
      <div class="table-panel">
        <div class="panel-title">原始数据（{{ selectedTable.label }}）</div>
        <n-data-table
          size="small"
          :bordered="false"
          :columns="tableColumns"
          :data="initialRows"
          :row-key="(row: any) => row.id"
        />
      </div>
    </template>
    <template #2>
      <div class="table-panel" v-if="status === Status.Accepted">
        <div class="panel-title">运行后数据</div>
        <n-data-table
          size="small"
          :bordered="false"
          :columns="tableColumns"
          :data="resultRows"
          :row-key="(row: any) => row.id"
        />
      </div>
      <OutputSection v-else />
    </template>
  </n-split>
</template>

<style scoped>
.table-panel {
  height: 100%;
  overflow: auto;
  padding: 12px 20px;
  box-sizing: border-box;
}
.panel-title {
  font-size: 16px;
  margin-bottom: 8px;
}
</style>
```

Note the `watch(selectedTableId, ...)` now resets both `output` AND `status` (the pre-existing version, from the previous plan's review-fix round, only reset `output`). This is necessary now: without resetting `status`, switching tables while the previous table's last run was `Accepted` would leave the right pane trying to render `resultRows` — which re-parses the *old* `output` text against the *newly selected* table's columns, producing garbage. Resetting `status` to `NotStarted` correctly falls back to the (also-cleared) `OutputSection` instead.

- [ ] **Step 3: Verify the build succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully with no TypeScript/Vue errors.

- [ ] **Step 4: Manually verify the full end-to-end flow**

Run: `cd codenext && npm run start`, open `http://localhost:3000`.

1. Switch language to SQL. Confirm the layout is now top/bottom: a code editor on top (roughly 60% height), and below it two side-by-side panels — left "原始数据（学生成绩表）" showing an 8-row table with columns id/name/class/score matching the preset data, right panel empty (no run yet, falls back to the empty output box).
2. In the code editor, type `SELECT * FROM students;` (the student's own query is itself a SELECT — this is the exact scenario that used to produce duplicate output) and run.
3. **Confirm the right panel shows exactly one 8-row table** (not two copies concatenated, not 16 rows) — this is the specific bug this plan fixes. Cross-check the row count and values match the preset exactly (张伟 92, 王芳 58, ... 孙涛 81).
4. Type `UPDATE students SET score = 100 WHERE name = '王芳';` and run. Confirm the right table shows 王芳 with score 100 and all other rows unchanged, still exactly one table (not duplicated).
5. Switch the table dropdown (next to the language selector, top bar) to "员工工资表". Confirm: left panel immediately updates to the `employees` preset data (8 rows, id/name/department/salary/hire_date), right panel goes back to the empty fallback (proves the `status`/`output` reset-on-switch works — it should NOT show stale `students` data re-parsed against `employees` columns).
6. Type `DELETE FROM employees WHERE salary < 8000;` and run. Confirm the right table shows exactly 6 rows (孙丽 7600 and 黄河 6800 removed, 吴倩 8000 stays), still exactly one table.
7. Type intentionally broken SQL (e.g. `SELCT * FROM employees;`) and run. Confirm the right panel falls back to the existing error UI (运行失败 tag + 推测原因 button), NOT an empty or broken table — and the left panel's initial-data table is unaffected.
8. Resize the vertical split (drag the divider between code and tables) and the horizontal split (drag the divider between the two tables) — confirm both are draggable and don't break rendering.
9. Switch to a non-SQL language (e.g. C++) and confirm its layout (code left, input/output right) is completely unaffected by these changes.

If step 3 or 6 shows duplicated/doubled data, or step 7 shows a broken table instead of the error fallback, STOP and report BLOCKED/DONE_WITH_CONCERNS with exact details — these are the specific defects this plan exists to fix.

- [ ] **Step 5: Commit**

```bash
cd codenext
git add src/desktop/Content.vue src/desktop/SqlSection.vue
git commit -m "feat: render SQL initial/result data as tables in a two-pane layout"
```
