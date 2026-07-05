# SQL 数据表格化展示 设计文档

日期：2026-07-05

## 背景与目标

`2026-07-04-sql-crud-practice-design.md` 实现的 SQL 练习功能里，候选表的初始数据预览和执行结果都是纯文本/代码形式（读只 CodeEditor 显示 `CREATE TABLE`/`INSERT` 语句，输出框显示 Judge0 返回的纯文本）。但 SQL 练习真正关心的是"数据本身"，纯文本不够直观。本设计把这两处都换成真正的数据表格，同时调整整体布局。

## 范围

仅涉及 `codenext/`（前端）。不需要改动 `codeapinew/` 后端或 Judge0 提交方式（仍然是同一个 Judge0 SQLite 直连链路）。

## 数据模型改造

`src/data/sqlTables.ts` 里 `SqlTablePreset` 从"一整段写死的 SQL 字符串"改为结构化数据：

```typescript
export interface SqlColumn {
  name: string
  type: string // 如 "INTEGER PRIMARY KEY", "TEXT NOT NULL"
}

export interface SqlTablePreset {
  id: string
  label: string
  tableName: string
  columns: SqlColumn[]
  rows: (string | number)[][] // 每行一个数组，顺序对应 columns
}
```

新增两个纯函数（同文件导出）：

- `toSqlLiteral(value: string | number): string` — 数字原样转字符串，字符串加单引号并转义内部单引号。
- `buildSetupSql(table: SqlTablePreset): string` — 用 `columns`/`rows` 拼出 `CREATE TABLE ... ; INSERT INTO ... VALUES ...;`，供提交 Judge0 时使用（原先这段是写死的字符串常量，现在改为运行时生成，生成结果在语义上与原常量等价）。

3 张候选表（students/employees/products）的列结构和数据值保持不变，只是从字符串形式换成结构化形式。

## 布局改造

SQL 语言不再复用其他语言共用的"左代码、右内容"横向分栏模板，改为在 `Content.vue` 里单独走一条纵向分栏分支：

```
Content.vue（language === "sql" 分支）：
┌─────────────────────────────┐
│         CodeSection         │  ← 上：SQL 输入框（全宽），default-size 3/5
├───────────────┬─────────────┤
│  原始数据表    │  运行后数据表 │  ← 下：SqlSection 内部横向 n-split，各占一半
└───────────────┴─────────────┘
```

- 顶层 `n-split direction="vertical"`：`v-if="code.language === 'sql'"` 时 `#1=CodeSection`、`#2=SqlSection`；其余语言维持原有 `n-split direction="horizontal"` 分支（CodeSection + 各自的右侧内容），不受影响。
- `SqlSection.vue` 内部改为横向 `n-split`：`#1` 渲染候选表的初始数据（`n-data-table`），`#2` 渲染运行结果（成功时 `n-data-table`，失败时回退现有 `OutputSection`）。
- 表格组件统一用 naive-ui 的 `n-data-table`（已是现有依赖，自动适配深浅色主题）。
- 顶部语言选择器旁边的候选表下拉框（`SelectSqlTable.vue`，已在上一版实现）位置不变。

## 运行结果解析与去重

**问题**：原先脚本拼接方式是 `setupSql + 学生SQL + 追加的 SELECT * FROM 表;`。如果学生自己写的语句也是 SELECT（对初学者来说非常常见，比如上来就写 `SELECT * FROM students;`），Judge0 返回的 stdout 会包含两段几乎重复的结果——学生自己查询的输出，加上自动追加查询的输出——纯文本时代不易察觉，表格化后会非常明显地表现为"重复的两组数据"。

**解决方案**：利用 sqlite3 CLI 支持在同一份输入脚本里混用点命令的特性，在学生语句执行前后临时静默输出：

```
<setupSql>

.output /dev/null

<学生的 SQL（规范化，确保以且仅以一个分号结尾）>

.output stdout

SELECT * FROM <表名>;
```

`.output /dev/null` 只重定向"查询结果"的输出目标，不影响 sqlite3 shell 报错信息（走 stderr，仍会被 Judge0 的 `redirect_stderr_to_stdout: true` 合并进 stdout）。这样无论学生写什么语句，stdout 里能看到的查询结果永远只有最后那条自动追加的 `SELECT * FROM 表;`，彻底消除重复问题，也不需要任何"猜哪一段是最终结果"的启发式解析。

`buildSqlScript`（`src/composables/sqlTable.ts`）改为按上述模板拼接。

**解析**（新增 `parseResultRows(output: string, columns: SqlColumn[])`，与 `buildSqlScript` 同文件）：状态为 `Accepted` 时，把 `output` 按行分割、去空行，每行按 `|` 切开，按 `columns` 顺序映射成对象数组，直接喂给 `n-data-table`。状态非 `Accepted`（SQL 写错）时，右侧不解析、不渲染表格，回退显示现有的 `OutputSection`（错误文本 + "运行失败" 标签 + AI"推测原因"面板，和 C/C++ 报错一致）。

## 已排除的方案（非目标）

- 不再展示原始 `CREATE TABLE`/`INSERT` 语句文本（连列类型都不单独展示）——这是本次改造的明确取舍，学生只看数据本身，不看 DDL。
- 不改变判题/评分方式——依然是纯观察沙箱，无自动判分。
- 不改变执行方式——依然是每次从预设数据重新执行、不做多语句持久会话（沿用上一版设计）。

## 测试计划

- 手动验证（浏览器 + 真实 Judge0）：
  - 切换到 SQL，确认布局为上下结构（上：代码框；下：左原始数据表、右空结果表）
  - 对 students 表执行 `UPDATE`，确认右侧表格只显示一份最终数据，且改动的行是对的
  - 学生自己写 `SELECT * FROM students;` 再运行，确认右侧表格**不再出现重复的两组数据**（这是本次改造要修的问题）
  - 切换候选表，确认左右两个表格都随之更新
  - 故意写错 SQL，确认右侧回退为现有错误文本/AI 推测面板，左侧原始数据表不受影响
- 回归：确认其他语言（python/c/cpp/turtle）的布局和行为不受影响（`Content.vue` 的改动只新增了 sql 专属分支，其余分支原样保留）
