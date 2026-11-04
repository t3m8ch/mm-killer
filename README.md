# MergeMinds

Каркас платформы курсов: TanStack Start, Mantine, oRPC и настоящий Postgres.
Учебный модуль `example` демонстрирует создание и чтение записей из браузера.
Он также содержит сгенерированные get/list/create/update/delete и API-тест.

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

## Проверки

```sh
mise run check
mise exec -- pnpm test:guards
mise exec -- pnpm test
mise exec -- pnpm build
mise exec -- pnpm exec playwright install chromium
mise exec -- pnpm test:e2e
mise exec -- lychee --no-progress README.md 'docs/**/*.md'
```

`pnpm typecheck` запускает oxlint с `--type-aware --type-check`, включая
исчерпывающий switch. Отдельного tsc или ESLint нет. `test:guards` временно
добавляет запрещённые примеры, проверяет диагностические сообщения и удаляет
файлы; запускать его отдельно от остальных проверок и редакторских сборок.

Git-хуки: pre-commit форматирует и проверяет линт/Actions; commit-msg проверяет
Conventional Commits; pre-push проверяет типы, архитектуру и неиспользуемый код.
Тесты Postgres, сборка и ссылки выполняются в CI.

## Инструменты

Точные версии зависимостей закреплены в `package.json` и `pnpm-lock.yaml`,
системных инструментов — в `mise.toml`. Совместимость проверяется сборкой,
проверкой типов, API-тестами на Postgres и браузерным сценарием.

[Easement](https://github.com/mokevnin/easement#readme) устанавливается через
mise из GitHub и использует SCIP-индексатор `@sourcegraph/scip-typescript`
из devDependencies. Команды pnpm добавляют `node_modules/.bin` в PATH.
Исключения knip учитывают запуск индексатора из easement и commitlint из hk;
публичные точки входа модулей перечислены в `entry`.

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
mise exec -- pnpm generate procedure notes archive
mise exec -- pnpm generate screen notes
mise exec -- pnpm db:migrate
```

Генерация разовая. Модуль получает контракт, CRUD, таблицу, миграцию и API-тест;
он регистрируется в сборке API и архитектурном графе через явные маркеры.
Новые модули по умолчанию зависят только от платформы. Дополнительные связи
должны соответствовать [согласованному графу](docs/development/architecture.md).
Custom-процедура получает типизированную ошибку NOT_IMPLEMENTED и документ
сценариев, которые следует уточнить до реализации. Экран получает Mantine-каркас.
Ручные изменения после генерации принадлежат модулю; повторная генерация
существующего модуля запрещена. Перед генерацией сохранить текущую работу.

API-тесты работают с мигрированной БД-шаблоном, отдельной БД воркера и откатом
транзакции на тест. Гонки используют отдельную БД и независимые соединения.
Часы передаются через контекст. Мутации оборачиваются транзакционной middleware.
Основные сценарии проверяются без HTTP; Playwright проверяет настоящее
приложение, сохранение записи и её наличие после перезагрузки.

[Архитектура](docs/development/architecture.md) · [Словарь](GLOSSARY.md)
