const cSource =
  "#include<stdio.h>\r\n\r\nint main()\r\n{\r\n    \r\n    return 0;\r\n}"
const cppSource =
  "#include<iostream>\r\n\r\nusing namespace std;\r\n\r\nint main()\r\n{\r\n    \r\n    return 0;\r\n}"
const pythonSource = ""
const javaSource =
  "public class Main {\r\n    public static void main(String[] args) {\r\n        \r\n    }\r\n}"

export const languageToId = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
}

export const sources = {
  c: cSource,
  cpp: cppSource,
  java: javaSource,
  python: pythonSource,
}
