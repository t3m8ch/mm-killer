export default {
  meta: { name: "project" },
  rules: {
    "max-unseparated-statements": {
      meta: {
        type: "suggestion",
        schema: [],
        messages: {
          split: "Семь стейтментов подряд без пустой строки: разделить код на логические группы",
        },
      },
      create(context) {
        const source = context.sourceCode;

        function check(statements) {
          let count = 0;
          let previous;

          for (const statement of statements) {
            if (statement.type === "ImportDeclaration") {
              count = 0;
              previous = undefined;
              continue;
            }

            const gap = previous && source.text.slice(previous.range[1], statement.range[0]);

            count = !previous || /\n[\t ]*\r?\n/.test(gap) ? 1 : count + 1;
            previous = statement;

            if (count === 7) {
              context.report({ node: statement, messageId: "split" });
            }
          }
        }

        return {
          Program: (node) => check(node.body),
          BlockStatement: (node) => check(node.body),
          StaticBlock: (node) => check(node.body),
          SwitchCase: (node) => check(node.consequent),
        };
      },
    },
    "module-boundaries": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          ui: "Использовать Mantine без собственного CSS, className и style",
          environment: "Файл модуля должен иметь суффикс .server, .shared, .ui или .browser",
          sql: "Записывать только свои таблицы через Drizzle; сырой SQL оставлять платформе и миграциям",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename();

        const checkEnvironment = (node) => {
          if (!/\.(server|shared|ui|browser)\.tsx?$/.test(filename)) {
            context.report({ node, messageId: "environment" });
          }
        };

        if (filename.endsWith(".test.ts")) {
          return {};
        }

        if (!filename.includes("/src/modules/")) {
          return filename.includes("/src/platform/") ? { Program: checkEnvironment } : {};
        }

        return {
          Program: checkEnvironment,
          JSXAttribute(node) {
            if (["className", "style"].includes(node.name.name)) {
              context.report({ node, messageId: "ui" });
            }
          },
          ImportDeclaration(node) {
            if (/\.(css|scss|sass|less)$/.test(node.source.value)) {
              context.report({ node, messageId: "ui" });
            }

            if (
              node.source.value === "drizzle-orm" &&
              node.specifiers.some((item) => item.imported?.name === "sql")
            ) {
              context.report({ node, messageId: "sql" });
            }

            if (["pg", "postgres", "node:child_process"].includes(node.source.value)) {
              context.report({ node, messageId: "sql" });
            }
          },
          MemberExpression(node) {
            if (["execute", "query", "$client"].includes(node.property.name)) {
              context.report({ node, messageId: "sql" });
            }
          },
        };
      },
    },
  },
};
