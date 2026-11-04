export default {
  meta: { name: "project" },
  rules: {
    "module-boundaries": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          ui: "Использовать Mantine без собственного CSS, className и style",
          sql: "Записывать только свои таблицы через Drizzle; сырой SQL оставлять платформе и миграциям",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename();
        if (!filename.includes("/src/modules/") || filename.endsWith(".test.ts")) return {};
        return {
          JSXAttribute(node) {
            if (["className", "style"].includes(node.name.name))
              context.report({ node, messageId: "ui" });
          },
          ImportDeclaration(node) {
            if (/\.(css|scss|sass|less)$/.test(node.source.value))
              context.report({ node, messageId: "ui" });
            if (
              node.source.value === "drizzle-orm" &&
              node.specifiers.some((item) => item.imported?.name === "sql")
            )
              context.report({ node, messageId: "sql" });
            if (["pg", "postgres", "node:child_process"].includes(node.source.value))
              context.report({ node, messageId: "sql" });
          },
          MemberExpression(node) {
            if (["execute", "query", "$client"].includes(node.property.name))
              context.report({ node, messageId: "sql" });
          },
        };
      },
    },
  },
};
