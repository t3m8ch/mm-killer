# MergeMinds

Каркас платформы курсов: TanStack Start, Mantine, oRPC и настоящий Postgres.
Предметные модули добавляются генератором; главная страница пока содержит название проекта.

## Локальный запуск

Нужны Podman и [mise](https://mise.jdx.dev/getting-started.html).

`compose.dev.yaml` поднимает только Postgres для локальной разработки.
Само приложение запускается отдельно командой `pnpm dev`, как показано ниже.

```sh
mise trust
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- hk install --mise
mise exec -- podman compose -f compose.dev.yaml up -d
mise exec -- pnpm db:migrate
mise exec -- pnpm dev
```

Приложение слушает порт 3000. Postgres доступен только на loopback:54329.
Локальные значения DATABASE_URL и TEST_DATABASE_URL заданы в mise.toml;
образец приведён в `.env.example`. Вне mise переменные можно передать напрямую.
Тестовый пользователь Postgres должен иметь CREATEDB; тесты создают временные
БД с префиксом `mm_template_`/`mm_test_` и удаляют их по завершении.

## Production-запуск

`pnpm build` создаёт `.output/` через Nitro; `pnpm start` запускает готовую сборку.
Сервер и миграции требуют `DATABASE_URL` из окружения. Для сборки БД не нужна.
HTTP-порт задаётся через `HOST`/`PORT`, миграции выполняются отдельным процессом.
Порядок выпуска, сигналы завершения и применение 12 факторов описаны в
[договорённостях о запуске](docs/development/deployment.md).

## Проверки

```sh
mise run check
mise exec -- pnpm test:guards
mise exec -- pnpm test:bundle
mise exec -- pnpm test
mise exec -- pnpm build
mise exec -- pnpm test:runtime
mise exec -- pnpm exec playwright install chromium
mise exec -- pnpm test:e2e
mise exec -- lychee --no-progress README.md 'docs/**/*.md'
```

`pnpm typecheck` запускает oxlint с `--type-aware --type-check`, включая
исчерпывающий switch. Отдельного tsc или ESLint нет. `test:guards` проверяет запрещённые примеры в отдельной временной копии проекта.
`pnpm test` там же генерирует модуль и проверяет его API на Postgres и очистку БД.
Временные копии удаляются после выполнения; исходное дерево проекта не меняется.

Git-хуки: pre-commit форматирует и проверяет линт/Actions; commit-msg проверяет
Conventional Commits; pre-push проверяет типы, архитектуру и неиспользуемый код.
Тесты Postgres, сборка и ссылки выполняются в CI.

## Миграции

Конфигурация `drizzle.config.ts` собирает схемы из `src/modules/*/schema.server.ts`.
После изменения существующей схемы создать и проверить миграцию:

```sh
mise exec -- pnpm db:generate --name add_course_title
mise exec -- pnpm db:migrate
```

Новые каталоги в `migrations/` с SQL и снимком схемы нужно коммитить вместе.
Drizzle применяет миграции через штатный `drizzle-orm/node-postgres/migrator`
и хранит историю в `drizzle.__drizzle_migrations`. Тестовая БД-шаблон создаётся
тем же мигратором. Миграции запускаются отдельной командой, а не при старте
каждого экземпляра приложения. При ошибке генерации после создания модуля
исправить схему и повторить `pnpm db:generate`; повторять Plop не нужно.

## Инструменты

Точные версии зависимостей закреплены в `package.json` и `pnpm-lock.yaml`,
системных инструментов — в `mise.toml`. Совместимость проверяется сборкой,
проверкой типов и API-тестами на Postgres.

[Easement](https://github.com/mokevnin/easement#readme) устанавливается через
mise из GitHub и использует SCIP-индексатор `@sourcegraph/scip-typescript`
из devDependencies. Команды pnpm добавляют `node_modules/.bin` в PATH.
Исключения knip учитывают запуск индексатора из easement и commitlint из hk;
публичные точки входа модулей перечислены в `entry`. Зависимость `@orpc/contract`
используется шаблонами генератора, поэтому также отмечена в исключениях knip.

[Плагин oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) запрещает
в предметных модулях `className`, `style`, импорт CSS, raw SQL, прямой драйвер
Postgres и низкоуровневые `query`/`execute`. Схемы остаются внутренними файлами
модулей; easement запрещает их импорт через границу модуля.

Для установленного Drizzle подключение передаётся как `drizzle({ client: pool })`;
прежняя сигнатура с Pool не проходит проверку типов. Браузерный раннер —
Playwright с Chromium: сервер занимает отдельный порт 4312 со `strictPort`
и без переиспользования чужого процесса.

## Генерация

```sh
mise exec -- pnpm generate module notes
mise exec -- pnpm generate module documents --updatedAt --updatedBy
mise exec -- pnpm generate procedure notes archive
mise exec -- pnpm generate screen notes
mise exec -- pnpm db:migrate
```

Генерация разовая. Plop создаёт контракт, CRUD, Drizzle-схему и API-тест.
Затем `drizzle-kit generate` создаёт SQL-миграцию из схем всех модулей;
вручную синхронизировать SQL-шаблон и схему не нужно.
Генератор создаёт одну таблицу с именем модуля в snake_case, без дополнительного суффикса.
ID и ссылки на пользователей используют PostgreSQL `bigint` и JavaScript `bigint`;
контракт ограничивает их положительным диапазоном знакового 64-битного числа.
`IDENTITY` автоматически выдаёт ID, oRPC сохраняет `bigint` при передаче. В URL
ID представляется десятичной строкой; преобразовывать его через `Number` нельзя.
По умолчанию таблица содержит только `id` и `createdAt`; предметные поля добавляются при реализации модуля.
Без флагов `update` возвращает `NOT_IMPLEMENTED`, пока не определены изменяемые поля.
Независимые флаги `--updatedAt` и `--updatedBy` добавляют поля аудита в таблицу и контракт:
при создании они `null`, при обновлении заполняются сервером. В этом варианте
`update` уже обновляет выбранные метаданные; предметные изменения добавляются в его обработчик.
`updatedAt` берётся из `context.now()`, `updatedBy` — из `context.user.id` после проверки входа через `authed`.
Если включён `--updatedBy`, обновление без пользователя отклоняется с `UNAUTHORIZED`.
Сервер пока не заполняет `userId`: это сделает будущая авторизация. Внешний ключ на
пользователя нужно добавить после появления таблицы пользователей. Вход API не принимает
поля аудита; клиентские значения игнорируются. Оба флага по умолчанию выключены.
Модуль регистрируется в сборке API и архитектурном графе через явные маркеры.
Новые модули по умолчанию зависят только от платформы. Дополнительные связи
должны соответствовать [согласованному графу](docs/development/architecture.md).
Custom-процедура получает типизированную ошибку NOT_IMPLEMENTED и документ
сценариев, которые следует уточнить до реализации. Экран получает Mantine-каркас.
Ручные изменения после генерации принадлежат модулю; повторная генерация
существующего модуля запрещена. Перед генерацией сохранить текущую работу.

API-тесты работают с мигрированной БД-шаблоном, отдельной БД воркера и откатом
транзакции на тест. Гонки используют отдельную БД и независимые соединения.
Часы передаются через контекст. Мутации оборачиваются транзакционной middleware.
Основные сценарии проверяются через публичный API без HTTP. Конфигурация Playwright
подготовлена, но предметных e2e-тестов пока нет. `pnpm test:e2e` допускает пустой набор
через `--pass-with-no-tests`; флаг нужно убрать при добавлении первого предметного сценария.

[Архитектура](docs/development/architecture.md) · [Словарь](GLOSSARY.md)
