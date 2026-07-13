# Carrd Canonical Migration Contract

## Суть

Этот документ задаёт implementation-ready контракт для `v1` процесса `arbitrary Carrd site -> miniGree canonical markup`.

Цель не в том, чтобы "AI редактировал Carrd", а в том, чтобы deterministic migration engine приводил сайт к канону через:

- frozen live canon snapshot;
- deterministic scan and plan;
- AI only for narrow semantic resolution;
- operator approvals on irreversible actions;
- final verdict without false `PASS`.

## Ядро

### Назначение

Использовать перед реализацией:

- migration engine;
- semantic resolver;
- structural mutation adapters;
- persistence verification;
- publish/save workflow;
- rollout and review gates.

Не использовать как замену site-specific runbook или live operation report.

### V1 mission

`v1` покрывает только один migration profile:

- source: arbitrary Carrd site
- target: `miniGree` canonical markup

Это не universal framework для любых будущих канонов.

### Success contract

#### Final states

Каждый run обязан завершаться ровно одним состоянием:

- `PASS`
- `BLOCKED`
- `ROLLED_BACK`

Состояние `PASS` запрещено, если хотя бы один обязательный слой проверки не доказан.

#### What 100% means

Для `v1` "100%" означает:

- система не выдаёт ложный `PASS`;
- сложный кейс может потребовать manual resolution step;
- unsupported auto-path не маскируется под успех.

Это не обещание `100%` fully automatic migrations без участия человека.

### Canon contract

#### Canon source per run

Для каждого run каноном считается live snapshot текущего `miniGree`, снятый в начале запуска.

Обязательные правила:

- перед migration всегда выполняется fresh scan canonical site;
- snapshot замораживается на весь run;
- run не меняет canon посреди исполнения;
- если live canon изменился после freeze, текущий run не переинтерпретируется.

#### Canon drift

Если live `miniGree` и approved local schema расходятся:

1. собрать drift report;
2. обновить canon snapshot;
3. продолжать migration только после human approval.

### Scope contract

#### Read and write boundary

- Source site всегда `read-only`.
- Меняется только явно указанный target draft.
- Publish surface не трогается без отдельного operator approval.

#### Design vs canon

Главная цель: привести разметку к канону.

Визуальная цель:

- максимально сохранить визуальный результат исходного сайта;
- допускать контролируемые визуальные изменения, если они нужны для канонической структуры;
- не считать исходный дизайн более важным, чем каноническую структуру.

### Automation contract

#### Default strategy

Использовать strict cascade:

1. deterministic resolver
2. registry/profile bindings
3. structural signatures
4. content/action signatures
5. AI high-confidence semantic resolution
6. manual resolution step

Если шаг выше даёт доказуемый ответ, нижние шаги не используются.

#### AI usage

AI разрешён только для semantic ambiguity, которую нельзя снять deterministic path.

AI запрещён:

- для already mapped targets;
- для unchanged repeat runs;
- для операций, где deterministic binding уже существует.

AI может auto-resolve ambiguity только при `high-confidence`.

Если `high-confidence` не доказан, процесс обязан перейти в manual resolution step, а не угадывать.

#### Structural auto-mutation default

Этот контракт принимает консервативное правило по умолчанию для `v1`:

auto structural mutation разрешена только если для операции существуют все четыре условия:

- `precondition`
- `inverse` or rollback path
- `persistence proof`
- `post-check`

Если хотя бы одно условие отсутствует, операция не входит в `auto path`.

### Irreversibility contract

#### Forbidden by default

Запрещено:

- `reload without save`;
- любое действие, способное уничтожить unsaved draft changes;
- silent destructive mutation;
- silent publish;
- silent rollback.

#### Approval gates

Human approval обязателен перед:

- destructive operations;
- `save`;
- `publish`;
- `rollback`.

### Execution contract

#### Required pipeline

Каждый run должен проходить по одному и тому же pipeline:

1. resolve source and target
2. scan source site
3. scan live `miniGree`
4. freeze canon snapshot
5. build deterministic structural model
6. resolve semantic mapping
7. compile dry-run migration plan
8. collect required approvals
9. apply operations
10. save only by explicit approval
11. verify persistence
12. verify structure, content, visual result
13. emit final verdict

#### Dry-run

Dry-run обязателен перед apply.

Dry-run должен показывать минимум:

- resolved canon snapshot id;
- operations summary;
- ambiguity list;
- required approvals;
- expected verification gates.

#### Manual resolution step

Если остаются спорные узлы, partial success не допускается.

Процесс обязан:

1. остановиться на manual resolution step;
2. получить решение по спорным узлам;
3. продолжить тот же run с тем же frozen canon snapshot.

### Operation model

#### Required operation classes

`v1` должен опираться на closed operation set, а не на свободные ad hoc мутации.

Минимальный набор:

- `PRESERVE`
- `ANNOTATE`
- `SET_FIELD`
- `SET_CONTENT`
- `SET_STYLE`
- `SET_ATTRIBUTE`
- `INSTALL_EMBED`
- `REPLACE_EMBED`
- `CREATE_COMPONENT`
- `MOVE_COMPONENT`
- `DELETE_COMPONENT`
- `WRAP_COMPONENT`
- `UNWRAP_COMPONENT`
- `MANUAL_REQUIRED`

#### Operation requirements

Каждая операция обязана иметь:

- stable id;
- target binding;
- preconditions;
- expected before state;
- expected after state;
- allowed execution strategy;
- inverse or rollback strategy;
- assertions for verification.

### Persistence contract

Readback из in-memory Builder state не считается доказательством сохранения.

Операция считается persisted только если подтверждены все нужные слои:

- Builder readback;
- no unexpected diff;
- post-save state;
- reconnect or reopen readback when required;
- publish/readback when run includes publish.

Если Builder временно показывает изменения, но они не переживают persistence boundary, это не успех операции.

### Verification contract

#### PASS conditions

`PASS` разрешён только если одновременно выполнены:

- mapping fully resolved or explicitly operator-approved;
- applied operations equal approved plan;
- no unexpected changes detected;
- required persistence checks green;
- required published checks green when publish was in scope;
- required visual checks green.

#### Required verification layers

Минимум пять слоёв:

1. schema/canon verification
2. Builder readback verification
3. persistence verification
4. published verification
5. visual verification

#### Failure policy

- `BLOCKED` — нет безопасного следующего шага без человека, drift unresolved, ambiguity unresolved, unsupported operation, missing approval, missing proof.
- `ROLLED_BACK` — apply начался, но run завершён откатом в допустимое состояние.
- `FAIL` как конечный product-state не используется; воспроизводимый дефект должен приводить либо к `BLOCKED`, либо к `ROLLED_BACK`, с defect evidence в run artifact.

### Minimal evidence contract

User-facing output может быть compact, но system evidence обязана сохранять минимум:

- run id
- source ref
- target ref
- frozen canon snapshot id
- mapping summary
- operation list
- approvals log
- verification verdict

Без этого невозможны review, rollback audit и defect triage.

### V1 scope

#### In scope

- one migration profile: arbitrary site -> `miniGree`
- deterministic source scan
- live canon freeze
- semantic resolution cascade
- dry-run plan compiler
- operator approval gates
- allowlisted structural/content/style mutations
- persistence verification
- final verdict contract

#### Out of scope

- universal multi-canon migration framework
- blind full-AI migration
- silent publish/save
- automatic canon rewrite during active run
- unsupported operation classes without proof model

### Acceptance criteria

- AC-01: source site never mutates.
- AC-02: target site is explicit and unique before apply.
- AC-03: every run has a frozen canon snapshot.
- AC-04: no ambiguity is auto-applied below `high-confidence`.
- AC-05: unchanged repeat run does not invoke AI.
- AC-06: every auto structural operation has `precondition + inverse + persistence proof + post-check`.
- AC-07: `reload without save` never occurs in migration flow.
- AC-08: destructive operations, `save`, `publish`, `rollback` require recorded approval.
- AC-09: dry-run is mandatory before apply.
- AC-10: in-memory Builder readback alone cannot produce `PASS`.
- AC-11: persistence failure cannot produce `PASS`.
- AC-12: visual verification is required for final success on target scope.
- AC-13: unresolved nodes route to manual resolution step, not silent fallback.
- AC-14: final verdict is always exactly one of `PASS`, `BLOCKED`, `ROLLED_BACK`.

## Детали

### Implementation plan

#### Phase 0. Verdict and persistence baseline

Сначала реализовать state machine и proof rules:

- verdict contract;
- approval logging;
- persistence checkpoints;
- no-false-pass guards.

Без этого любая последующая automation небезопасна.

#### Phase 1. Canon snapshot layer

Реализовать:

- live `miniGree` scanner;
- frozen canon snapshot artifact;
- drift detection versus approved schema;
- approval gate for canon refresh.

#### Phase 2. Deterministic source normalization

Реализовать:

- source inventory;
- normalized structural graph;
- stable fingerprints;
- repeat-run determinism checks.

#### Phase 3. Semantic resolver cascade

Реализовать:

- exact marker/class/id binding;
- profile/registry bindings;
- structural and content signatures;
- AI high-confidence resolver;
- manual resolution fallback.

#### Phase 4. Migration IR

Реализовать closed operation set, compile pipeline и dry-run output.

#### Phase 5. Mutation adapters

Реализовать execution adapters по стратегиям:

- state-write API path;
- panel/API path;
- UI automation path;
- manual-required path.

Каждый adapter обязан публиковать capability boundaries, а не притворяться универсальным.

#### Phase 6. Transaction and rollback

Реализовать:

- checkpoints;
- before/after snapshots;
- inverse execution path;
- rollback verdict path.

#### Phase 7. Multi-layer verification

Реализовать:

- Builder readback checks;
- persistence checks;
- published checks;
- visual checks;
- unexpected-diff detection.

#### Phase 8. Benchmark corpus

Собрать corpus минимум из таких классов:

- already canonical
- arbitrary but supported
- ambiguous semantic blocks
- unsupported structural pattern
- save/persistence failure
- publish failure
- rollback-required run
- repeat deterministic re-run

Главные метрики:

- false `PASS` = `0`
- deterministic repeat drift = `0`
- unsupported auto-apply = `0`
- approval bypass = `0`

### Readiness to build

Реализацию можно начинать после подтверждения этого контракта как owner-doc для `v1`.

Первый практический старт:

1. persistence/verdict layer
2. frozen canon snapshot
3. deterministic source normalizer

Пока persistence слой не доказан, structural migration и publish-facing promises не должны считаться ready.

### Related docs

- `cardbuilder/docs/shared/guides/CARRD_BROWSER_CONTROL_ARCHITECTURE.md`
- `cardbuilder/docs/shared/guides/CARRD_BROWSER_CONTROL_IMPLEMENTATION_PLAN.md`
- `cardbuilder/docs/shared/guides/CARRD_MCP_V1_GUIDE.md`
- `cardbuilder/docs/projects/main-template/LIVE-SCENARIO-TESTING-PLAN.md`
- `ROADMAP.md`
- `OPEN-QUESTIONS.md`
