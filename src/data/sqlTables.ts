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
