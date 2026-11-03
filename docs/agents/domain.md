# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root, or
- **`GLOSSARY-MAP.md`** at the repo root if it exists: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `GLOSSARY-MAP.md` at the root):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

## Language: Russian

Project documentation is written in Russian, using Russian domain terms: `GLOSSARY.md`, ADRs in `docs/adr/`, anything else under `docs/` (except `docs/agents/`, which is agent configuration), and issue and spec bodies in the tracker. Code identifiers stay in English.

This overrides the English examples in `/domain-modeling`'s `GLOSSARY-FORMAT.md` and `ADR-FORMAT.md`: keep their structure, write the content in Russian.

### Glossary entries

Every term is a Russian term with its English equivalent, the name the concept carries in code. The Russian term is the canonical one in prose; the English one is what identifiers use.

```md
# {Название контекста}

{Одно-два предложения: что это за контекст и зачем он нужен.}

## Язык

**Заказ** (_англ._ Order):
{Одно-два предложения: что это такое.}
_Избегать_: покупка, транзакция

**Счёт** (_англ._ Invoice):
Требование оплаты, которое отправляется клиенту после доставки.
_Избегать_: квитанция, запрос на оплату
```

When a term is already established in English in this domain and has no natural Russian equivalent, keep the English word as the Russian term too, and still list it under `_англ._`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
