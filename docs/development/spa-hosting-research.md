# Статическая оболочка в Node/Nitro

Проверено для Start `1.169.4` (plugin-core `1.171.55`, server-core `1.169.45`)
и Nitro `3.0.261103-rc`. Используется штатный prerender Nitro и внутренний proxy
через routeRules, без новых обработчиков, плагинов или postbuild patch.

## Причина

[SPA mode Start](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
генерирует `_shell.html` после сборки сервера и требует настроить раздачу на хостинге.
Nitro встраивает индекс public assets при сборке; поздний файл в этот индекс не
попадает. Это подтверждают [#7473](https://github.com/TanStack/router/issues/7473)
и [#7479](https://github.com/TanStack/router/issues/7479).

[Prerender Nitro](https://nitro.build/docs/prerendering) выполняется раньше
финальной сборки сервера: `prerender: { routes: ['/'], failOnError: true }`
создаёт `index.html`, доступный штатной статике. Корневой `ssr: false` Start
оставляет в нём только общую оболочку. [Route rules](https://nitro.build/docs/routing)
направляют GET страниц на `/`, исключая сам `/`, серверные пространства и assets.
Это внутренний proxy того же процесса, не новый reverse proxy или сервис.

## Проверенные варианты

| Вариант в чистой копии                                                 | Результат                                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Удалить ручной fetch, оставить SPA Start                               | React создаёт документ на запрос; файл shell не обслуживается                                                                 |
| `routeRules['/login'].proxy = '/_shell.html'`                          | Сборка проходит; `/login` и `/_shell.html` дают 404 вместо статического файла                                                 |
| `renderer: { template: './.output/public/_shell.html', static: true }` | Config resolve падает: template ещё не существует                                                                             |
| Nitro renderer с существующим исходным HTML                            | Статический HTML работает, но заменяет SSR-service, через который Start обслуживает также RPC/health; требует иной интеграции |
| Nitro prerender `/` и proxy страниц на `/`                             | Чистая сборка без БД; production E2E входа/выхода, равенства оболочки до/после входа и nested URL/refresh проходят            |

Обычный [Nitro renderer](https://nitro.build/docs/renderer) принимает существующий
исходный HTML, а не будущий результат сборки Start. `publicAssets` задаёт каталоги,
но не fallback. `routeRules.static` — кэширование, не выбор HTML-файла.

## Lifecycle и версии

В установленном Nitro разрешение `renderer.template` происходит в config resolver
до `build:before`; создание будущего template в этом hook уже опаздывает.
В установленном Start отдельный `tanstack-start-core:post-build` вызывает
prerender после сборки Nitro. Пользовательский hook, который переставляет эти
стадии, переписывает manifest или повторно собирает сервер, был бы своей
интеграцией, даже при использовании официального hooks API. Здесь он не нужен.

Исторические [Start #5682](https://github.com/TanStack/router/pull/5682) и
[#6256](https://github.com/TanStack/router/pull/6256) исправляли путь вывода и
порядок prerender; [Nitro #3907](https://github.com/nitrojs/nitro/pull/3907) и
[#3908](https://github.com/nitrojs/nitro/pull/3908) — preview process/port.
Они не предоставляют runtime fallback для позднего shell. Подтверждённой новой
пары версий с таким исправлением поиск не установил; обновление не требуется
для проверенного Nitro prerender.

## Границы решения

При сборке React один раз создаёт общий документ; в production GET страниц
обслуживается готовым файлом. Серверный build Start остаётся для RPC и health,
включая стандартные ошибки неизвестных серверных URL. Dev создаёт общий документ
на запрос. Новые пространства серверных путей требуют исключения в routeRules.
Нужны те же Node/Nitro и Postgres, дополнительных процессов нет.

Альтернативы: Start может создавать документ на каждый запрос (проще, но не
выполняет требование статической оболочки); отдельный статический хостинг с
fallback выполняет его, но меняет инфраструктуру; исходный HTML Nitro renderer
требует переделки клиентской и серверной интеграции. Эти изменения не внедрялись.
