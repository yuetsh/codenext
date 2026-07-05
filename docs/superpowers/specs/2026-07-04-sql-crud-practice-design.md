# SQL 增删改查练习功能 设计文档

日期：2026-07-04

## 背景与目标

老师需要在现有在线代码编辑器（codenext）中考察学生的 SQL 增删改查（CRUD）能力。功能不是自动判题/评分系统，而是一个"候选数据表 + SQL 执行 + 结果展示"的沙箱：学生从几张预设的教学表中选一张，写 SQL 语句，执行后看到该表的最终状态，由老师人工判断学生写得对不对。

## 范围

- 仅涉及 `codenext/`（前端）。`codeapinew/`（后端）不需要任何改动——SQL 执行复用现有的 Judge0 直连链路，与 C/C++ 的执行方式一致。
- 不做自动判题/评分、不做前后对比高亮、不做多语句持久会话。这些是明确排除的非目标（见"已排除的方案"）。

## 架构与执行流程

将 SQL 作为一门新语言接入现有语言体系（与 python / c / cpp / turtle 同级），复用 `api.ts` 中现有的 Judge0 提交链路。

每次点击"运行"时：

1. 学生已从候选表下拉框选定一张表（如 `students`）。
2. 学生在编辑器中只写自己的 SQL（如 `DELETE FROM students WHERE score < 60;`）。
3. 前端拼接完整脚本：`<该候选表的建表+初始数据 SQL>` + `\n` + `<学生的 SQL>` + `\n` + `SELECT * FROM <该表名>;`（自动追加）。
4. 整体脚本作为 source，以 `language_id = 82`（Judge0 的 SQLite）提交执行。
5. 每次提交都是全新的临时 SQLite 数据库，因此天然满足"每次都从预设初始数据重新执行"的要求，不需要任何服务端状态管理。
6. Judge0 返回的 stdout（即自动追加的那条 `SELECT *` 的结果）作为执行结果展示。

**统一处理原则**：无论学生写的是 INSERT / UPDATE / DELETE 还是 SELECT，都统一在脚本末尾追加一次针对该候选表的 `SELECT * FROM 表名;` 来展示表的最终状态。这样处理逻辑不需要按语句类型分支。如果学生自己写的也是 SELECT，输出里会同时包含学生查询的结果和追加查询的表状态，两者都展示，不做去重。

## 候选数据表内容

新增配置文件 `codenext/src/data/sqlTables.ts`（格式参考现有 `templates.ts`），包含 3 张独立的单表教学数据：

1. **`students`（学生成绩表）**：`id, name, class, score`，8 条示例数据，分数、班级有区分度，适合 WHERE / UPDATE / DELETE 练习。
2. **`employees`（员工工资表）**：`id, name, department, salary, hire_date`，8 条示例数据，适合按部门分组、调整工资、按日期筛选。
3. **`products`（商品库存表）**：`id, name, category, price, stock`，8 条示例数据，适合新增商品（INSERT）、调整库存（UPDATE）、下架缺货商品（DELETE）。

每张表都是独立单表，不带外键关联，保持题目简单易懂。每条配置包含：`{ id, label, description, tableName, setupSql, previewRows }`。

## UI 改动

沿用"每种语言一套专属布局"的现有模式（Turtle 已是先例）：

- **`SelectLanguage.vue`**：语言列表新增 `["sql", "SQL"]`。
- **`CodeEditor.vue`**：`language === "sql"` 时引入 `@codemirror/lang-sql`（新依赖）做语法高亮，替换现有 python()/cpp() 的判断分支。
- **`Content.vue`**：新增分支 `v-else-if="code.language === 'sql'"`，渲染新组件 `SqlSection.vue`，替代原有的 Input/Output 分栏（SQL 场景不需要 stdin）。

**`SqlSection.vue` 内部结构**：
1. 顶部：候选表下拉选择器。
2. 表结构 + 初始数据只读预览（帮助学生了解字段和数据，避免瞎猜）。
3. 中间：复用现有 `CodeSection`（学生写 SQL 的编辑器，本身不需要改动）。
4. 底部：结果区，复用现有 `OutputSection`（纯文本展示 Judge0 返回的 stdout），不做高亮/diff，保持简单。

**其他必改点**（沿用现有语言接入的固定套路）：
- `types.ts`：`LANGUAGE` 联合类型新增 `"sql"`。
- `templates.ts`：`languageToId` 新增 `sql: 82`。
- `composables/code.ts`：`cache.code` 及分享链接（`?share=`）白名单加入 `sql`。
- 新增 `composables/sqlTable.ts`：管理"当前选中的候选表"这一状态（选中的表 id，随语言切换重置为默认表）。

后端 `codeapinew` 不需要任何改动。

## 已排除的方案（非目标）

- **不做自动判题/评分**：没有"标准答案"比对，考察由老师人工完成。
- **不做持久会话/状态累积**：每次运行都基于预设初始数据重新执行，不支持像真实数据库会话那样跨多次提交累积状态（若未来需要，需引入客户端 SQLite WASM，如 sql.js，这是一次单独的架构变更）。
- **不做前后对比高亮**：只展示执行后的最终表状态文本，不做逐行 diff 或颜色标注。

## 风险与待确认事项

- **需要确认自建 Judge0 实例是否已启用 `language_id = 82`（SQLite）**。这一点无法从代码层面确认，需要访问该 Judge0 实例的 `/languages` 接口核实；若未启用，需要找 Judge0 管理员开启对应语言镜像后此功能才能工作。

## 测试计划

- 手动验证：针对三张候选表分别执行 INSERT / UPDATE / DELETE / SELECT，确认输出符合预期。
- 回归验证：语言切换、分享链接（`?share=`）、localStorage 缓存机制在新增 `sql` 语言后，对其他既有语言（python/c/cpp/turtle）无影响。
