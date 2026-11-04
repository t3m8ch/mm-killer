import { existsSync, readFileSync } from "node:fs";
const domainModules = new Set([
  "courses",
  "invitations",
  "tasks",
  "attempts",
  "reviews",
  "git",
  "notifications",
]);
const keepDomainGraph = (answers) =>
  domainModules.has(answers.name) ? "Сохранить согласованный граф предметного модуля" : false;
function hasProperty(path, name) {
  // Conservative preflight only. Existing files are changed solely at Plop markers.
  const text = readFileSync(path, "utf8");
  return (
    new RegExp(String.raw`(?:^|[,{\n])\s*(?:${name}|["']${name}["'])\s*(?::|(?=[,}]))`).test(
      text,
    ) || new RegExp(String.raw`\bimport\s*\{[^}]*\bas\s+${name}\b`).test(text)
  );
}
const valid = (name) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || "Use kebab-case";
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
    const property = plop.getHelper("camelCase")(answers.name);
    if (hasProperty("src/app/api.ts", property)) throw new Error("Имя модуля уже занято в API");
    answers.audit = Boolean(answers.updatedAt || answers.updatedBy);
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
    const property = plop.getHelper("camelCase")(answers.name);
    for (const file of ["contract.ts", "api.ts"]) {
      if (hasProperty(`src/modules/${answers.module}/${file}`, property))
        throw new Error("Имя процедуры уже занято");
    }
    return "Процедура проверена";
  });
  plop.setGenerator("module", {
    description: "Создать автономный CRUD модуль",
    prompts: [
      { type: "input", name: "name", validate: valid },
      { type: "confirm", name: "updatedAt", default: false },
      { type: "confirm", name: "updatedBy", default: false },
    ],
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
          skip: keepDomainGraph,
          pattern: "  # plop:components",
          template:
            "  {{name}}: { in: src/modules/{{name}}, public: [src/modules/{{name}}/index.ts] }",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          skip: keepDomainGraph,
          pattern: "  # plop:rules",
          template: "  {{name}}: { may_depend_on: [platform] }",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          skip: keepDomainGraph,
          pattern: "      # plop:app-dependencies",
          template: "      - {{name}}",
        },
        {
          type: "append",
          unique: false,
          path: "easement.yml",
          skip: keepDomainGraph,
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
