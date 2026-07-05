# SQL 增删改查练习功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students pick one of three preset teaching tables, write SQL against it in the existing code editor, and see the table's resulting state after execution — with no automated grading, just observation for the teacher.

**Architecture:** SQL is wired in as a new language alongside python/c/cpp/turtle. Frontend composes `<preset setup SQL> + <student SQL> + SELECT * FROM <table>;` and submits it through the existing Judge0 pipeline (`language_id=82`, SQLite) — no backend changes for execution. A small backend addition (`sqlparse`) extends the existing generic `/format` endpoint to support SQL too.

**Tech Stack:** Vue 3 + TypeScript + CodeMirror 6 (`@codemirror/lang-sql`) on the frontend; Python `sqlparse` library on the backend (FastAPI).

Spec: `codenext/docs/superpowers/specs/2026-07-04-sql-crud-practice-design.md`

## Global Constraints

- SQL execution requires **zero** `codeapinew/` changes — it reuses the existing Judge0 direct-call path (`languageToId["sql"] = 82`).
- Every run always starts from the preset's initial data (`setupSql`) — no persistent/accumulating session across runs.
- After the student's SQL runs, always append `SELECT * FROM <table>;` to show the final table state, regardless of whether the student wrote SELECT/INSERT/UPDATE/DELETE.
- No automated grading, no answer comparison, no before/after diff highlighting — just show the raw post-execution output text (reuse existing `OutputSection`, plain text).
- Mobile excludes `"sql"` from the language selector, exactly like the existing `"turtle"` exclusion (mobile has no split-pane layout to host a table-picker + preview).
- `codenext/` has no frontend test framework (no vitest/jest configured). Verify frontend tasks with `npm run build` (must succeed) plus manual browser verification via `npm run start` — do not introduce a new test runner.
- `codeapinew/` already has `pytest` + `test_formatter.py` — use real TDD (red/green) for the backend task.
- Risk carried from the spec: the self-hosted Judge0 instance's support for `language_id=82` (SQLite) has not been verified from code. This plan does not block on it, but Task 4's manual verification step is where it will surface if the image isn't enabled.

---

### Task 1: Add `sql` language plumbing (types, Judge0 id, source, cache, share whitelist)

**Files:**
- Modify: `codenext/src/types.ts:3`
- Modify: `codenext/src/templates.ts:1-33`
- Modify: `codenext/src/composables/code.ts:13-23,74-76`

**Interfaces:**
- Produces: `LANGUAGE` type now includes `"sql"`; `languageToId["sql"] === 82`; `sources.sql` (default placeholder source, used to seed `cache.code.sql` and `reset()`).
- Consumes: nothing from other tasks (foundational).

- [ ] **Step 1: Add `"sql"` to the `LANGUAGE` union**

Edit `codenext/src/types.ts:3`:

```typescript
export type LANGUAGE = "c" | "python" | "cpp" | "turtle" | "sql"
```

- [ ] **Step 2: Add the Judge0 language id and default source for SQL**

Edit `codenext/src/templates.ts`. Add a new source constant near the top (after `turtleSource`):

```typescript
const sqlSource = "-- 在这里编写你的 SQL 语句\n"
```

Update `languageToId` and `sources`:

```typescript
export const languageToId: { [key in string]: number } = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
  sql: 82,
}

export const sources = {
  c: cSource,
  cpp: cppSource,
  java: javaSource,
  python: pythonSource,
  turtle: turtleSource,
  sql: sqlSource,
}
```

- [ ] **Step 3: Add `sql` to the code cache and the share-link language whitelist**

Edit `codenext/src/composables/code.ts`. In the `cache` object (around line 17-22), add:

```typescript
  code: {
    python: useStorage("code_python", sources["python"]),
    c: useStorage("code_c", sources["c"]),
    cpp: useStorage("code_cpp", sources["cpp"]),
    turtle: useStorage("code_turtle", sources["turtle"]),
    sql: useStorage("code_sql", sources["sql"]),
  },
```

In `init()` (around line 74), extend the whitelist:

```typescript
      const lang = ["python", "c", "cpp", "turtle", "sql"].includes(data.lang)
        ? (data.lang as LANGUAGE)
        : defaultLanguage
```

- [ ] **Step 4: Verify the build still succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully (same output shape as before — no new UI is reachable yet since `SelectLanguage.vue` doesn't offer `"sql"` until Task 3).

- [ ] **Step 5: Commit**

```bash
cd codenext
git add src/types.ts src/templates.ts src/composables/code.ts
git commit -m "feat: add sql to LANGUAGE type, Judge0 mapping, and code cache"
```

---

### Task 2: Candidate table data + `sqlTable` composable

**Files:**
- Create: `codenext/src/data/sqlTables.ts`
- Create: `codenext/src/composables/sqlTable.ts`
- Modify: `codenext/src/composables/code.ts:40-48,106-126`

**Interfaces:**
- Consumes: `LANGUAGE` type from Task 1 (already includes `"sql"`).
- Produces:
  - `SqlTablePreset` interface: `{ id: string; label: string; description: string; tableName: string; setupSql: string }`
  - `sqlTables: SqlTablePreset[]` (3 presets: `students`, `employees`, `products`)
  - `defaultSqlTableId: string` (equals `sqlTables[0].id`, i.e. `"students"`)
  - `selectedTableId: Ref<string>` (current candidate table selection, used by `SqlSection.vue` in Task 4)
  - `resetSqlTableSelection(): void`
  - `buildSqlScript(studentSql: string): string` — used by `run()` in this task

- [ ] **Step 1: Create the candidate table data file**

Create `codenext/src/data/sqlTables.ts`:

```typescript
export interface SqlTablePreset {
  id: string
  label: string
  description: string
  tableName: string
  setupSql: string
}

const studentsSetupSql = `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  score INTEGER NOT NULL
);

INSERT INTO students (id, name, class, score) VALUES
  (1, '张伟', '一班', 92),
  (2, '王芳', '一班', 58),
  (3, '李娜', '二班', 76),
  (4, '刘洋', '二班', 45),
  (5, '陈静', '一班', 88),
  (6, '杨帆', '三班', 63),
  (7, '赵敏', '二班', 39),
  (8, '孙涛', '三班', 81);`

const employeesSetupSql = `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL
);

INSERT INTO employees (id, name, department, salary, hire_date) VALUES
  (1, '周明', '技术部', 12000, '2019-03-01'),
  (2, '吴倩', '市场部', 8000, '2021-07-15'),
  (3, '郑凯', '技术部', 15500, '2017-11-20'),
  (4, '钱多多', '财务部', 9200, '2020-01-10'),
  (5, '孙丽', '市场部', 7600, '2022-05-30'),
  (6, '李强', '技术部', 10800, '2023-09-01'),
  (7, '林小雨', '财务部', 8900, '2018-06-12'),
  (8, '黄河', '市场部', 6800, '2024-02-18');`

const productsSetupSql = `CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL
);

INSERT INTO products (id, name, category, price, stock) VALUES
  (1, '无线鼠标', '电子产品', 59.9, 120),
  (2, '机械键盘', '电子产品', 299.0, 45),
  (3, '保温杯', '生活用品', 39.5, 0),
  (4, '笔记本', '文具', 12.0, 300),
  (5, '蓝牙耳机', '电子产品', 199.0, 0),
  (6, '台灯', '生活用品', 89.0, 60),
  (7, '钢笔', '文具', 25.0, 150),
  (8, '充电宝', '电子产品', 129.0, 8);`

export const sqlTables: SqlTablePreset[] = [
  {
    id: "students",
    label: "学生成绩表",
    description: "适合练习按分数筛选、批量更新、删除不及格记录",
    tableName: "students",
    setupSql: studentsSetupSql,
  },
  {
    id: "employees",
    label: "员工工资表",
    description: "适合练习按部门分组调薪、按入职日期筛选",
    tableName: "employees",
    setupSql: employeesSetupSql,
  },
  {
    id: "products",
    label: "商品库存表",
    description: "适合练习新增商品、调整库存、下架缺货商品",
    tableName: "products",
    setupSql: productsSetupSql,
  },
]

export const defaultSqlTableId = sqlTables[0].id
```

- [ ] **Step 2: Create the `sqlTable` composable**

Create `codenext/src/composables/sqlTable.ts`:

```typescript
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
```

- [ ] **Step 3: Wire the composable into `code.ts`'s language switch and `run()`**

Edit `codenext/src/composables/code.ts`. Add the import at the top:

```typescript
import { buildSqlScript, resetSqlTableSelection } from "./sqlTable"
```

Update the language watcher (around line 40-48) to reset the table selection when switching into SQL:

```typescript
watch(
  () => code.language,
  (value: LANGUAGE) => {
    cache.language.value = value
    code.value = cache.code[value].value
    output.value = ""
    status.value = Status.NotStarted
    if (value === "sql") resetSqlTableSelection()
  },
)
```

Update `run()` (around line 106-126) to build the combined script for SQL:

```typescript
export async function run() {
  loading.value = true
  const cleanCode = code.value.trim()
  if (!cleanCode) {
    loading.value = false
    return
  }
  if (code.language === "turtle") {
    turtleRunId.value++
  } else {
    output.value = ""
    status.value = Status.NotStarted
    const sourceCode =
      code.language === "sql" ? buildSqlScript(cleanCode) : cleanCode
    const result = await submit(
      { value: sourceCode, language: code.language },
      input.value.trim(),
    )
    output.value = result.output || ""
    status.value = result.status
  }
  loading.value = false
}
```

- [ ] **Step 4: Verify the build still succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully. (Behavioral verification of `buildSqlScript`/`run()` happens end-to-end in Task 4, once the UI can reach the SQL language.)

- [ ] **Step 5: Commit**

```bash
cd codenext
git add src/data/sqlTables.ts src/composables/sqlTable.ts src/composables/code.ts
git commit -m "feat: add candidate SQL table presets and script-building composable"
```

---

### Task 3: Editor & language selector UI (make SQL selectable + syntax highlighted)

**Files:**
- Modify: `codenext/package.json`
- Modify: `codenext/src/components/CodeEditor.vue:1-61`
- Modify: `codenext/src/components/SelectLanguage.vue:7-25`
- Create: `codenext/public/sql.svg`

**Interfaces:**
- Consumes: `LANGUAGE` type from Task 1 (`"sql"` already valid).
- Produces: `"sql"` becomes selectable in `SelectLanguage.vue`'s dropdown (desktop only); `CodeEditor.vue` renders SQL syntax highlighting when `language === "sql"`.

- [ ] **Step 1: Install the CodeMirror SQL language package**

Run: `cd codenext && npm install @codemirror/lang-sql`
Expected: `package.json` gains a new dependency entry under `"@codemirror/lang-sql"` (npm resolves the version; do not hand-pick a version number).

- [ ] **Step 2: Add SQL syntax highlighting to `CodeEditor.vue`**

Edit `codenext/src/components/CodeEditor.vue`. Add the import near the other `@codemirror/lang-*` imports (line 2-3):

```typescript
import { sql } from "@codemirror/lang-sql"
```

Update `langExtension` (line 56-61):

```typescript
const langExtension = computed(() => {
  if (props.language === "python" || props.language === "turtle") {
    return python()
  }
  if (props.language === "sql") {
    return sql()
  }
  return cpp()
})
```

- [ ] **Step 3: Add the SQL option to the language selector, excluded on mobile like turtle**

Edit `codenext/src/components/SelectLanguage.vue`. Update `allLangs` and the mobile filter (line 7-18):

```typescript
const LANGS = computed(() => {
  const allLangs = [
    ["python", "Python"],
    ["turtle", "海龟绘图"],
    ["c", "C 语言"],
    ["cpp", "C++"],
    ["sql", "SQL"],
  ]
  if (isMobile.value) {
    return allLangs.filter(([lang]) => lang !== "turtle" && lang !== "sql")
  }
  return allLangs
})
```

Update the mobile auto-switch watcher (line 20-25) to also cover SQL:

```typescript
// 如果当前在移动端且语言是海龟绘图或 SQL，自动切换到 Python
watch(isMobile, (mobile) => {
  if (mobile && (code.language === "turtle" || code.language === "sql")) {
    code.language = "python"
  }
})
```

- [ ] **Step 4: Add the SQL language icon**

Create `codenext/public/sql.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="#a9b9cb" d="M12 3c-4.97 0-9 1.343-9 3v12c0 1.657 4.03 3 9 3s9-1.343 9-3V6c0-1.657-4.03-3-9-3z"/><path fill="#7f8b99" d="M3 6v3c0 1.657 4.03 3 9 3s9-1.343 9-3V6c0 1.657-4.03 3-9 3S3 7.657 3 6z"/><path fill="#7f8b99" d="M3 11v3c0 1.657 4.03 3 9 3s9-1.343 9-3v-3c0 1.657-4.03 3-9 3s-9-1.343-9-3z"/></svg>
```

- [ ] **Step 5: Verify the build succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully.

- [ ] **Step 6: Manually verify the language selector and syntax highlighting**

Run: `cd codenext && npm run start`, open `http://localhost:3000` in a browser.
- Open the language dropdown (desktop layout) — confirm "SQL" appears with the new icon and is selectable.
- Select SQL — confirm the editor now does SQL syntax highlighting (keywords colored) instead of C++ highlighting.
- Shrink the window to mobile width (or use device toolbar) — confirm "SQL" is absent from the dropdown, matching turtle's existing mobile behavior.

- [ ] **Step 7: Commit**

```bash
cd codenext
git add package.json package-lock.json src/components/CodeEditor.vue src/components/SelectLanguage.vue public/sql.svg
git commit -m "feat: make SQL selectable as a language with syntax highlighting"
```

---

### Task 4: `SqlSection` UI + `Content.vue` wiring (end-to-end feature)

**Files:**
- Create: `codenext/src/desktop/SqlSection.vue`
- Modify: `codenext/src/desktop/Content.vue`

**Interfaces:**
- Consumes: `selectedTableId`, `sqlTables` (Task 2); `code.language`, `run()` (Task 1/2, via `composables/code.ts`); `OutputSection.vue` (existing, unmodified).
- Produces: fully working SQL practice flow reachable from the desktop UI.

- [ ] **Step 1: Create `SqlSection.vue`**

Create `codenext/src/desktop/SqlSection.vue`:

```vue
<script lang="ts" setup>
import { computed } from "vue"
import CodeEditor from "../components/CodeEditor.vue"
import { selectedTableId } from "../composables/sqlTable"
import { sqlTables } from "../data/sqlTables"
import OutputSection from "./OutputSection.vue"

const tableOptions = computed(() =>
  sqlTables.map((table) => ({ value: table.id, label: table.label })),
)

const selectedTable = computed(
  () =>
    sqlTables.find((table) => table.id === selectedTableId.value) ??
    sqlTables[0],
)
</script>

<template>
  <n-flex vertical class="sql-section">
    <n-select
      class="table-select"
      v-model:value="selectedTableId"
      :options="tableOptions"
    />
    <n-split
      direction="vertical"
      :default-size="1 / 3"
      :min="1 / 5"
      :max="3 / 5"
    >
      <template #1>
        <CodeEditor
          :model-value="selectedTable.setupSql"
          language="sql"
          readonly
          label="表结构与初始数据"
        />
      </template>
      <template #2>
        <OutputSection />
      </template>
    </n-split>
  </n-flex>
</template>

<style scoped>
.sql-section {
  height: 100%;
}
.table-select {
  margin: 12px 20px 0;
  width: 160px;
}
</style>
```

- [ ] **Step 2: Wire `SqlSection` into `Content.vue`**

Edit `codenext/src/desktop/Content.vue`:

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
    <n-split direction="horizontal" :min="1 / 3" :max="4 / 5">
      <template #1>
        <CodeSection />
      </template>
      <template #2>
        <n-split
          v-if="code.language !== 'turtle' && code.language !== 'sql'"
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
        <TurtleSection v-else-if="code.language === 'turtle'" />
        <SqlSection v-else />
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

- [ ] **Step 3: Verify the build succeeds**

Run: `cd codenext && npm run build`
Expected: build completes successfully.

- [ ] **Step 4: Manually verify the full end-to-end flow**

Run: `cd codenext && npm run start`, open `http://localhost:3000`.
1. Switch language to SQL. Confirm the right pane now shows: a table dropdown (defaulting to "学生成绩表"), a read-only preview of the `students` setup SQL below it, and an (empty) output panel at the bottom.
2. In the left editor, type: `UPDATE students SET score = 100 WHERE name = '王芳';`
3. Click run (or press F5). Confirm the output panel shows the full `students` table with 王芳's score now `100` and all other rows unchanged.
4. Switch the table dropdown to "员工工资表". Confirm the preview panel updates to show the `employees` setup SQL.
5. Type `DELETE FROM employees WHERE salary < 8000;` and run. Confirm the output shows the `employees` table with the two lowest-salary rows (吴倩 8000 stays if not `<` 8000 — confirm rows below 8000, i.e. 孙丽 7600 and 黄河 6800, are gone) and the rest intact.
6. Re-run without changing anything. Confirm the result is identical each time (proves it always restarts from the preset data rather than accumulating state).
7. Type intentionally broken SQL (e.g. `SELCT * FROM students;`) and run. Confirm an error surfaces through the existing error/AI-analysis UI, the same way a C/C++ compile error would.
8. **If this step fails with a Judge0 "language not supported" error:** this surfaces the risk noted in the spec — the self-hosted Judge0 instance needs `language_id=82` (SQLite) enabled. Stop and flag this to the user; it's an infra fix, not a code fix.

- [ ] **Step 5: Commit**

```bash
cd codenext
git add src/desktop/SqlSection.vue src/desktop/Content.vue
git commit -m "feat: add SqlSection UI wired into the desktop editor layout"
```

---

### Task 5: Backend SQL formatting via `sqlparse`

**Files:**
- Modify: `codeapinew/formatter.py`
- Modify: `codeapinew/pyproject.toml`
- Modify: `codeapinew/requirements.txt`
- Modify: `codeapinew/test_formatter.py`

**Interfaces:**
- Consumes: nothing from other tasks (independent of the frontend tasks).
- Produces: `format_code(code, "sql")` returns sqlparse-formatted SQL instead of raising `FormatError`.

- [ ] **Step 1: Write the failing tests**

Add to `codeapinew/test_formatter.py`:

```python
def test_format_sql_uppercases_keywords():
    result = format_code("select * from students where score>60", "sql")
    assert result == "SELECT * FROM students WHERE score>60"


def test_format_sql_splits_multiple_statements():
    result = format_code(
        "delete from students where score<60;insert into students (id) values (9);",
        "sql",
    )
    assert result == (
        "DELETE FROM students WHERE score<60;\n\n"
        "INSERT INTO students (id) VALUES (9);"
    )


def test_format_sql_tolerates_syntax_errors():
    result = format_code("select from where", "sql")
    assert result == "SELECT FROM WHERE"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd codeapinew && uv run pytest test_formatter.py -v -k sql`
Expected: 3 failures — `format_code` raises `FormatError: 不支持的语言: sql` (the `sql` branch doesn't exist yet).

- [ ] **Step 3: Add the `sqlparse` dependency**

Run: `cd codeapinew && uv add sqlparse`
Expected: `pyproject.toml` gains `sqlparse` under `dependencies`, `uv.lock` updates.

Check the resolved version:

Run: `grep sqlparse pyproject.toml uv.lock | head -5`

Add the matching pinned entry to `codeapinew/requirements.txt` (insert alphabetically, matching the existing pin style, e.g. `sqlparse==<resolved-version>`).

- [ ] **Step 4: Implement the `sql` branch in `formatter.py`**

Edit `codeapinew/formatter.py`. Add the import at the top:

```python
import sqlparse
```

Add the helper function (near `_run`, before `format_code`):

```python
def _format_with_sql(code: str) -> str:
    # sqlparse 对语法错误宽容，不会抛异常，语法问题留给判题阶段反馈
    # strip_whitespace 会把多条语句压成一行，先按分号拆分再逐条格式化
    statements = sqlparse.split(code)
    return "\n\n".join(
        sqlparse.format(s, strip_whitespace=True, keyword_case="upper")
        for s in statements
    )
```

Add the branch inside `format_code` (before the final `raise FormatError`):

```python
    if language == "sql":
        return _format_with_sql(code)

```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd codeapinew && uv run pytest test_formatter.py -v`
Expected: all tests pass, including the 3 new `sql` tests and the pre-existing python/c/cpp/unsupported-language tests (no regressions).

- [ ] **Step 6: Commit**

```bash
cd codeapinew
git add formatter.py pyproject.toml uv.lock requirements.txt test_formatter.py
git commit -m "feat: format SQL code via sqlparse in the /format endpoint"
```
