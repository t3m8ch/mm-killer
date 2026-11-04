import { existsSync, readFileSync } from "node:fs";
const valid = (name) => /^[a-z][a-z0-9-]*$/.test(name) || "Use kebab-case";
export default function generators(plop) {
  plop.setActionType("validate-module", (answers) => {
    if (
      valid(answers.name) !== true ||
      [
        "class",
        "default",
        "import",
        "export",
        "new",
        "var",
        "const",
        "let",
        "function",
        "return",
        "delete",
        "typeof",
        "void",
        "null",
        "true",
        "false",
      ].includes(answers.name)
    )
      throw new Error("Недопустимое имя модуля");
    if (existsSync(`src/modules/${answers.name}`) || existsSync(`migrations/${answers.name}.sql`))
      throw new Error("Модуль уже существует");
    for (const [file, markers] of Object.entries({
      "src/app/api.ts": ["// plop:imports", "// plop:api"],
      "easement.yml": [
        "# plop:components",
        "# plop:rules",
        "# plop:app-dependencies",
        "# plop:test-dependencies",
      ],
    })) {
      const text = readFileSync(file, "utf8");
      for (const marker of markers)
        if (!text.includes(marker)) throw new Error(`Нет маркера ${marker} в ${file}`);
    }
    return "Новый модуль проверен";
  });
  plop.setActionType("validate-procedure", (answers) => {
    if (valid(answers.module) !== true || valid(answers.name) !== true)
      throw new Error("Недопустимое имя");
    if (existsSync(`src/modules/${answers.module}/${answers.name}.scenarios.md`))
      throw new Error("Процедура уже существует");
    for (const [file, marker] of [
      ["contract.ts", "// plop:contracts"],
      ["api.ts", "// plop:handlers"],
    ]) {
      if (!readFileSync(`src/modules/${answers.module}/${file}`, "utf8").includes(marker))
        throw new Error(`Нет маркера ${marker}`);
    }
    return "Процедура проверена";
  });
  plop.setGenerator("module", {
    description: "Создать автономный CRUD модуль",
    prompts: [{ type: "input", name: "name", validate: valid }],
    actions: [{ type: "validate-module" }]
      .concat(
        ["contract.ts", "api.ts", "schema.ts", "index.ts", "api.test.ts"].map((file) => ({
          type: "add",
          path: `src/modules/{{name}}/${file}`,
          templateFile: `generators/module/${file}.hbs`,
          abortOnFail: true,
        })),
      )
      .concat([
        {
          type: "add",
          path: "migrations/{{name}}.sql",
          templateFile: "generators/module/migration.sql.hbs",
        },
        {
          type: "append",
          unique: false,
          path: "src/app/api.ts",
          pattern: "// plop:imports",
          template: "import { api as {{camelCase name}} } from '../modules/{{name}}';",
        },
        {
          type: "append",
          unique: false,
          path: "src/app/api.ts",
          pattern: "// plop:api",
          template: "  {{camelCase name}},",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          pattern: "  # plop:components",
          template:
            "  {{name}}: { in: src/modules/{{name}}, public: [src/modules/{{name}}/index.ts] }",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          pattern: "  # plop:rules",
          template: "  {{name}}: { may_depend_on: [platform] }",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          pattern: "      # plop:app-dependencies",
          template: "      - {{name}}",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          pattern: "      # plop:test-dependencies",
          template: "      - {{name}}",
        },
      ]),
  });
  plop.setGenerator("screen", {
    description: "Создать экран Mantine",
    prompts: [{ type: "input", name: "name", validate: valid }],
    actions: [
      {
        type: "add",
        path: "src/routes/{{name}}.tsx",
        template:
          "import { createFileRoute } from '@tanstack/react-router';\nimport { Title } from '@mantine/core';\nexport const Route = createFileRoute('/{{name}}')({ component: () => <Title>{{name}}</Title> });\n",
      },
    ],
  });
  plop.setGenerator("procedure", {
    description: "Создать custom процедуру со сценариями",
    prompts: [
      { type: "input", name: "module", validate: valid },
      { type: "input", name: "name", validate: valid },
    ],
    actions: [
      { type: "validate-procedure" },
      {
        type: "append",
        unique: false,
        path: "src/modules/{{module}}/contract.ts",
        pattern: "// plop:contracts",
        template:
          "  {{camelCase name}}: oc.input(z.object({})).output(z.object({})).errors({ NOT_IMPLEMENTED: {} }),",
      },
      {
        type: "append",
        unique: false,
        path: "src/modules/{{module}}/api.ts",
        pattern: "// plop:handlers",
        template:
          "  {{camelCase name}}: os.{{camelCase name}}.handler(({ errors }) => { throw errors.NOT_IMPLEMENTED(); }),",
      },
      {
        type: "add",
        path: "src/modules/{{module}}/{{name}}.scenarios.md",
        template:
          "# {{name}}\n\nПеред реализацией описать наблюдаемые результаты:\n\n- успешный сценарий\n- недопустимый вход\n- отсутствие объекта\n- отсутствие права\n- конкурентный вызов, если меняется инвариант\n",
      },
    ],
  });
}
