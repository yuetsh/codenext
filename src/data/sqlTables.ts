export interface SqlTablePreset {
  id: string
  label: string
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
    tableName: "students",
    setupSql: studentsSetupSql,
  },
  {
    id: "employees",
    label: "员工工资表",
    tableName: "employees",
    setupSql: employeesSetupSql,
  },
  {
    id: "products",
    label: "商品库存表",
    tableName: "products",
    setupSql: productsSetupSql,
  },
]

export const defaultSqlTableId = sqlTables[0].id
