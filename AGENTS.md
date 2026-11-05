# AGENTS.md

## Agent skills

### Issue tracker

Issues live in GitHub Issues of `t3m8ch/mm-killer`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. Documentation is written in Russian with Russian terms; every glossary term carries its English equivalent. See `docs/agents/domain.md`.

### Runtime and deployment

При изменении конфигурации, подключения внешних сервисов, хранения состояния или запуска и завершения процессов соблюдать [договорённости о запуске и 12 факторах](docs/development/deployment.md).

## Code readability

Разделять логические этапы кода пустыми строками: подготовку данных, выполнение действия и проверку или возврат результата. Выбирать границы по смыслу; ограничение линтера на семь стейтментов подряд — дополнительный сигнал пересмотреть группировку.

## Pull requests

Вливать PR через rebase merge (`gh pr merge --rebase`).

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/). The type, optional scope and `!` are in English; the description and body are in Russian, starting lowercase, in the infinitive, without a trailing period.

```
feat: установить скиллы
fix(parser): не терять последнюю строку файла
refactor!: перенести хранение сессий в Postgres

Тело коммита, если нужно, тоже по-русски.

BREAKING CHANGE: старый формат сессий больше не читается.
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. Footer tokens (`BREAKING CHANGE`, `Refs`, `Co-Authored-By`) stay in English.
