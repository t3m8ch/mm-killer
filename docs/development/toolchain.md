# Инструменты

Проверено 4 ноября 2026 года через npm registry, PyPI и upstream-релизы.
Точные версии зависимостей закреплены в package.json и pnpm-lock.yaml;
системных инструментов — в mise.toml. Проверка registry сама по себе не
доказывает совместимость: её дополнительно проверяют сборка, type-check,
API-тесты на Postgres и браузерный сценарий.

Основной набор: Node 24.15.0, pnpm 11.28.10, TypeScript 7.0.2,
TanStack Start 1.169.4, React 19.3.1, oRPC 1.16.1, TanStack Query 5.105.3,
Drizzle 1.0.0-rc.5, Zod 4.6.7, Mantine 9.7.4, Vitest 5.1.0.
Drizzle rc требует `drizzle({ client: pool })`; прежняя сигнатура с Pool
не проходит проверку типов. Postgres 18.1 закреплён также по digest в CI.

Выбран Playwright 1.64.1 с Chromium. Браузерный сервер запускается на отдельном
порту 4312 со strictPort и без переиспользования чужого процесса.

Источники контрактов и установки:

- [TanStack Start: создание проекта](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [oxlint: type-aware и type-check](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [oxlint: JavaScript plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html)
- [easement: установка и формат архитектурных правил](https://github.com/mokevnin/easement#readme)
- [hk: хуки](https://hk.jdx.dev/hooks)
- [jactionlint: правила](https://github.com/jdx/jactionlint/blob/main/docs/rules.md)
- [Podman Compose в PyPI](https://pypi.org/project/podman-compose/)

Easement распространяется через GitHub, не через npm. Он использует
SCIP-индексатор @sourcegraph/scip-typescript из devDependencies; команды mise
и pnpm добавляют node_modules/.bin в PATH. Knip знает о неявном использовании
индексатора easement и CLI commitlint из hk.pkl; бинарник easement управляется
mise. Public entry points модулей перечислены как entry в knip.

Локальные ограничения проверены отрицательными примерами: className/style,
сырой SQL предметного модуля, ошибка типов, неполный switch, зависимость
платформы от модуля, доступ к тестовым хелперам и импорт внутренней схемы.
Схемы не экспортируются через API модулей: запись в чужую таблицу требует
запрещённого импорта. oxlint дополнительно запрещает обход через raw SQL,
прямой драйвер Postgres и низкоуровневые query/execute в предметном коде.
